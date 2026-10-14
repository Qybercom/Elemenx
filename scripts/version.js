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
 *   npm run version:set -- 0.9.1          sets the version of package.json, package-lock.json and packages/elemenx,
 *                                         and commits and tags nothing
 *   npm run version:tag                   tags the last commit v0.9.1, when the working tree is clean and both
 *                                         packages have that version
 * Then git push --follow-tags sends the commit and the tag, and the tag starts the publish workflow.
 */
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var Root = path.resolve(__dirname, '..');
var Wrapper = path.join(Root, 'packages', 'elemenx', 'package.json');

function read (file) {
	return JSON.parse(fs.readFileSync(file, 'utf8'));
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

function sync () {
	var main = read(path.join(Root, 'package.json'));
	var wrapper = read(Wrapper);

	wrapper.version = main.version;
	wrapper.dependencies[main.name] = main.version;

	fs.writeFileSync(Wrapper, JSON.stringify(wrapper, null, '\t') + '\n');

	process.stdout.write('Elemenx version: elemenx ' + wrapper.version + ' -> ' + main.name + ' ' + main.version + '\n');

	return true;
}

/* npm version without its commit and tag: it takes a version or patch, minor, major, prerelease (npm_execpath: run through npm). */
function set (value) {
	var npm = process.env.npm_execpath;

	if (!value) return stop('usage: npm run version:set -- <version | patch | minor | major | prerelease>');
	if (!npm) return stop('run it through npm: npm run version:set -- ' + value);

	childProcess.execFileSync(process.execPath, [npm, 'version', value, '--no-git-tag-version', '--ignore-scripts'], {cwd: Root, stdio: 'inherit'});

	return sync();
}

function tag () {
	var main = read(path.join(Root, 'package.json'));
	var wrapper = read(Wrapper);
	var name = 'v' + main.version;

	if (!check()) return false;

	if (wrapper.version !== main.version || wrapper.dependencies[main.name] !== main.version)
		return stop('packages/elemenx has ' + wrapper.version + ', not ' + main.version + ': npm run version:set -- ' + main.version + ', then commit');

	if (git(['tag', '--list', name]).trim())
		return stop('the tag ' + name + ' exists already: set a new version first');

	git(['tag', '-a', name, '-m', main.version]);

	process.stdout.write('Elemenx version: tagged ' + name + ' on ' + git(['rev-parse', '--short', 'HEAD']).trim() + '; now git push --follow-tags\n');

	return true;
}

var Commands = {check: check, sync: sync, set: set, tag: tag};

if (Commands[process.argv[2]]) Commands[process.argv[2]](process.argv[3]);
else stop('usage: node scripts/version.js check | sync | set <version> | tag');
