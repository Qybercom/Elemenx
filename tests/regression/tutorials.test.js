import { describe, expect, it } from 'vitest';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Tutorials = require('../../tools/tutorials.js');
var Server = require('../../tools/server.js');
var Zip = require('../../tools/zip.js');
var pages = path.resolve(process.cwd(), 'examples', 'Docs', 'pages', 'tutorials');

function get (port, url) {
	return new Promise(function (resolve, reject) {
		http.get({host: '127.0.0.1', port: port, path: url}, function (response) {
			var chunks = [];

			response.on('data', function (chunk) {
				chunks.push(chunk);
			});
			response.on('end', function () {
				resolve({Status: response.statusCode, Type: response.headers['content-type'], Body: Buffer.concat(chunks)});
			});
		}).on('error', reject);
	});
}

/* The finished projects of the tutorials of the Docs: to download from their articles, and as demos. */
describe('Elemenx docs: the projects of the tutorials', function () {
	it('names the project of every article that has one, each there, a demo only for one with no server of its own', function () {
		var listed = Tutorials.List();
		var found = fs.readdirSync(pages).filter(function (name) {
			return /\.en\.md$/.test(name);
		}).map(function (name) {
			var match = /examples\/Tutorials\/([A-Za-z]+)/.exec(fs.readFileSync(path.join(pages, name), 'utf8'));

			return match ? {Page: name.replace(/\.en\.md$/, ''), Project: match[1]} : null;
		}).filter(Boolean);

		expect(listed.map(function (entry) {
			return {Page: entry.Page, Project: entry.Project};
		})).toEqual(found);

		listed.forEach(function (entry) {
			var config = path.join(Tutorials.Tutorials, entry.Project, 'elemenx.config.js');

			expect(fs.existsSync(path.join(Tutorials.Tutorials, entry.Project, 'package.json'))).toBe(true);

			/* A demo is a page of files: no server of its own answers it. */
			if (entry.Demo)
				expect(typeof require(config).Server.Request).toBe('undefined');
		});
	});

	it('packs a project in a folder of its name, without its packages and its builds', function () {
		var names = Object.keys(Zip.Read(Tutorials.Zip('Todo')));

		expect(names).toContain('Todo/package.json');
		expect(names).toContain('Todo/app.js');
		expect(names.every(function (name) {
			return name.indexOf('Todo/') === 0 && !/(^|\/)(node_modules|dist|test-results)\//.test(name);
		})).toBe(true);
	});

	it('answers the zip of a project and the files of its demo, and nothing of a project with no demo', async function () {
		var server = Server.Create({Root: process.cwd(), Request: Tutorials.Request(Tutorials.Tutorials)});
		var port;

		await new Promise(function (resolve) {
			server.Listen(0, '127.0.0.1', resolve);
		});

		port = server.Server.address().port;

		try {
			var zip = await get(port, '/tutorials/Todo.zip');
			var demo = await get(port, '/tutorials/Todo/index.html');

			expect([zip.Status, zip.Type]).toEqual([200, 'application/zip']);
			expect(demo.Status).toBe(200);
			expect(demo.Body.toString()).toContain('<script id="elemenx">');
			expect((await get(port, '/tutorials/Todo/..%2F..%2Fpackage.json')).Status).toBe(404);
			expect((await get(port, '/tutorials/Auth/index.html')).Body.toString()).not.toContain('<script id="elemenx">');
		}
		finally {
			await new Promise(function (resolve) {
				server.Close(resolve);
			});
		}
	}, 120000);
});
