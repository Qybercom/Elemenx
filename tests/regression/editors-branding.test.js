import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

var root = path.resolve(process.cwd(), 'editors');
var extension = JSON.parse(fs.readFileSync(path.join(root, 'extension.json'), 'utf8'));

/* The width and the height of a PNG, from its header. */
function size (file) {
	var bytes = fs.readFileSync(file);

	expect(bytes.subarray(1, 4).toString(), file).toBe('PNG');

	return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

describe('Elemenx editors: one description of the extensions', function () {
	it('describes the extensions once, in editors/extension.json, with a description in Markdown and a logo', function () {
		expect(extension).toMatchObject({Name: 'elemenx', DisplayName: 'Elemenx', Publisher: 'qybercom', License: 'LGPL-3.0-only'});
		expect(extension.Summary.length).toBeGreaterThan(20);
		expect(fs.readFileSync(path.join(root, extension.Description), 'utf8')).toMatch(/^\*\*Elemenx\*\*/);
		expect(fs.readFileSync(path.join(root, extension.Icon), 'utf8')).toContain('<svg');
	});

	it('gives VS Code its fields, its README and its icon from it', function () {
		var manifest = JSON.parse(fs.readFileSync(path.join(root, 'vscode', 'package.json'), 'utf8'));

		expect(manifest).toMatchObject({
			name: extension.Name,
			displayName: extension.DisplayName,
			description: extension.Summary,
			publisher: extension.Publisher,
			license: extension.License,
			icon: 'icon.png',
			homepage: extension.Homepage,
			repository: {url: extension.Repository},
			bugs: {url: extension.Issues},
			keywords: extension.Keywords,
			categories: extension.Categories.VSCode
		});
		expect(fs.readFileSync(path.join(root, 'vscode', 'README.md'), 'utf8')).toBe('# ' + extension.DisplayName + '\n\n' + fs.readFileSync(path.join(root, extension.Description), 'utf8'));
	});

	it('gives the plugin of JetBrains its name, vendor and description from it, and the logo as its icon', function () {
		var gradle = fs.readFileSync(path.join(root, 'intellij', 'build.gradle.kts'), 'utf8');
		var plugin = fs.readFileSync(path.join(root, 'intellij', 'src', 'main', 'resources', 'META-INF', 'plugin.xml'), 'utf8');
		var icon = fs.readFileSync(path.join(root, 'intellij', 'src', 'main', 'resources', 'META-INF', 'pluginIcon.svg'), 'utf8');

		expect(gradle).toContain('JsonSlurper().parse(file("../extension.json"))');
		expect(gradle).toContain('org.commonmark');
		expect(plugin).not.toMatch(/\n\t<(name|vendor|description)\b/);
		expect(icon).toContain('width="40" height="40"');
		expect(icon.replace(/ width="\d+" height="\d+"/, '')).toBe(fs.readFileSync(path.join(root, extension.Icon), 'utf8').replace(/ width="\d+" height="\d+"/, ''));
	});

	it('gives Visual Studio its manifest, its overview and its Marketplace manifest from it', function () {
		var build = fs.readFileSync(path.join(root, 'build.js'), 'utf8');
		var project = fs.readFileSync(path.join(root, 'visualstudio', 'Elemenx.VisualStudio.csproj'), 'utf8');

		expect(build).toContain("<Identity Id=\"' + xml(extension.Vendor.Name + '.' + extension.DisplayName)");
		expect(build).toContain("path.join(visualstudio, 'overview.md'), '# ' + extension.DisplayName + '\\n\\n' + description");
		expect(build).toContain('categories: extension.Categories.VisualStudio');
		expect(build).toContain("copy(path.join(branding, 'logo-90.png'), path.join(visualstudio, 'icon.png'))");
		expect(extension.Categories.VisualStudio.length).toBeGreaterThan(0);
		expect(project).toContain('Microsoft.VsSDK.targets');
		expect(project).toMatch(/<Content Include="icon\.png" IncludeInVSIX="true" \/>/);
	});

	it('keeps the PNG of the logo in the sizes of the marketplaces', function () {
		var branding = path.join(root, path.dirname(extension.Icon));

		expect(size(path.join(branding, 'logo-128.png'))).toEqual([128, 128]);
		expect(size(path.join(branding, 'logo-90.png'))).toEqual([90, 90]);
		expect(size(path.join(branding, 'logo-200.png'))).toEqual([200, 200]);
	});
});
