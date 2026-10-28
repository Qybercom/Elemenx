/*
 * Builds the extensions of the editors into dist/editors (npm run dist builds them after the files of the framework;
 * npm run editors alone):
 * - the one of VS Code, elemenx-vscode.vsix, with @vscode/vsce through npx;
 * - the plugin of the IDEs of JetBrains, elemenx-intellij.zip, with the Gradle of editors/intellij. It is
 *   built against an IDE of the machine when there is one (IntelliJ IDEA, WebStorm, PhpStorm... found where they are
 *   installed, or named by ELEMENX_IDEA or --idea <folder>), with the JDK it carries; else, with ELEMENX_INTELLIJ=download
 *   (a release), against an IntelliJ IDEA that Gradle downloads, with a JDK of 21 or more (JAVA_HOME, JAVA_HOME_21_X64...);
 *   else it is left out, and told so.
 * - the one of Visual Studio 2022, elemenx-visualstudio.vsix, with the MSBuild of the Visual Studio of the machine (found
 *   by vswhere, with the workload Visual Studio extension development); on Windows only, else it is left out, and told so.
 * The core of the language, the meta.json of ElemenxUI and the sources of Elemenx and ElemenxUI go into each of them;
 * their names, descriptions and icons come from editors/extension.json. Build({Output, Idea, VSCode, IntelliJ,
 * VisualStudio, Only, Log}) returns [{Name, Size}] of the files made; VSCode false leaves it out; IntelliJ or
 * VisualStudio: false leaves it out, true needs it; Only (vscode, intellij or visualstudio; --only) builds that one alone
 * and needs it: CI builds each in a job of its own, in parallel.
 */
var fs = require('fs');
var path = require('path');
var child = require('child_process');

var root = path.resolve(__dirname, '..');
var vscode = path.join(__dirname, 'vscode');
var intellij = path.join(__dirname, 'intellij');
var visualstudio = path.join(__dirname, 'visualstudio');

function copy (from, to) {
	fs.mkdirSync(path.dirname(to), {recursive: true});
	fs.copyFileSync(from, to);
}

/*
 * The extension of VS Code as editors/extension.json describes it: the fields of its package.json, its README (the
 * page of the Marketplace: the Markdown of Description under the name), its icon (the PNG of 128 of the logo).
 */
function brand (extension) {
	var manifest = path.join(vscode, 'package.json');
	var text = fs.readFileSync(manifest, 'utf8');
	var data = JSON.parse(text);
	var description = fs.readFileSync(path.join(__dirname, extension.Description), 'utf8');

	data.name = extension.Name;
	data.displayName = extension.DisplayName;
	data.description = extension.Summary;
	data.publisher = extension.Publisher;
	data.license = extension.License;
	data.icon = 'icon.png';
	data.homepage = extension.Homepage;
	data.repository = {type: 'git', url: extension.Repository};
	data.bugs = {url: extension.Issues};
	data.keywords = extension.Keywords;
	data.categories = extension.Categories.VSCode;

	fs.writeFileSync(manifest, JSON.stringify(data, null, '\t') + '\n');
	fs.writeFileSync(path.join(vscode, 'README.md'), '# ' + extension.DisplayName + '\n\n' + description);

	copy(path.join(__dirname, path.dirname(extension.Icon), 'logo-128.png'), path.join(vscode, 'icon.png'));
}

/* The sources of a Library the definitions go to: its meta.json, the .js and .html of its Components, its directives and Services, its locales (the keys of $T). */
function sources (library, to) {
	fs.rmSync(to, {recursive: true, force: true});

	copy(path.join(library, 'data', 'meta.json'), path.join(to, 'data', 'meta.json'));

	['components', 'directives', 'services', 'locales'].forEach(function (folder) {
		(function walk (directory) {
			fs.readdirSync(directory, {withFileTypes: true}).forEach(function (entry) {
				var file = path.join(directory, entry.name);

				if (entry.isDirectory()) walk(file);
				else if (/\.(js|html|json)$/.test(entry.name)) copy(file, path.join(to, path.relative(library, file)));
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
	/* A program (.exe: MSBuild in C:\Program Files) goes without the shell: a shell line breaks its path at the space. */
	var result = process.platform === 'win32' && !/\.exe$/i.test(command) ? child.spawnSync(line, Object.assign({shell: true}, settings)) : child.spawnSync(command, list, settings);
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

/* The MSBuild of the Visual Studio of the machine that builds extensions (vswhere), or null. */
function msbuild () {
	var vswhere = path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');
	var found;

	if (process.platform !== 'win32' || !fs.existsSync(vswhere)) return null;

	found = child.spawnSync(vswhere, ['-latest', '-requires', 'Microsoft.VisualStudio.Component.VSSDK', '-find', 'MSBuild\\**\\Bin\\MSBuild.exe'], {encoding: 'utf8'});

	return found.status === 0 && found.stdout.trim() ? found.stdout.trim().split(/\r?\n/)[0] : null;
}

/* Text for XML. */
function xml (value) {
	return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/*
 * The files of the extension of Visual Studio beside its project: the server and the core it carries, its manifest of
 * editors/extension.json (a version of Visual Studio has no prerelease part: 0.11.0 of 0.11.0-beta.1), its icon, its
 * preview, its license, and the overview and the manifest the Marketplace takes on a release.
 */
function stageVisualStudio (extension, version) {
	var description = fs.readFileSync(path.join(__dirname, extension.Description), 'utf8');
	var branding = path.join(__dirname, path.dirname(extension.Icon));

	fs.rmSync(path.join(visualstudio, 'server'), {recursive: true, force: true});
	fs.rmSync(path.join(visualstudio, 'core'), {recursive: true, force: true});

	copy(path.join(__dirname, 'server', 'elemenx-language-server.js'), path.join(visualstudio, 'server', 'elemenx-language-server.js'));
	copy(path.join(__dirname, 'core', 'elemenx-language.js'), path.join(visualstudio, 'core', 'elemenx-language.js'));
	copy(path.join(root, 'libraries', 'ElemenxUI', 'data', 'meta.json'), path.join(visualstudio, 'core', 'meta.json'));
	copy(path.join(root, 'elemenx.js'), path.join(visualstudio, 'core', 'elemenx.js'));

	sources(path.join(root, 'libraries', 'ElemenxUI'), path.join(visualstudio, 'core', 'library'));

	copy(path.join(branding, 'logo-90.png'), path.join(visualstudio, 'icon.png'));
	copy(path.join(branding, 'logo-200.png'), path.join(visualstudio, 'preview.png'));
	copy(path.join(root, 'LICENSE'), path.join(visualstudio, 'LICENSE.txt'));

	fs.writeFileSync(path.join(visualstudio, 'source.extension.vsixmanifest'), [
		'<?xml version="1.0" encoding="utf-8"?>',
		'<!-- Written by editors/build.js from editors/extension.json. -->',
		'<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">',
		'\t<Metadata>',
		'\t\t<Identity Id="' + xml(extension.Vendor.Name + '.' + extension.DisplayName) + '" Version="' + xml(version.replace(/-.*$/, '')) + '" Language="en-US" Publisher="' + xml(extension.Vendor.Name) + '" />',
		'\t\t<DisplayName>' + xml(extension.DisplayName) + '</DisplayName>',
		'\t\t<Description xml:space="preserve">' + xml(extension.Summary) + '</Description>',
		'\t\t<MoreInfo>' + xml(extension.Homepage) + '</MoreInfo>',
		'\t\t<License>LICENSE.txt</License>',
		'\t\t<Icon>icon.png</Icon>',
		'\t\t<PreviewImage>preview.png</PreviewImage>',
		'\t\t<Tags>' + xml(extension.Keywords.join(', ')) + '</Tags>',
		'\t</Metadata>',
		'\t<Installation>',
		'\t\t<InstallationTarget Id="Microsoft.VisualStudio.Community" Version="[17.10,18.0)">',
		'\t\t\t<ProductArchitecture>amd64</ProductArchitecture>',
		'\t\t</InstallationTarget>',
		'\t</Installation>',
		'\t<Dependencies>',
		'\t\t<Dependency Id="Microsoft.Framework.NDP" DisplayName="Microsoft .NET Framework" d:Source="Manual" Version="[4.7.2,)" />',
		'\t</Dependencies>',
		'\t<Prerequisites>',
		'\t\t<Prerequisite Id="Microsoft.VisualStudio.Component.CoreEditor" Version="[17.0,18.0)" DisplayName="Visual Studio core editor" />',
		'\t</Prerequisites>',
		'\t<Assets>',
		'\t\t<Asset Type="Microsoft.VisualStudio.MefComponent" d:Source="Project" d:ProjectName="%CurrentProject%" Path="|%CurrentProject%|" />',
		'\t</Assets>',
		'</PackageManifest>',
		''
	].join('\n'));

	fs.writeFileSync(path.join(visualstudio, 'overview.md'), '# ' + extension.DisplayName + '\n\n' + description);
	fs.writeFileSync(path.join(visualstudio, 'publishManifest.json'), JSON.stringify({
		$schema: 'http://json.schemastore.org/vsix-publish',
		categories: extension.Categories.VisualStudio,
		identity: {internalName: extension.Name},
		overview: 'overview.md',
		priceCategory: 'free',
		publisher: extension.Publisher,
		private: false,
		qna: true,
		repo: extension.Repository
	}, null, '\t') + '\n');
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
	var extension = JSON.parse(fs.readFileSync(path.join(__dirname, 'extension.json'), 'utf8'));
	var builder;
	var java;

	fs.mkdirSync(output, {recursive: true});

	/* Only: one extension alone, required (a job of CI for each, in parallel). */
	if (settings.Only) {
		if (['vscode', 'intellij', 'visualstudio'].indexOf(settings.Only) === -1)
			throw new Error('Elemenx editors: --only takes vscode, intellij or visualstudio, not ' + settings.Only);

		settings = Object.assign({}, settings, {VSCode: settings.Only === 'vscode', IntelliJ: settings.Only === 'intellij', VisualStudio: settings.Only === 'visualstudio'});
	}

	/* VS Code: the core beside the extension, then the package. */
	if (settings.VSCode !== false) {
		brand(extension);

		copy(path.join(__dirname, 'core', 'elemenx-language.js'), path.join(vscode, 'core', 'elemenx-language.js'));
		copy(path.join(root, 'libraries', 'ElemenxUI', 'data', 'meta.json'), path.join(vscode, 'core', 'meta.json'));

		/* The sources of Elemenx and ElemenxUI of this version: a project with a build of dist alone goes to their definitions here. */
		copy(path.join(root, 'elemenx.js'), path.join(vscode, 'core', 'elemenx.js'));

		sources(path.join(root, 'libraries', 'ElemenxUI'), path.join(vscode, 'core', 'library'));

		copy(path.join(root, 'LICENSE'), path.join(vscode, 'LICENSE'));

		run('npx', ['--yes', '@vscode/vsce@4.0.0', 'package', '--out', path.join(output, 'elemenx-vscode.vsix')], vscode);

		made.push('elemenx-vscode.vsix');
	}

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

	/* Visual Studio: its MSBuild, on Windows. */
	builder = settings.VisualStudio === false ? null : msbuild();

	if (builder) {
		stageVisualStudio(extension, require(path.join(root, 'package.json')).version);

		/*
		 * A build from nothing: the incremental one kept the extension.vsixmanifest it made first (regression: the .vsix
		 * of 0.10.6 said 0.10.2). The restore of the packages stays in obj.
		 */
		fs.rmSync(path.join(visualstudio, 'obj', 'Release'), {recursive: true, force: true});
		fs.rmSync(path.join(visualstudio, 'bin', 'Release'), {recursive: true, force: true});

		run(builder, [path.join(visualstudio, 'Elemenx.VisualStudio.csproj'), '/restore', '/p:Configuration=Release', '/v:minimal', '/nologo'], visualstudio);

		copy(path.join(visualstudio, 'bin', 'Release', 'net472', 'Elemenx.VisualStudio.vsix'), path.join(output, 'elemenx-visualstudio.vsix'));

		made.push('elemenx-visualstudio.vsix');
	}
	else if (settings.VisualStudio === true) {
		throw new Error('Elemenx editors: the extension of Visual Studio needs Windows and a Visual Studio 2022 with the workload Visual Studio extension development');
	}
	else if (settings.VisualStudio !== false) {
		log('Elemenx editors: the extension of Visual Studio is left out: it needs Windows and a Visual Studio 2022 with the workload Visual Studio extension development');
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
				Only: args.indexOf('--only') !== -1 ? args[args.indexOf('--only') + 1] : null,
				IntelliJ: args.indexOf('--intellij') !== -1 ? true : args.indexOf('--no-intellij') !== -1 ? false : undefined,
				VisualStudio: args.indexOf('--visualstudio') !== -1 ? true : args.indexOf('--no-visualstudio') !== -1 ? false : undefined
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
