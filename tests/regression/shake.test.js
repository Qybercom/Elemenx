import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Shake = require('../../tools/shake.js');
var source = fs.readFileSync(path.resolve('elemenx.js'), 'utf8');

function sections (text) {
	return (text.match(/^\t\/\* [A-Za-z][A-Za-z ]* \*\/$/gm) || []).map(function (line) {
		return line.slice(4, -3);
	});
}

describe('tools/shake.js', function () {
	it('names in elemenx.js every section of its groups', function () {
		var names = sections(source);

		Shake.Groups.forEach(function (group) {
			group.Sections.forEach(function (section) {
				expect(names).toContain(section);
			});
		});
	});

	it('leaves out every group code does not use, and the framework still parses and ends', function () {
		var result = Shake.Shake(source, "Elemenx.Component('Foo', {$Template: '<div></div>'});");
		var names = sections(result.Source);

		expect(result.Removed).toEqual(['Router', 'Network', 'Storage', 'Events', 'Messaging', 'WebWorker', 'ServiceWorker', 'Install', 'Splash']);
		expect(names).not.toContain('Network');
		expect(names).not.toContain('ServiceWorker bootstrap');
		expect(names).toContain('Application');
		expect(result.Source).not.toContain('Elemenx.Network =');
		expect(result.Source.slice(-6)).toBe(source.slice(-6));
		expect(function () {
			new Function(result.Source);
		}).not.toThrow();
	});

	it('finds the sections in a framework whose lines end in CRLF, as Git on Windows checks it out', function () {
		var result = Shake.Shake(source.replace(/\n/g, '\r\n'), "Elemenx.Component('Foo', {$Template: '<div></div>'});");

		expect(result.Removed).toEqual(['Router', 'Network', 'Storage', 'Events', 'Messaging', 'WebWorker', 'ServiceWorker', 'Install', 'Splash']);
		expect(result.Source).not.toContain('Elemenx.Network =');
	});

	it('keeps the groups a kept group needs', function () {
		var result = Shake.Shake(source, "this.$Messaging.Send('foo', {});");

		expect(result.Removed).toEqual(['Router', 'Network', 'Storage', 'WebWorker', 'ServiceWorker', 'Install', 'Splash']);
		expect(sections(result.Source)).toContain('Events');
	});

	it('keeps every section for an Application with workers, whose scripts a build does not read', function () {
		expect(Shake.Shake(source, "Elemenx.Application('Foo', {$WebWorker: {Bar: 'bar.js'}});")).toEqual({Source: source, Removed: []});
		expect(Shake.Shake(source, 'Elemenx.ServiceWorker.Register()').Removed).toEqual([]);
	});

	it('finds the use in templates and in the facades of owners', function () {
		expect(Shake.Shake(source, '<a (click)="$Router.Navigate(\'/\')"></a>').Removed).not.toContain('Router');
		expect(Shake.Shake(source, '$OnEvent: {Foo: function () {}}').Removed).not.toContain('Events');
		expect(Shake.Shake(source, 'this.$Network.Http.Get(url)').Removed).not.toContain('Network');
	});

	it('keeps the splash and the installation for a page that has them, or a code that names them', function () {
		expect(Shake.Shake(source, '<div id="elemenx-splash"></div>').Removed).not.toContain('Splash');
		expect(Shake.Shake(source, 'Elemenx.Splash.Hold()').Removed).not.toContain('Splash');
		expect(Shake.Shake(source, '<meta name="elemenx-pwa-worker">').Removed).not.toContain('Install');
		expect(Shake.Shake(source, 'Elemenx.Install.Prompt(done)').Removed).not.toContain('Install');

		/* Without them, the Application starts all the same. */
		expect(function () {
			new Function(Shake.Shake(source, '').Source);
		}).not.toThrow();
	});

	it('leaves out the transports of Network the code names nowhere, and keeps the parts the others need', function () {
		function transports (code) {
			var result = Shake.Shake(source, code);
			var window = {document: {readyState: 'complete', addEventListener: function () {}}, addEventListener: function () {}};

			new Function('globalThis', 'self', 'window', result.Source)(window, window, window);

			return {Removed: result.Removed, Network: Object.keys(window.Elemenx.Network).sort()};
		}

		var xhr = transports('this.$Network().XHR({URL: "/x"});');
		var transfer = transports('this.$Network().Transfer({});');

		expect(xhr.Network).toEqual(['Context', 'Protocol', 'XHR']);
		expect(xhr.Removed).toEqual(expect.arrayContaining(['Network: WebRTC', 'Network: WebSocket', 'Network: Transfer', 'Network: Transfer outbound engine', 'Network: Metrics']));
		expect(xhr.Removed).not.toContain('Network: lifecycle and structured envelope');

		/* A Transfer keeps the parts it calls (its engine, its sources and chunks), not the other transports. */
		expect(transfer.Network).toEqual(['Context', 'Protocol', 'Transfer']);
		expect(transfer.Removed).not.toContain('Network: Transfer outbound engine');
		expect(transfer.Removed).toContain('Network: WebRTC');
	});
});
