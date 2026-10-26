/*
 * Builds the extensions of the editors into dist/editors (npm run dist builds them after the files of the framework;
 * npm run editors alone):
 * - the one of VS Code, elemenx-vscode.vsix, with @vscode/vsce through npx;
 * - the plugin of the IDEs of JetBrains, elemenx-intellij.zip, with the Gradle of editors/intellij. It is
 *   built against an IDE of the machine when there is one (IntelliJ IDEA, WebStorm, PhpStorm... found where they are
 *   installed, or named by ELEMENX_IDEA or --idea <folder>), with the JDK it carries; else, with ELEMENX_INTELLIJ=download
 *   (a release), against an IntelliJ IDEA that Gradle downloads, with a JDK of 21 or more (JAVA_HOME, JAVA_HOME_21_X64...);
 *   else it is left out, and told so.
 * The core of the language and the meta.json of ElemenxUI go into each of them. Build({Output, Idea, IntelliJ, Log})
 * returns [{Name, Size}] of the files made; IntelliJ: false leaves the plugin out, true needs it.
 */
var fs = require('fs');
var path = require('path');
var child = require('child_process');

var root = path.resolve(__dirname, '..');
var vscode = path.join(__dirname, 'vscode');
var intellij = path.join(__dirname, 'intellij');

function copy (from, to) {
	fs.mkdirSync(path.dirname(to), {recursive: true});
	fs.copyFileSync(from, to);
}

/* The sources of a Library the definitions go to: its meta.json, the .js and .html of its Components, its directives and Services. */
function sources (library, to) {
	fs.rmSync(to, {recursive: true, force: true});

	copy(path.join(library, 'data', 'meta.json'), path.join(to, 'data', 'meta.json'));

	['components', 'directives', 'services'].forEach(function (folder) {
		(function walk (directory) {
			fs.readdirSync(directory, {withFileTypes: true}).forEach(function (entry) {
				var file = path.join(directory, entry.name);

				if (entry.isDirectory()) walk(file);
				else if (/\.(js|html)$/.test(entry.name)) copy(file, path.join(to, path.relative(library, file)));
			});
		})(path.join(library, folder));
	});
}

/* A command of npx or Gradle: on Windows through the shell (they are .cmd files), its arguments quoted (a folder with spaces). */
function run (command, list, folder, environment) {
	var line = [command].concat(list.map(function (value) {
		return /[\s"]/.test(value) ? '"' + value.replace(/"/g, '\\"') + '"' : value;
	})).join(' ');
	var settings = {cwd: folder, stdio: 'inherit', env: environment || process.env};
	var result = process.platform === 'win32' ? child.spawnSync(line, Object.assign({shell: true}, settings)) : child.spawnSync(command, list, settings);
	if (result.status !== 0)
		throw new Error('Elemenx editors: ' + command + ' ' + list.join(' ') + ' failed');
}

/* The IDEs of JetBrains where they are installed: the Toolbox, the installers of Windows, macOS and Linux. */
function installedIdes () {
	var home = process.env.HOME || process.env.USERPROFILE || '';
	var places = [];
	var found = [];

	if (process.platform === 'win32') {
		places.push(path.join(process.env.LOCALAPPDATA || '', 'Programs'), path.join(process.env.ProgramFiles || 'C:\\Program Files', 'JetBrains'), path.join(process.env.LOCALAPPDATA || '', 'JetBrains', 'Toolbox', 'apps'));
	}
	else if (process.platform === 'darwin') {
		places.push('/Applications', path.join(home, 'Applications'));
	}
	else {
		places.push('/opt', path.join(home, '.local', 'share', 'JetBrains', 'Toolbox', 'apps'), '/snap');
	}

	places.forEach(function (place) {
		var names;

		try {
			names = fs.readdirSync(place);
		}
		catch (error) {
			return;
		}

		names.forEach(function (name) {
			var folder = path.join(place, name, process.platform === 'darwin' ? 'Contents' : '');
			if (/intellij|idea|webstorm|phpstorm|pycharm|goland|rider|clion|rubymine|android studio/i.test(name) && fs.existsSync(path.join(folder, 'product-info.json')))
				found.push(folder);
		});
	});

	/* IntelliJ IDEA first: the plugin is built against it the most often. */
	return found.sort(function (a, b) {
		return (/idea|intellij/i.test(path.basename(b)) ? 1 : 0) - (/idea|intellij/i.test(path.basename(a)) ? 1 : 0);
	});
}

/* The JDK of an IDE (its JBR), or of the machine when it is of 21 or more. */
function jdk (ide) {
	var carried = ide ? path.join(ide, 'jbr') : null;
	var candidates = [carried, process.env.JAVA_HOME, process.env.JAVA_HOME_25_X64, process.env.JAVA_HOME_21_X64, process.env.JAVA_HOME_21_arm64];
	var i;
	var release;
	var version;

	for (i = 0; i < candidates.length; i++) {
		if (!candidates[i]) continue;

		release = path.join(candidates[i], 'release');
		version = fs.existsSync(release) ? /JAVA_VERSION="(\d+)/.exec(fs.readFileSync(release, 'utf8')) : null;

		if (version && Number(version[1]) >= 21) return candidates[i];
	}

	return null;
}

function Build (options) {
	var settings = options || {};
	var output = path.resolve(settings.Output || path.join(root, 'dist', 'editors'));
	var log = settings.Log || function (text) {
		process.stdout.write(text + '\n');
	};
	var made = [];
	var ide = settings.Idea || process.env.ELEMENX_IDEA || installedIdes()[0] || null;
	var download = process.env.ELEMENX_INTELLIJ === 'download';
	var gradle = ['buildPlugin', '--no-daemon'].concat(ide ? ['-PideaLocal=' + ide] : []);
	var java;

	fs.mkdirSync(output, {recursive: true});

	/* VS Code: the core beside the extension, then the package. */
	copy(path.join(__dirname, 'core', 'elemenx-language.js'), path.join(vscode, 'core', 'elemenx-language.js'));
	copy(path.join(root, 'libraries', 'ElemenxUI', 'data', 'meta.json'), path.join(vscode, 'core', 'meta.json'));

	/* The sources of Elemenx and ElemenxUI of this version: a project with a build of dist alone goes to their definitions here. */
	copy(path.join(root, 'elemenx.js'), path.join(vscode, 'core', 'elemenx.js'));

	sources(path.join(root, 'libraries', 'ElemenxUI'), path.join(vscode, 'core', 'library'));

	copy(path.join(root, 'LICENSE'), path.join(vscode, 'LICENSE'));

	run('npx', ['--yes', '@vscode/vsce@4.0.0', 'package', '--out', path.join(output, 'elemenx-vscode.vsix')], vscode);

	made.push('elemenx-vscode.vsix');

	/* IntelliJ: against the IDE of the machine, or one downloaded for a release, or not at all. */
	java = jdk(ide);

	if (settings.IntelliJ !== false && (ide || download) && java) {
		/*
		 * On Linux and macOS gradlew goes through sh: a checkout keeps no mode the repository did not record, and a
		 * gradlew committed from Windows is no program there (regression: the release failed on Linux, permission denied).
		 */
		if (process.platform === 'win32') run(path.join(intellij, 'gradlew.bat'), gradle, intellij, Object.assign({}, process.env, {JAVA_HOME: java}));
		else run('sh', [path.join(intellij, 'gradlew')].concat(gradle), intellij, Object.assign({}, process.env, {JAVA_HOME: java}));

		/* The archive Gradle made: no version in its name (archiveFileName of build.gradle.kts). */
		copy(path.join(intellij, 'build', 'distributions', 'elemenx-intellij.zip'), path.join(output, 'elemenx-intellij.zip'));

		made.push('elemenx-intellij.zip');
	}
	else if (settings.IntelliJ === true) {
		throw new Error('Elemenx editors: the plugin of IntelliJ needs an IDE of JetBrains (ELEMENX_IDEA) or ELEMENX_INTELLIJ=download, and a JDK of 21 or more');
	}
	else if (settings.IntelliJ !== false) {
		log('Elemenx editors: the plugin of IntelliJ is left out: no IDE of JetBrains found (ELEMENX_IDEA names one; ELEMENX_INTELLIJ=download, with a JDK of 21 or more, downloads one)');
	}

	return made.map(function (name) {
		return {Name: name, Size: fs.statSync(path.join(output, name)).size};
	});
}

module.exports = {
	Build: Build,
	InstalledIdes: installedIdes
};

if (require.main === module) {
	(function (args) {
		try {
			Build({
				Idea: args.indexOf('--idea') !== -1 ? args[args.indexOf('--idea') + 1] : null,
				IntelliJ: args.indexOf('--intellij') !== -1 ? true : args.indexOf('--no-intellij') !== -1 ? false : undefined
			}).forEach(function (file) {
				process.stdout.write('  editors/' + file.Name + '  ' + Math.round(file.Size / 1024) + ' KB\n');
			});
		}
		catch (error) {
			process.stderr.write(error.message + '\n');

			process.exitCode = 1;
		}
	})(process.argv.slice(2));
}
