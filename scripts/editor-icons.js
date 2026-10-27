'use strict';

/*
 * The icons of the extensions of the editors, from the logo (editors/branding/logo.svg, the one of editors/extension.json):
 * PNG of 128 pixels (VS Code), 90 and 200 (Visual Studio: its icon and its preview), drawn by Chrome through Playwright,
 * and the pluginIcon.svg of 40 the JetBrains Marketplace and the IDEs show. They are kept in the repository: a build
 * of the extensions needs no browser. Run it after a change of the logo: npm run editors:icons
 */
var fs = require('fs');
var path = require('path');

var Root = path.resolve(__dirname, '..');
var Extension = JSON.parse(fs.readFileSync(path.join(Root, 'editors', 'extension.json'), 'utf8'));
var Logo = fs.readFileSync(path.join(Root, 'editors', Extension.Icon), 'utf8');
var Branding = path.dirname(path.join(Root, 'editors', Extension.Icon));
var Sizes = [128, 90, 200];

function sized (size) {
	return Logo.replace(/\swidth="\d+"\s+height="\d+"/, ' width="' + size + '" height="' + size + '"');
}

/* The JetBrains icon: the logo of 40 pixels, beside the plugin.xml it goes with. */
fs.writeFileSync(path.join(Root, 'editors', 'intellij', 'src', 'main', 'resources', 'META-INF', 'pluginIcon.svg'), sized(40));

require('playwright').chromium.launch({channel: 'chrome'}).then(function (browser) {
	return browser.newPage().then(function (page) {
		var chain = Promise.resolve();

		Sizes.forEach(function (size) {
			chain = chain.then(function () {
				return page.setContent('<body style="margin: 0; background: transparent">' + sized(size) + '</body>');
			}).then(function () {
				return page.locator('svg').screenshot({path: path.join(Branding, 'logo-' + size + '.png'), omitBackground: true});
			}).then(function () {
				process.stdout.write('Elemenx icons: logo-' + size + '.png\n');
			});
		});

		return chain;
	}).then(function () {
		return browser.close();
	});
}).catch(function (error) {
	process.stderr.write('Elemenx icons: ' + (error && error.message || error) + '\n');

	process.exitCode = 1;
});
