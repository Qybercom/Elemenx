import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, unique } from '../setup.js';

describe('Regression: Elemenx.Resource', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	it('embeds a text under its absolute URL and returns it for any spelling of that URL', function () {
		var name = unique('resource') + '.svg';

		expect(Elemenx.Resource('/embedded/' + name)).toBe(null);
		expect(Elemenx.Resource('/embedded/' + name, '<svg/>')).toBe('<svg/>');
		expect(Elemenx.Resource(location.origin + '/embedded/' + name)).toBe('<svg/>');
		expect(Elemenx.Resource('/embedded/./' + name)).toBe('<svg/>');
	});

	it('loads the embedded text at once, and fetches what is not embedded', async function () {
		var name = '/embedded/' + unique('data') + '.json';
		var calls = [];
		var fetched;
		var failed;

		Elemenx.Resource(name, '{"a":1}');
		Elemenx.Resource.Load(name, function (error, text) {
			calls.push([error, text]);
		});

		expect(calls).toEqual([[null, '{"a":1}']]);

		fetched = await new Promise(function (resolve) {
			Elemenx.Resource.Load('/package.json', function (error, text) {
				resolve([error, JSON.parse(text).name]);
			});
		});

		expect(fetched).toEqual([null, '@qybercom/elemenx']);

		failed = await new Promise(function (resolve) {
			Elemenx.Resource.Load('/' + unique('absent') + '.json', function (error, text) {
				resolve([error && error.message, text]);
			});
		});

		expect(failed[0]).toMatch(/^Elemenx Resource failed: \/absent\d+\.json \[404\]$/);
		expect(failed[1]).toBe(undefined);
	});

	it('validates its arguments', function () {
		expect(function () {
			Elemenx.Resource('/a.svg', 42);
		}).toThrow('Elemenx.Resource expects (url, text)');
		expect(function () {
			Elemenx.Resource();
		}).toThrow('Elemenx.Resource expects (url) or (url, text)');
		expect(function () {
			Elemenx.Resource.Load('/a.svg');
		}).toThrow('Elemenx.Resource.Load expects (url, callback)');
	});
});
