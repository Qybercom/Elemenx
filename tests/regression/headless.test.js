import { describe, expect, it, beforeAll } from 'vitest';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);

/*
 * elemenx.js where there is no DOM and no storage of the browser (Node): it loads, and what needs no page works. It
 * took Node for a worker and threw as it loaded (it listened on a global with no addEventListener), and its Storage
 * read localStorage of a global that has none.
 */
describe('Elemenx without a DOM', function () {
	beforeAll(function () {
		delete globalThis.localStorage;
		delete globalThis.sessionStorage;

		require('../../elemenx.js');
	});

	it('loads, as no worker', function () {
		expect(typeof Elemenx).toBe('object');
		expect(Elemenx.Version).toMatch(/^\d+\.\d+\.\d+/);
	});

	it('keeps Local and Session in memory, one store for every facade', function () {
		Elemenx.Storage.Local.Set('Theme', 'dark');
		Elemenx.Storage.Session.Set('Visit', {Count: 2});

		var application = Elemenx.Application('HeadlessStorage', {});

		expect(Elemenx.Storage.Local.Get('Theme')).toBe('dark');
		expect(Elemenx.Storage.Session.Get('Visit')).toEqual({Count: 2});
		expect(application.$Storage().Local.Get('Theme')).toBe('dark');
		expect(Elemenx.Storage.Local.Has('Theme')).toBe(true);

		Elemenx.Storage.Local.Remove('Theme');

		expect(Elemenx.Storage.Local.Has('Theme')).toBe(false);
	});

	it('runs what needs no page: events, phrases, services, templates, the state of the install', function () {
		var events = Elemenx.Events('headless');
		var got = [];

		events.On('Saved', function (event) {
			got.push(event.Data);
		});

		events.Emit('Saved', 5);

		Elemenx.Locale.Add('en', {Hello: 'Hello {Name}'});
		Elemenx.Service('HeadlessCounter', {
			Count: function (value) {
				return value + 1;
			}
		});
		Elemenx.Template('headless-row', '<li>{{Name}}</li>');

		expect(got).toEqual([5]);
		expect(Elemenx.Locale.Text('Hello', {Name: 'Ada'})).toBe('Hello Ada');
		expect(Elemenx.Template('headless-row')).toBe('<li>{{Name}}</li>');
		expect(Elemenx.Application('HeadlessServices', {}).$Service('HeadlessCounter').Count(1)).toBe(2);
		expect(Elemenx.Install.State()).toEqual({Available: false, Installed: false, Manual: false, Waiting: false, Version: null});
	});
});
