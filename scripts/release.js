'use strict';

/*
 * A release of Elemenx in one command (see docs/RELEASING.md): npm run release 0.9.5 (or npm run release -- 0.9.5
 * --yes). It takes an exact version only (0.9.5, 1.0.0-beta.1), greater than the one of package.json, and stops before
 * changing anything when the branch is not main, the tag exists (here or on origin) or main is behind origin/main.
 * It shows the changes it will commit and asks (--yes does not), runs the whole npm test (--skip-tests does not),
 * then: npm run version:set -- <version>, git add --all, git commit -m v<version>, npm run version:tag,
 * git push --follow-tags. A step that fails stops it, and it says what is done and how to go on; it undoes nothing.
 */
var path = require('path');
var childProcess = require('child_process');
var readline = require('readline');

var Root = path.resolve(__dirname, '..');
var Exact = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

/* The steps of a release after the checks, as [title, command, arguments]. */
function steps (version, options) {
	var npm = [process.execPath, options.Npm];
	var list = [];

	if (!options.SkipTests)
		list.push(['the tests', npm[0], [npm[1], 'test']]);

	list.push(['the version', npm[0], [npm[1], 'run', 'version:set', '--', version]]);
	list.push(['git add', 'git', ['add', '--all']]);
	list.push(['the commit', 'git', ['commit', '-m', 'v' + version]]);
	list.push(['the tag', npm[0], [npm[1], 'run', 'version:tag']]);
	list.push(['the push', 'git', ['push', '--follow-tags']]);

	return list;
}

/* -1, 0 or 1: a against b, as versions (a prerelease before its release). */
function compare (a, b) {
	var x = Exact.exec(a);
	var y = Exact.exec(b);
	var i;

	for (i = 1; i <= 3; i++) {
		if (Number(x[i]) !== Number(y[i])) return Number(x[i]) < Number(y[i]) ? -1 : 1;
	}

	if (x[4] === y[4]) return 0;

	if (!x[4]) return 1;

	if (!y[4]) return -1;

	return x[4] < y[4] ? -1 : 1;
}

/* The arguments: {Version, Yes, SkipTests}, or {Error}. */
function parse (argv) {
	var result = {Version: null, Yes: false, SkipTests: false};
	var i;

	for (i = 0; i < argv.length; i++) {
		if (argv[i] === '--yes' || argv[i] === '-y') result.Yes = true;
		else if (argv[i] === '--skip-tests') result.SkipTests = true;
		else if (!result.Version && argv[i].charAt(0) !== '-') result.Version = argv[i].replace(/^v/, '');
		else return {Error: 'unknown argument ' + argv[i]};
	}

	if (!result.Version)
		return {Error: 'give the version: npm run release 0.9.5'};

	if (!Exact.test(result.Version))
		return {Error: 'the version must be exact, as 0.9.5 or 1.0.0-beta.1: ' + result.Version};

	return result;
}

/*
 * What stops a release before it changes anything: the branch, the tag, origin ahead, the version. git(args) gives the
 * output of git, current the version of package.json.
 */
function checks (version, current, git) {
	var problems = [];
	var branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
	var behind;

	if (branch !== 'main')
		problems.push('the branch is ' + branch + ', a release is made on main');

	if (compare(version, current) <= 0)
		problems.push('the version ' + version + ' is not greater than ' + current + ' of package.json');

	if (git(['tag', '--list', 'v' + version]).trim())
		problems.push('the tag v' + version + ' exists already');

	if (git(['ls-remote', '--tags', 'origin', 'refs/tags/v' + version]).trim())
		problems.push('the tag v' + version + ' is on origin already');

	git(['fetch', '--quiet', 'origin', 'main']);

	behind = Number(git(['rev-list', '--count', 'HEAD..origin/main']).trim());

	if (behind)
		problems.push('main is ' + behind + ' commit(s) behind origin/main: git pull first');

	return problems;
}

/*
 * The release: options {Version, Yes, SkipTests, Npm, Current, Git(args), Run(command, args) (true when it went),
 * Ask(question, callback(yes)), Say(text)}. Calls back (error) at the end.
 */
function release (options, callback) {
	var problems = checks(options.Version, options.Current, options.Git);
	var list = steps(options.Version, options);
	var done = [];

	if (problems.length) {
		callback(new Error('Elemenx release: nothing done, ' + problems.join('; ')));

		return;
	}

	options.Say('Elemenx release v' + options.Version + ' (package.json has ' + options.Current + '). The changes it will commit:\n' + (options.Git(['status', '--short']).replace(/\s+$/, '') || '  (none but the version)') + '\nThen: ' + list.map(function (step) {
		return step[0];
	}).join(', ') + '.\n');

	function go () {
		var i;

		for (i = 0; i < list.length; i++) {
			options.Say('Elemenx release: ' + list[i][0] + '...\n');

			if (!options.Run(list[i][1], list[i][2])) {
				callback(new Error('Elemenx release: ' + list[i][0] + ' failed. ' + (done.length ? 'Done: ' + done.join(', ') + '. ' : 'Nothing is changed. ') + 'Fix it and go on by hand from ' + list[i][0] + ' (docs/RELEASING.md).'));

				return;
			}

			done.push(list[i][0]);
		}

		options.Say('Elemenx release: v' + options.Version + ' is pushed; the workflow Publish takes it from here.\n');

		callback(null);
	}

	if (options.Yes) {
		go();

		return;
	}

	options.Ask('Make the release v' + options.Version + '? [y/N] ', function (yes) {
		if (!yes) {
			callback(new Error('Elemenx release: nothing done, not confirmed (--yes makes it without the question)'));

			return;
		}

		go();
	});
}

function main () {
	var args = parse(process.argv.slice(2));
	var npm = process.env.npm_execpath;

	function stop (error) {
		process.stderr.write(error.message + '\n');

		process.exitCode = 1;
	}

	if (args.Error) return stop(new Error('Elemenx release: ' + args.Error));

	if (!npm) return stop(new Error('Elemenx release: run it through npm: npm run release ' + args.Version));

	release({
		Version: args.Version,
		Yes: args.Yes,
		SkipTests: args.SkipTests,
		Npm: npm,
		Current: require(path.join(Root, 'package.json')).version,
		Git: function (list) {
			return childProcess.execFileSync('git', list, {cwd: Root, encoding: 'utf8'});
		},
		Run: function (command, list) {
			return childProcess.spawnSync(command, list, {cwd: Root, stdio: 'inherit'}).status === 0;
		},
		Ask: function (question, answer) {
			var lines;

			if (!process.stdin.isTTY) {
				answer(false);

				return;
			}

			lines = readline.createInterface({input: process.stdin, output: process.stdout});

			lines.question(question, function (text) {
				lines.close();

				answer(/^y(es)?$/i.test(String(text).trim()));
			});
		},
		Say: function (text) {
			process.stdout.write(text);
		}
	}, function (error) {
		if (error) stop(error);
	});
}

module.exports = {Parse: parse, Compare: compare, Checks: checks, Steps: steps, Release: release};

if (require.main === module)
	main();
