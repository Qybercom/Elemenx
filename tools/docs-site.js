'use strict';

/*
 * The reference (examples/Docs) built for the package of npm, into docs-site/: npx elemenx docs serves it, offline, of
 * the version the project installed. It takes all of the framework, every Component, Service and Directive of
 * ElemenxUI and every pack (its live examples use any of them), not the tools that write its pages, and the
 * elemenx.config.js of the reference beside it, for the answers of the server its examples of the network ask (a JSON,
 * an echo, events, a stream, a WebSocket). The projects of the tutorials go into tutorials/, to download, and those
 * that run without a server of their own as demos of one file (tutorials.js).
 * Build({Output}) returns the folder; node tools/docs-site.js [folder] (npm run docs:site; prepack runs it).
 */
var fs = require('fs');
var path = require('path');

var Root = path.resolve(__dirname, '..');
var Docs = path.join(Root, 'examples', 'Docs');

function Build (options) {
	var settings = options || {};
	var output = path.resolve(settings.Output || path.join(Root, 'docs-site'));
	var Builder = require(path.join(__dirname, 'builder.js'));

	if (!fs.existsSync(path.join(Docs, 'app.js')))
		throw new Error('Elemenx docs: the reference is not here (examples/Docs): build it from the repository of Elemenx');

	Builder.Build(Docs, {
		application: 'application',
		entry: 'app.js',
		index: 'index.html',
		out: path.relative(Docs, output),
		full: true,
		packs: ['all'],
		allLibraries: true,
		excludes: [path.join(Docs, 'tools')]
	});

	/*
	 * ElemenxUI is in the package already (libraries/), and the server of the CLI answers /libraries/ from there: a copy
	 * of it here would double the package (its data alone, the emoji and the cities, is 11 MB).
	 */
	fs.rmSync(path.join(output, 'libraries', 'ElemenxUI'), {recursive: true, force: true});

	if (fs.existsSync(path.join(output, 'libraries')) && !fs.readdirSync(path.join(output, 'libraries')).length)
		fs.rmdirSync(path.join(output, 'libraries'));

	fs.copyFileSync(path.join(Docs, 'elemenx.config.js'), path.join(output, 'elemenx.config.js'));

	require(path.join(__dirname, 'tutorials.js')).Build(output);

	return output;
}

module.exports = {Build: Build, Docs: Docs};

if (require.main === module) {
	try {
		process.stdout.write('Elemenx docs: ' + Build({Output: process.argv[2]}) + '\n');
	}
	catch (error) {
		process.stderr.write(error.message + '\n');

		process.exitCode = 1;
	}
}
