'use strict';

/*
 * The version of a release of @qybercom/elemenx and of its short name elemenx (packages/elemenx). See docs/RELEASING.md.
 *
 * npm version 0.9.1 (or patch, minor, prerelease) runs two of the commands, then commits the version alone and tags it:
 *   node scripts/version.js check         preversion: stops when the working tree has anything to commit, untracked
 *                                         files too
 *   node scripts/version.js sync          version: gives packages/elemenx the version of package.json and makes it
 *                                         depend on exactly that version
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

function sync () {
	var main = read(path.join(Root, 'package.json'));
	var wrapper = read(Wrapper);

	wrapper.version = main.version;
	wrapper.dependencies[main.name] = main.version;

	fs.writeFileSync(Wrapper, JSON.stringify(wrapper, null, '\t') + '\n');

	if (fs.existsSync(Framework))
		fs.writeFileSync(Framework, fs.readFileSync(Framework, 'utf8').replace(/(\n\tvar Version = ')[^']*(';)/, '$1' + main.version + '$2'));

	process.stdout.write('Elemenx version: elemenx ' + wrapper.version + ' -> ' + main.name + ' ' + main.version + '\n');

	return true;
}

/*
 * Puts a version in every place that holds it: package.json, package-lock.json, packages/elemenx (its version and its
 * dependency on @qybercom/elemenx). It takes a version or patch, minor, major, prerelease; without one it puts the
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
