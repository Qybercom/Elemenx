import { afterEach, describe, expect, it } from 'vitest';
import child from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

var require = createRequire(import.meta.url);
var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
var Builder = require('../../tools/builder.js');
var Docker = require('../../tools/docker.js');
var temporary = [];

/* A project of one Application with one Component, and its package.json. */
function project (config) {
	var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-targets-'));

	temporary.push(folder);

	fs.mkdirSync(path.join(folder, 'application', 'App'), {recursive: true});
	fs.writeFileSync(path.join(folder, 'index.html'), '<!DOCTYPE html><html><head><title>Shop</title></head><body><div id="app"></div><script src="/elemenx.js"></script><script src="/app.js"></script></body></html>');
	fs.writeFileSync(path.join(folder, 'app.js'), "Elemenx.Application('Shop', {$Component: 'App', $Root: 'application', $Mount: '#app'});");
	fs.writeFileSync(path.join(folder, 'application', 'index.js'), "[\n\t'App/App.js'\n]");
	fs.writeFileSync(path.join(folder, 'application', 'App', 'App.js'), "Elemenx.Component('App', {\n\t$Template: '<main>Shop</main>'\n});");
	fs.writeFileSync(path.join(folder, 'package.json'), JSON.stringify({name: '@acme/My Shop', version: '1.4.2'}));

	if (config)
		fs.writeFileSync(path.join(folder, 'elemenx.config.js'), 'module.exports = ' + JSON.stringify(config) + ';\n');

	return folder;
}

function options (extra) {
	return Object.assign({application: 'application', entry: 'app.js', index: 'index.html', out: 'dist', splash: false}, extra || {});
}

afterEach(function () {
	while (temporary.length) fs.rmSync(temporary.pop(), {recursive: true, force: true});
});

describe('Builder: the targets of a build, and a Docker image', function () {
	it('writes the Dockerfile and the nginx of a site: gzip, the routes to the page, no cache for the page, safe headers and its own', function () {
		var config = Docker.Configuration({'Content-Security-Policy': "default-src 'self'", 'X-Say': 'a "quote"'});
		var file = Docker.Dockerfile();

		expect(file).toContain('FROM ' + Docker.Base);
		expect(Docker.Base).toMatch(/^nginx:[\d.]+-alpine$/);
		expect(file).toContain('COPY nginx.conf /etc/nginx/conf.d/default.conf');
		expect(file).toContain('EXPOSE 80');
		expect(file).toContain('HEALTHCHECK');

		expect(config).toContain('gzip on;');
		expect(config).toContain('try_files $uri $uri/ /index.html;');
		expect(config).toContain('location = /healthz');
		expect(config).toContain('add_header Cache-Control "no-cache" always;');
		expect(config).toContain('add_header X-Content-Type-Options "nosniff" always;');
		expect(config).toContain('add_header Content-Security-Policy "default-src \'self\'" always;');
		expect(config).toContain('add_header X-Say "a \\"quote\\"" always;');

		/* A location with an add_header of its own loses the ones of the server: each repeats the safe headers. */
		expect(config.split('X-Content-Type-Options').length - 1).toBe(3);
	});

	it('builds the image with docker when it is there, says how when it is not, and fails then with strict', function () {
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-docker-'));
		var calls = [];
		var said = [];
		var here = function (command, args) {
			calls.push([command].concat(args).join(' '));

			return {status: 0};
		};
		/* No command at all (spawn fails), and a command whose engine does not answer (Docker Desktop closed). */
		var absent = function (command, args) {
			calls.push([command].concat(args).join(' '));

			return {status: null, error: new Error('spawn docker ENOENT')};
		};
		var stopped = function (command, args) {
			calls.push([command].concat(args).join(' '));

			return {status: 1};
		};
		var log = function (text) {
			said.push(text);
		};
		var shop = project();

		temporary.push(folder);

		/* The name and the version of package.json: a scope and spaces are no names of an image. */
		expect(Docker.ImageName(shop, {})).toBe('my-shop:1.4.2');
		expect(Docker.ImageName(shop, {Image: 'registry.example/shop:edge'})).toBe('registry.example/shop:edge');

		expect(Docker.Pack(folder, shop, {}, {Run: here, Log: log})).toEqual({Files: ['Dockerfile', 'nginx.conf', '.dockerignore'], Image: 'my-shop:1.4.2'});
		expect(calls).toEqual(['docker version --format {{.Server.Version}}', 'docker build -t my-shop:1.4.2 ' + folder]);
		/* Regression: nginx.conf in .dockerignore left the COPY of the Dockerfile without its file; the image removes it from the site. */
		expect(fs.readFileSync(path.join(folder, '.dockerignore'), 'utf8')).toBe('Dockerfile\n.dockerignore\n');
		expect(Docker.Dockerfile()).toContain('RUN rm /usr/share/nginx/html/nginx.conf');

		calls = [];

		expect(Docker.Pack(folder, shop, {}, {Run: absent, Log: log}).Image).toBe(null);
		expect(said[said.length - 1]).toBe('Elemenx Builder: docker is not installed here, the image is not built: docker build -t my-shop:1.4.2 ' + folder);
		expect(function () {
			Docker.Pack(folder, shop, {}, {Run: absent, Log: log, Strict: true});
		}).toThrow('docker is not installed here');

		/* Regression: an engine not running was told as docker not installed. */
		expect(Docker.Pack(folder, shop, {}, {Run: stopped, Log: log}).Image).toBe(null);
		expect(said[said.length - 1]).toBe('Elemenx Builder: the engine of docker is not running (start Docker Desktop), the image is not built: docker build -t my-shop:1.4.2 ' + folder);
		expect(function () {
			Docker.Pack(folder, shop, {}, {Run: stopped, Log: log, Strict: true});
		}).toThrow('the engine of docker is not running');

		/* Image false: the files only, docker not asked. */
		calls = [];

		expect(Docker.Pack(folder, shop, {Image: false}, {Run: here, Log: log}).Image).toBe(null);
		expect(calls).toEqual([]);
	});

	it('builds several targets each into a folder of its own, one where its build goes, and refuses a target it does not know', function () {
		var shop = project();
		var made = Builder.BuildTargets(shop, options({dockerSettings: {Image: false}}), ['web', 'single', 'docker']);

		expect(made.map(function (item) {
			return item.Target;
		})).toEqual(['web', 'single', 'docker']);
		expect(fs.existsSync(path.join(shop, 'dist', 'web', 'index.html'))).toBe(true);
		expect(fs.existsSync(path.join(shop, 'dist', 'web', 'app.js'))).toBe(true);
		expect(fs.existsSync(path.join(shop, 'dist', 'single', 'index.html'))).toBe(true);
		expect(fs.existsSync(path.join(shop, 'dist', 'single', 'app.js'))).toBe(false);
		expect(fs.existsSync(path.join(shop, 'dist', 'docker', 'Dockerfile'))).toBe(true);
		expect(fs.existsSync(path.join(shop, 'dist', 'docker', 'index.html'))).toBe(true);

		/* One target: where a build of its own goes. */
		Builder.BuildTargets(shop, options({dockerSettings: {Image: false}}), ['docker']);

		expect(fs.existsSync(path.join(shop, 'dist', 'Dockerfile'))).toBe(true);
		expect(fs.existsSync(path.join(shop, 'dist', 'web'))).toBe(false);

		expect(function () {
			Builder.BuildTargets(shop, options(), ['web', 'ios']);
		}).toThrow('unknown build target: ios');
		expect(function () {
			Builder.Build(shop, options({docker: true, single: true}));
		}).toThrow('--docker is a build of the site: not with --single or --widget');
	});

	it('takes the targets of elemenx.config.js in elemenx build, --target over them, and an option of a mode alone', function () {
		var shop = project({Build: {Targets: ['web', 'docker']}, Docker: {Image: false}});
		var cli = function (args) {
			return child.execFileSync(process.execPath, [path.join(root, 'elemenx-cli.js'), 'build', shop].concat(args), {encoding: 'utf8'});
		};
		var said = cli([]);

		expect(said).toContain('Elemenx Builder: web dist' + path.sep + 'web, docker dist' + path.sep + 'docker');
		expect(fs.existsSync(path.join(shop, 'dist', 'docker', 'Dockerfile'))).toBe(true);

		cli(['--target', 'single']);

		expect(fs.existsSync(path.join(shop, 'dist', 'index.html'))).toBe(true);
		expect(fs.existsSync(path.join(shop, 'dist', 'docker'))).toBe(false);

		/* An option of a mode builds that one alone, the targets aside. */
		fs.rmSync(path.join(shop, 'dist'), {recursive: true, force: true});

		cli(['--single']);

		expect(fs.existsSync(path.join(shop, 'dist', 'index.html'))).toBe(true);
		expect(fs.existsSync(path.join(shop, 'dist', 'web'))).toBe(false);

		/* --docker with the project after it: the project stays the project. */
		fs.rmSync(path.join(shop, 'dist'), {recursive: true, force: true});

		child.execFileSync(process.execPath, [path.join(root, 'elemenx-cli.js'), 'build', '--docker', shop], {encoding: 'utf8'});

		expect(fs.existsSync(path.join(shop, 'dist', 'Dockerfile'))).toBe(true);
		expect(fs.existsSync(path.join(shop, 'dist', 'web'))).toBe(false);
	});
});
