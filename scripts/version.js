'use strict';

/*
 * The version of a release of @qybercom/elemenx and of its short name elemenx (packages/elemenx). See docs/RELEASING.md.
 *
 * npm version 0.9.1 (or patch, minor, prerelease) runs two of the commands, then commits the version alone and tags it:
 *   node scripts/version.js check         preversion: stops when the working tree has anything to commit, untracked
 *                                         files too
 *   node scripts/version.js sync --add    version: gives packages/elemenx the version of package.json and makes it
 *                                         depend on exactly that version, puts it in elemenx.js, the examples and the
 *                                         editors, and stages those files for the commit of npm
 * The version in a commit of its own author, then a tag on it:
 *   npm run version:set -- 0.9.1          puts the version in every place: package.json, package-lock.json and
 *                                         packages/elemenx (its version and its dependency); without a version, puts
 *                                         the one of package.json everywhere. It commits and tags nothing
 *   npm run version:tag                   tags the last commit v0.9.1, when the working tree is clean and both
 *                                         packages have that version
 * Then git push --follow-tags sends the commit and the tag, and the tag starts the publish workflow.
 */
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var Root = path.resolve(__dirname, '..');
var Wrapper = path.join(Root, 'packages', 'elemenx', 'package.json');
var Framework = path.join(Root, 'elemenx.js');
/* The folders of the examples that install the package from npm: each depends on the minor version (^0.10.0), as a site would. */
var Examples = [path.join(Root, 'examples'), path.join(Root, 'examples', 'Tutorials')];
/* The extensions of the editors: the version of Elemenx, so a release of Elemenx is one of them too. */
var VSCode = path.join(Root, 'editors', 'vscode', 'package.json');
var IntelliJ = path.join(Root, 'editors', 'intellij', 'build.gradle.kts');
/* The README: its links to the CDN name the minor version (@qybercom/elemenx@0.10/dist/...). */
var Readme = path.join(Root, 'README.md');

function read (file) {
	return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/* package-lock.json, or the version of package.json when there is none. */
function lock () {
	var file = path.join(Root, 'package-lock.json');

	return fs.existsSync(file) ? read(file) : read(path.join(Root, 'package.json'));
}

function git (args) {
	return childProcess.execFileSync('git', args, {cwd: Root, encoding: 'utf8'});
}

function stop (message) {
	process.stderr.write('Elemenx version: ' + message + '\n');

	process.exitCode = 1;

	return false;
}

function check () {
	var status = git(['status', '--porcelain']);
	if (!status.trim()) return true;

	return stop('the working tree has changes, commit or remove them first:\n' + status.replace(/\n$/, ''));
}

/* The version elemenx.js names (Elemenx.Version), or null without the file. */
function frameworkVersion () {
	var match;

	if (!fs.existsSync(Framework)) return null;

	match = /\n\tvar Version = '([^']*)';/.exec(fs.readFileSync(Framework, 'utf8'));

	return match ? match[1] : null;
}

/* The versions of the extensions of the editors, or null for one that is not there. */
function editorVersions () {
	var gradle = fs.existsSync(IntelliJ) ? /\nversion = "([^"]*)"/.exec(fs.readFileSync(IntelliJ, 'utf8')) : null;

	return {VSCode: fs.existsSync(VSCode) ? read(VSCode).version : null, IntelliJ: gradle ? gradle[1] : null};
}

/* The package.json of the examples that depend on the package (name), relative to the root. */
function examples (name) {
	var found = [];

	Examples.forEach(function (folder) {
		if (!fs.existsSync(folder)) return;

		fs.readdirSync(folder).sort().forEach(function (entry) {
			var file = path.join(folder, entry, 'package.json');

			if (fs.existsSync(file) && (read(file).dependencies || {})[name])
				found.push(path.relative(Root, file).replace(/\\/g, '/'));
		});
	});

	return found;
}

/* The minor version of a version: 0.10 for 0.10.3. */
function minor (version) {
	return version.replace(/^(\d+\.\d+)[\s\S]*$/, '$1');
}

/* The range the example depends on for a version: ^0.10.0 for 0.10.3. */
function range (version) {
	return '^' + version.replace(/\.\d+$/, '.0');
}

/* Puts the version of package.json in the other places; sync --add also stages them (the version script of npm). */
function sync (option) {
	var main = read(path.join(Root, 'package.json'));
	var wrapper = read(Wrapper);
	var written = [Wrapper].concat(examples(main.name).map(function (name) {
		return path.join(Root, name);
	}), [VSCode, IntelliJ, Framework, Readme]);

	wrapper.version = main.version;
	wrapper.dependencies[main.name] = main.version;

	fs.writeFileSync(Wrapper, JSON.stringify(wrapper, null, '\t') + '\n');

	/* Regression: a release of a minor version (0.10.0) left the example on ^0.9.0. The range alone changes in its text. */
	examples(main.name).forEach(function (name) {
		var file = path.join(Root, name);

		fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(new RegExp('("' + main.name.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '"\\s*:\\s*")[^"]*(")'), '$1' + range(main.version) + '$2'));
	});

	if (fs.existsSync(VSCode))
		fs.writeFileSync(VSCode, fs.readFileSync(VSCode, 'utf8').replace(/(\n\t"version": ")[^"]*(")/, '$1' + main.version + '$2'));

	if (fs.existsSync(IntelliJ))
		fs.writeFileSync(IntelliJ, fs.readFileSync(IntelliJ, 'utf8').replace(/(\nversion = ")[^"]*(")/, '$1' + main.version + '$2'));

	if (fs.existsSync(Framework))
		fs.writeFileSync(Framework, fs.readFileSync(Framework, 'utf8').replace(/(\n\tvar Version = ')[^']*(';)/, '$1' + main.version + '$2'));

	/* Regression: the README kept the links of 0.9 to the CDN after 0.10. */
	if (fs.existsSync(Readme))
		fs.writeFileSync(Readme, fs.readFileSync(Readme, 'utf8').split(main.name + '@').map(function (part, index) {
			return index ? part.replace(/^\d+\.\d+\//, minor(main.version) + '/') : part;
		}).join(main.name + '@'));

	if (option === '--add') {
		git(['add', '--'].concat(written.filter(function (name) {
			return fs.existsSync(name);
		}).map(function (name) {
			return path.relative(Root, name).replace(/\\/g, '/');
		})));
	}

	process.stdout.write('Elemenx version: elemenx ' + wrapper.version + ' -> ' + main.name + ' ' + main.version + '\n');

	return true;
}

/*
 * Puts a version in every place that holds it: package.json, package-lock.json, packages/elemenx (its version and its
 * dependency on @qybercom/elemenx), the dependency of the examples (^ its minor version), and the extensions of
 * the editors (editors/vscode and editors/intellij). It takes a version or patch, minor, major, prerelease; without one it puts the
 * version of package.json everywhere (after package.json was changed by hand). It commits and tags nothing.
 */
function set (value) {
	var npm = process.env.npm_execpath;

	if (!npm) return stop('run it through npm: npm run version:set -- ' + (value || '<version>'));

	value = value || read(path.join(Root, 'package.json')).version;

	childProcess.execFileSync(process.execPath, [npm, 'version', value, '--no-git-tag-version', '--ignore-scripts', '--allow-same-version'], {cwd: Root, stdio: ['ignore', 'ignore', 'inherit']});

	return sync();
}

function tag () {
	var main = read(path.join(Root, 'package.json'));
	var wrapper = read(Wrapper);
	var name = 'v' + main.version;

	if (!check()) return false;

	var wrong = [];

	if (wrapper.version !== main.version)
		wrong.push('packages/elemenx/package.json has the version ' + wrapper.version);

	if (wrapper.dependencies[main.name] !== main.version)
		wrong.push('packages/elemenx/package.json depends on ' + main.name + ' ' + wrapper.dependencies[main.name]);

	if (frameworkVersion() !== null && frameworkVersion() !== main.version)
		wrong.push('elemenx.js has the version ' + frameworkVersion());

	examples(main.name).forEach(function (name) {
		var dependency = read(path.join(Root, name)).dependencies[main.name];

		if (dependency !== range(main.version))
			wrong.push(name + ' depends on ' + main.name + ' ' + dependency);
	});

	if (editorVersions().VSCode !== null && editorVersions().VSCode !== main.version)
		wrong.push('editors/vscode/package.json has the version ' + editorVersions().VSCode);

	if (editorVersions().IntelliJ !== null && editorVersions().IntelliJ !== main.version)
		wrong.push('editors/intellij/build.gradle.kts has the version ' + editorVersions().IntelliJ);

	if (lock().version !== main.version)
		wrong.push('package-lock.json has the version ' + lock().version);

	if (wrong.length)
		return stop('package.json has the version ' + main.version + ', but ' + wrong.join(', ') + '. Run npm run version:set (it puts ' + main.version + ' everywhere), commit, then npm run version:tag');

	if (git(['tag', '--list', name]).trim())
		return stop('the tag ' + name + ' exists already: set a new version first');

	git(['tag', '-a', name, '-m', main.version]);

	process.stdout.write('Elemenx version: tagged ' + name + ' on ' + git(['rev-parse', '--short', 'HEAD']).trim() + '; now git push --follow-tags\n');

	return true;
}

var Commands = {check: check, sync: sync, set: set, tag: tag};

if (Commands[process.argv[2]]) Commands[process.argv[2]](process.argv[3]);
else stop('usage: node scripts/version.js check | sync | set <version> | tag');
