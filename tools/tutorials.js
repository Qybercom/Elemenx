'use strict';

/*
 * The projects of the tutorials of the reference (examples/Tutorials), for their articles: examples/Docs/data/
 * tutorials.json names them, [{Page (the article: tutorials/<Page>), Project (its folder), Demo (whether it runs
 * without a server of its own)}].
 * - Zip(project) is the project as a zip archive (a Buffer), in a folder of its name, without node_modules, dist and
 *   the results of its tests: npm install, then npm run dev.
 * - Demo(project, output) builds the project into output as one index.html (elemenx build --single), its public files
 *   (its dictionaries, its data, its images) beside it: the reference shows the page in a frame of a blob: URL whose
 *   <base> is that folder, where its Router keeps its routes in memory.
 * - Build(output) writes them into output/tutorials: <Project>.zip for each, <Project>/ for each demo (docs-site.js).
 * - Request(tutorials) answers /tutorials/<Project>.zip and /tutorials/<Project>/<file> from the sources, for the server
 *   of the reference in development; each made once.
 */
var fs = require('fs');
var os = require('os');
var path = require('path');
var Zip = require('./zip.js');

var Root = path.resolve(__dirname, '..');
var Tutorials = path.join(Root, 'examples', 'Tutorials');
var List = path.join(Root, 'examples', 'Docs', 'data', 'tutorials.json');
var Skipped = ['node_modules', 'dist', '.git', 'test-results', 'playwright-report'];
var Types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2'};

function list () {
	return JSON.parse(fs.readFileSync(List, 'utf8'));
}

/* The files of a project, its folder before their paths, the folders of builds and packages left out. */
function files (directory, name, base, result) {
	result = result || [];
	base = base || directory;

	fs.readdirSync(directory, {withFileTypes: true}).sort(function (a, b) {
		return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
	}).forEach(function (entry) {
		var full = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			if (Skipped.indexOf(entry.name) === -1)
				files(full, name, base, result);

			return;
		}

		result.push({Name: name + '/' + path.relative(base, full).replace(/\\/g, '/'), Data: fs.readFileSync(full)});
	});

	return result;
}

function pack (project, tutorials) {
	return Zip.Archive(files(path.join(tutorials || Tutorials, project), project));
}

function Demo (project, output, tutorials) {
	var directory = path.join(tutorials || Tutorials, project);
	var settings = require(path.join(directory, 'elemenx.config.js'));
	var Builder = require(path.join(__dirname, 'builder.js'));

	Builder.Build(directory, {
		application: settings.Application,
		entry: settings.Entry || 'app.js',
		index: 'index.html',
		out: path.relative(directory, output),
		single: true
	});

	return output;
}

function Build (output) {
	var target = path.join(output, 'tutorials');

	fs.mkdirSync(target, {recursive: true});

	list().forEach(function (entry) {
		fs.writeFileSync(path.join(target, entry.Project + '.zip'), pack(entry.Project));

		if (entry.Demo)
			Demo(entry.Project, path.join(target, entry.Project));
	});

	return target;
}

function Request (tutorials) {
	var zips = {};
	var demos = {};

	return function (request, response, pathname) {
		var match = /^\/tutorials\/([A-Za-z][\w-]*)(\.zip|\/(.*))$/.exec(pathname);
		var entry;
		var folder;
		var file;

		if (!match || !fs.existsSync(path.join(tutorials, match[1]))) return false;

		entry = list().filter(function (item) {
			return item.Project === match[1];
		})[0];

		if (!entry || (match[2] !== '.zip' && !entry.Demo)) return false;

		try {
			if (match[2] === '.zip') {
				zips[match[1]] = zips[match[1]] || pack(match[1], tutorials);

				response.writeHead(200, {'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="' + match[1] + '.zip"', 'Cache-Control': 'no-cache'});
				response.end(request.method === 'HEAD' ? '' : zips[match[1]]);

				return true;
			}

			demos[match[1]] = demos[match[1]] || Demo(match[1], fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-tutorial-')), tutorials);
		}
		catch (error) {
			response.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
			response.end(String(error.message || error));

			return true;
		}

		folder = demos[match[1]];
		file = path.resolve(folder, decodeURIComponent(match[3] || 'index.html'));

		if (file.indexOf(folder + path.sep) !== 0 || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
			response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
			response.end('Not Found');

			return true;
		}

		response.writeHead(200, {'Content-Type': Types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache'});

		if (request.method === 'HEAD') response.end();
		else fs.createReadStream(file).pipe(response);

		return true;
	};
}

module.exports = {
	List: list,
	Zip: pack,
	Demo: Demo,
	Build: Build,
	Request: Request,
	Tutorials: Tutorials
};
