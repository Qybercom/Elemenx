'use strict';

/*
 * The Designer (examples/Designer) built for the package of npm, into designer-site/: npx elemenx designer [project] serves
 * it with the project beside it (see designer.js). It takes all of the framework and every Component of ElemenxUI (its
 * palette offers each of them, its canvas runs them); ElemenxUI itself is not copied: the package has it, and the
 * server of the CLI answers /libraries/ from there.
 * Build({Output}) returns the folder; node tools/designer-site.js [folder] (npm run designer:site; prepack runs it).
 */
var fs = require('fs');
var path = require('path');

var Root = path.resolve(__dirname, '..');
var Designer = path.join(Root, 'examples', 'Designer');

function Build (options) {
	var settings = options || {};
	var output = path.resolve(settings.Output || path.join(Root, 'designer-site'));
	var Builder = require(path.join(__dirname, 'builder.js'));

	if (!fs.existsSync(path.join(Designer, 'app.js')))
		throw new Error('Elemenx designer: the Designer is not here (examples/Designer): build it from the repository of Elemenx');

	Builder.Build(Designer, {
		application: 'application',
		entry: 'app.js',
		index: 'index.html',
		out: path.relative(Designer, output),
		full: true,
		packs: ['all'],
		allLibraries: true
	});

	fs.rmSync(path.join(output, 'libraries', 'ElemenxUI'), {recursive: true, force: true});

	if (fs.existsSync(path.join(output, 'libraries')) && !fs.readdirSync(path.join(output, 'libraries')).length)
		fs.rmdirSync(path.join(output, 'libraries'));

	return output;
}

module.exports = {Build: Build, Designer: Designer};

if (require.main === module) {
	try {
		process.stdout.write('Elemenx designer: ' + Build({Output: process.argv[2]}) + '\n');
	}
	catch (error) {
		process.stderr.write(error.message + '\n');

		process.exitCode = 1;
	}
}
