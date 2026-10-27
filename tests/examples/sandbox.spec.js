import { test, expect } from '../coverage/playwright.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

import Server from '../../tools/server.js';

/*
 * A page in a sandboxed frame without allow-same-origin (an embed, a preview): its storage is denied, and reading
 * window.sessionStorage throws a SecurityError. Elemenx read it as it loaded, and did not load at all (regression).
 */
var Outer = '<!doctype html><html><body><iframe sandbox="allow-scripts" src="/inner.html"></iframe></body></html>';
var Inner = [
	'<!doctype html>',
	'<html>',
	'<head>',
	'	<script src="/elemenx.js"></script>',
	'</head>',
	'<body>',
	'	<div id="app"></div>',
	'	<script>',
	'		Elemenx.Component(\'SandboxApp\', {',
	'			$Template: \'<b>{{Text}}</b>\',',
	'			Text: \'mounted\',',
	'			$OnCreate: function () {',
	'				this.$Storage.Local.Set(\'Seen\', 2);',
	'			},',
	'			$OnReady: function () {',
	'				parent.postMessage({Text: this.$Element().textContent, Seen: Elemenx.Storage.Local.Get(\'Seen\'), Visit: Elemenx.Storage.Session.Get(\'Visit\')}, \'*\');',
	'			}',
	'		});',
	'		Elemenx.Storage.Session.Set(\'Visit\', 1);',
	'		Elemenx.Application(\'Sandbox\', {$Component: \'SandboxApp\', $Mount: \'#app\'});',
	'	</script>',
	'</body>',
	'</html>'
].join('\n');

test('Elemenx loads in a sandboxed frame, its storage kept in memory', async function ({ page }) {
	var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-sandbox-'));
	var server = Server.Create({Root: root});
	var errors = [];

	fs.writeFileSync(path.join(root, 'index.html'), Outer);
	fs.writeFileSync(path.join(root, 'inner.html'), Inner);

	await new Promise(function (resolve) {
		server.Listen(0, '127.0.0.1', resolve);
	});

	page.on('pageerror', function (error) {
		errors.push(error.message);
	});

	try {
		var received;
		var report = new Promise(function (resolve) {
			received = resolve;
		});

		await page.exposeFunction('reportSandbox', function (data) {
			received(data);
		});

		await page.addInitScript(function () {
			window.addEventListener('message', function (event) {
				if (event.data && event.data.Text !== undefined)
					window.reportSandbox(event.data);
			});
		});

		await page.goto('http://127.0.0.1:' + server.Server.address().port + '/');

		expect(await report).toEqual({Text: 'mounted', Seen: 2, Visit: 1});
		expect(errors).toEqual([]);
	}
	finally {
		await new Promise(function (resolve) {
			server.Close(resolve);
		});

		fs.rmSync(root, {recursive: true, force: true});
	}
});
