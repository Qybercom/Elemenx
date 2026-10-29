import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Design = require('../../tools/designer.js');
var Server = require('../../tools/server.js');
var project;

function write (file, text) {
	fs.mkdirSync(path.dirname(path.join(project, file)), {recursive: true});
	fs.writeFileSync(path.join(project, file), text);
}

function get (port, url, method) {
	return new Promise(function (resolve, reject) {
		var request = http.request({host: '127.0.0.1', port: port, path: url, method: method || 'GET'}, function (response) {
			var chunks = [];

			response.on('data', function (chunk) {
				chunks.push(chunk);
			});
			response.on('end', function () {
				resolve({Status: response.statusCode, Type: response.headers['content-type'], Text: Buffer.concat(chunks).toString()});
			});
		});

		request.on('error', reject);
		request.end();
	});
}

/* elemenx designer: what the Designer reads of a project, and the files it is given, never written. */
describe('Elemenx designer: a project for the Designer', function () {
	beforeAll(function () {
		project = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-design-'));

		write('app.js', "Elemenx.Network.Protocol('Json', {});\nElemenx.Application('Shop', {$Title: 'The shop', $Component: 'Shell', $Root: 'Shop', $Use: ['ElemenxUI'], $Router: {Routes: [{Path: '/', Component: 'Home'}, {Path: '/cart', Component: 'Cart', Guard: 'SignedIn', Children: [{Path: '/pay', Component: 'Pay', Guards: ['SignedIn', 'Paid']}]}]}});\n");
		write('Shop/index.js', "['components', 'services', 'guards']\n");
		write('Shop/components/index.js', "['Shell/Shell.js', 'Cart/Cart.js']\n");
		write('Shop/components/Shell/Shell.js', "Elemenx.Component('Shell', {$TemplateURL: 'Shell.html', $StyleURL: 'Shell.css', Title: 'Shop', Count: 0, Open: false, Items: [], Go: function () {}});\n");
		write('Shop/components/Shell/Shell.html', '<main>{{Title}}</main>\n');
		write('Shop/components/Shell/Shell.css', 'main { padding: 8px; }\n');
		write('Shop/components/Cart/Cart.js', "Elemenx.Component('Cart', {$Template: '<ul></ul>', $Meta: {Description: 'The cart.', Props: {Items: 'The items.'}, Events: {pay: 'Paid.'}, Slots: ['footer']}, Items: []});\n");
		write('Shop/services/index.js', "['Store.js']\n");
		write('Shop/services/Store.js', "Elemenx.Service('Store', {Get: function () {}, Put: function () {}});\n");
		write('Shop/guards/index.js', "['SignedIn.js']\n");
		write('Shop/guards/SignedIn.js', "Elemenx.Guard('SignedIn', function () {\n\treturn !!this.$Service('Store').Get();\n});\n");
		write('node_modules/secret.js', 'secret');
	});

	afterAll(function () {
		fs.rmSync(project, {recursive: true, force: true});
	});

	it('describes its Applications with their routes and guards, and its Components, Services and Guards from their files', function () {
		var described = Design.Describe(project);
		var shell = described.Components.filter(function (item) {
			return item.Name === 'Shell';
		})[0];
		var cart = described.Components.filter(function (item) {
			return item.Name === 'Cart';
		})[0];

		expect(described.Applications).toEqual([{Name: 'Shop', Title: 'The shop', Root: 'Shop', Component: 'Shell', Use: ['ElemenxUI'], Routes: [
			{Path: '/', Component: 'Home', Guards: [], Redirect: ''},
			{Path: '/cart', Component: 'Cart', Guards: ['SignedIn'], Redirect: ''},
			{Path: '/cart/pay', Component: 'Pay', Guards: ['SignedIn', 'Paid'], Redirect: ''}
		], Guards: ['SignedIn', 'Paid']}]);
		expect(described.Libraries).toEqual(['ElemenxUI']);
		expect(shell).toMatchObject({Root: 'Shop', File: 'Shop/components/Shell/Shell.js', Template: 'Shop/components/Shell/Shell.html', Style: 'Shop/components/Shell/Shell.css', Methods: ['Go']});
		expect(shell.Props.map(function (prop) {
			return prop.Name + ':' + prop.Type;
		})).toEqual(['Title:text', 'Count:number', 'Open:bool', 'Items:json']);
		expect(cart).toMatchObject({Description: 'The cart.', Inline: '<ul></ul>', Slots: ['footer']});
		expect(cart.Props.map(function (prop) {
			return prop.Name;
		})).toEqual(['Items']);
		expect(described.Services).toEqual([{Name: 'Store', Root: 'Shop', File: 'Shop/services/Store.js', Description: '', Methods: ['Get', 'Put']}]);
		expect(described.Guards).toEqual([{Name: 'SignedIn', Root: 'Shop', File: 'Shop/guards/SignedIn.js', Code: "\treturn !!this.$Service('Store').Get();"}]);
	});

	it('answers its description and its files, read only, and nothing outside the project or in node_modules', async function () {
		var server = Server.Create({Root: project, Request: Design.Request(project)});
		var port;

		await new Promise(function (resolve) {
			server.Listen(0, '127.0.0.1', resolve);
		});

		port = server.Server.address().port;

		try {
			var described = await get(port, '/__project/describe.json');
			var file = await get(port, '/__project/files/Shop/components/Shell/Shell.html');

			expect(described.Status).toBe(200);
			expect(JSON.parse(described.Text).Name).toBe(path.basename(project));
			expect([file.Status, file.Text, file.Type]).toEqual([200, '<main>{{Title}}</main>\n', 'text/html; charset=utf-8']);
			expect((await get(port, '/__project/files/%2e%2e/%2e%2e/etc/hosts')).Status).toBe(404);
			expect((await get(port, '/__project/files/node_modules/secret.js')).Status).toBe(404);
			expect((await get(port, '/__project/files/Shop/missing.js')).Status).toBe(404);
			expect((await get(port, '/__project/describe.json', 'POST')).Status).toBe(405);
			expect((await get(port, '/__project/files/app.js', 'PUT')).Status).toBe(405);
		}
		finally {
			await new Promise(function (resolve) {
				server.Close(resolve);
			});
		}
	});

	it('gives the page of the Designer the description as a script, before the application starts', async function () {
		var site = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-design-site-'));
		var server;
		var port;

		fs.writeFileSync(path.join(site, 'index.html'), '<html><head>\n\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>\n</head><body></body></html>\n');

		server = Server.Create({Root: site, Request: Design.Request(project, 'app.js', path.join(site, 'index.html'))});

		await new Promise(function (resolve) {
			server.Listen(0, '127.0.0.1', resolve);
		});

		port = server.Server.address().port;

		try {
			var page = await get(port, '/');
			var script = await get(port, '/__project/describe.js');
			var box = {window: {}};

			expect(page.Text).toContain('<script src="/elemenx.js"></script>\n\t<script src="/__project/describe.js"></script>\n\t<script src="/app.js"></script>');
			expect(script.Type).toBe('text/javascript; charset=utf-8');

			new Function('window', script.Text)(box.window);

			expect(box.window.ElemenxDesigner.Name).toBe(path.basename(project));
			expect(box.window.ElemenxDesigner.Components.length).toBe(2);
		}
		finally {
			await new Promise(function (resolve) {
				server.Close(resolve);
			});

			fs.rmSync(site, {recursive: true, force: true});
		}
	});
});
