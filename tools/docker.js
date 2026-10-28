'use strict';

/*
 * A build of the Application as a Docker image (elemenx build --docker, or the target docker): the files of its site
 * served by nginx (nginx:alpine, about 20 MB). Pack(folder, project, settings) writes beside the files of the build:
 * - Dockerfile: nginx with the configuration below, the files of the build, port 80, a health check (/healthz);
 * - nginx.conf: gzip for the text of 1024 bytes and more; every path that is not a file answered with index.html (the
 *   routes of the Router on a reload); index.html and the worker of a PWA never kept by a cache, the other files kept
 *   until they change (ETag); the headers of a safe page (nosniff, a referrer policy, frames of the same origin only)
 *   and Docker.Headers, {name: value} of its own (a Content-Security-Policy...);
 * - .dockerignore: the Dockerfile stays out of the files served (nginx.conf too: the image removes it after its COPY).
 * Then, when the docker command is there (and Docker.Image is not false), it builds the image: Docker.Image, or the
 * name and the version of package.json (my-app:1.2.0). Without docker, or with its engine not running, it says how
 * to build it later; with strict it fails instead. Returns {Files, Image (the name, or null when not built)}.
 */
var fs = require('fs');
var path = require('path');
var child = require('child_process');

var Base = 'nginx:1.27-alpine';

/* A header of nginx: its name and its value in quotes, for every response (always: the errors too). */
function header (name, value) {
	return '\tadd_header ' + name + ' "' + String(value).replace(/["\\]/g, '\\$&') + '" always;';
}

function configuration (headers) {
	var safe = [
		header('X-Content-Type-Options', 'nosniff'),
		header('Referrer-Policy', 'strict-origin-when-cross-origin'),
		header('X-Frame-Options', 'SAMEORIGIN')
	].concat(Object.keys(headers || {}).map(function (name) {
		return header(name, headers[name]);
	}));
	/* A location with an add_header of its own loses the ones of the server: each one repeats them. */
	var repeat = safe.map(function (line) {
		return '\t' + line;
	});

	return [
		'# Written by elemenx build --docker: the Application served by nginx.',
		'server {',
		'\tlisten 80;',
		'\tserver_name _;',
		'\troot /usr/share/nginx/html;',
		'\tindex index.html;',
		'\tserver_tokens off;',
		'',
		'\tgzip on;',
		'\tgzip_min_length 1024;',
		'\tgzip_vary on;',
		'\tgzip_types text/plain text/css application/javascript application/json application/manifest+json image/svg+xml;',
		'',
		safe.join('\n'),
		'',
		'\t# The page and the worker of a PWA: asked again every time, so a new build reaches the users at once.',
		'\tlocation ~ ^/(index\\.html|elemenx-pwa\\.js)?$ {',
		'\t\ttry_files $uri /index.html;',
		header('Cache-Control', 'no-cache').replace(/^\t/, '\t\t'),
		repeat.join('\n'),
		'\t}',
		'',
		'\tlocation = /healthz {',
		'\t\taccess_log off;',
		'\t\tdefault_type text/plain;',
		'\t\treturn 200 "ok";',
		'\t}',
		'',
		'\t# A file, kept until it changes; any other path is a route of the Router: the page.',
		'\tlocation / {',
		'\t\ttry_files $uri $uri/ /index.html;',
		header('Cache-Control', 'public, max-age=0, must-revalidate').replace(/^\t/, '\t\t'),
		repeat.join('\n'),
		'\t}',
		'}',
		''
	].join('\n');
}

function dockerfile () {
	return [
		'# Written by elemenx build --docker: the files of this folder, served by nginx (nginx.conf).',
		'FROM ' + Base,
		'COPY nginx.conf /etc/nginx/conf.d/default.conf',
		'COPY . /usr/share/nginx/html',
		/* The configuration is no file of the site (.dockerignore cannot leave it out: the COPY before needs it). */
		'RUN rm /usr/share/nginx/html/nginx.conf',
		'EXPOSE 80',
		'HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1',
		''
	].join('\n');
}

/* The name of the image: Docker.Image, or the name (without its scope) and the version of package.json, or the folder. */
function imageName (project, settings) {
	var file = path.join(project, 'package.json');
	var manifest = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
	var name = String(manifest.name || path.basename(project)).replace(/^@[^/]+\//, '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '') || 'elemenx-app';

	if (typeof settings.Image === 'string' && settings.Image) return settings.Image;

	return name + ':' + (manifest.version || 'latest');
}

/* Whether the docker command answers here. */
/*
 * The state of docker here: ready (its engine answers), stopped (the command is here, its engine is not running:
 * Docker Desktop closed) or missing (no command).
 */
function state (run) {
	var result = (run || child.spawnSync)('docker', ['version', '--format', '{{.Server.Version}}'], {encoding: 'utf8'});
	if (!result || result.error || result.status === null) return 'missing';

	return result.status === 0 ? 'ready' : 'stopped';
}

function Pack (folder, project, settings, options) {
	var config = settings || {};
	var extra = options || {};
	var run = extra.Run || child.spawnSync;
	var log = extra.Log || function (text) {
		process.stdout.write(text + '\n');
	};
	var image = imageName(project, config);
	var result;
	var engine;
	var reason;

	fs.writeFileSync(path.join(folder, 'nginx.conf'), configuration(config.Headers));
	fs.writeFileSync(path.join(folder, 'Dockerfile'), dockerfile());
	/* Regression: nginx.conf in it left the COPY of the Dockerfile without its file, and the image failed. */
	fs.writeFileSync(path.join(folder, '.dockerignore'), 'Dockerfile\n.dockerignore\n');

	if (config.Image === false) {
		log('Elemenx Builder: the files of a Docker image in ' + folder + ' (docker build -t ' + image + ' ' + folder + ')');

		return {Files: ['Dockerfile', 'nginx.conf', '.dockerignore'], Image: null};
	}

	engine = state(run);

	/* Regression: an engine not running was told as docker not installed. */
	if (engine !== 'ready') {
		reason = engine === 'stopped' ? 'the engine of docker is not running (start Docker Desktop)' : 'docker is not installed here';

		if (extra.Strict)
			throw new Error(reason + ': the image of ' + folder + ' cannot be built (Docker.Image false only writes its files)');

		log('Elemenx Builder: ' + reason + ', the image is not built: docker build -t ' + image + ' ' + folder);

		return {Files: ['Dockerfile', 'nginx.conf', '.dockerignore'], Image: null};
	}

	result = run('docker', ['build', '-t', image, folder], {stdio: 'inherit'});

	if (!result || result.status !== 0)
		throw new Error('docker build of ' + folder + ' failed');

	log('Elemenx Builder: the Docker image ' + image + ' (docker run -p 8080:80 ' + image + ')');

	return {Files: ['Dockerfile', 'nginx.conf', '.dockerignore'], Image: image};
}

module.exports = {
	Pack: Pack,
	Configuration: configuration,
	Dockerfile: dockerfile,
	ImageName: imageName,
	Base: Base
};
