import { afterEach, describe, expect, it } from 'vitest';
import { waitFor } from '../setup.js';

var frames = [];

/*
 * A page whose address is no base of URLs (blob:, a frame a script made of a text, as the reference shows a demo):
 * the framework starts there, and its Router keeps the routes in memory and follows the links of the Application.
 */
describe('Regression: Elemenx runs in a page of a blob: URL', function () {
	afterEach(function () {
		frames.splice(0).forEach(function (frame) {
			URL.revokeObjectURL(frame.src);

			frame.remove();
		});
	});

	it('starts an Application with a Router there, its routes in memory, its links followed', async function () {
		var script = new URL(typeof __ELEMENX_SCRIPT__ === 'string' ? __ELEMENX_SCRIPT__ : '/elemenx.js', location.href).href;
		var page = '<!DOCTYPE html><html><head><script src="' + script + '"></script><script>' +
			/* A bundle embeds its files under their URLs, read against the base of the page. */
			"Elemenx.Resource('data/words.json', '[\"hello\"]');" +
			"Elemenx.Component('BlobHome', {$Template: '<a class=\"next\" href=\"/about\">{{Word}}</a>', Word: JSON.parse(Elemenx.Resource('data/words.json'))[0]});" +
			"Elemenx.Component('BlobAbout', {$Template: '<p class=\"about\">About us</p>'});" +
			"Elemenx.Application('BlobPage', {$Component: 'BlobShell', $Mount: 'body', $Router: {Routes: [{Path: '/', Component: 'BlobHome'}, {Path: '/about', Component: 'BlobAbout'}]}});" +
			"Elemenx.Component('BlobShell', {$Template: '<main *outlet=\"Content\"></main>'});" +
			'</script></head><body></body></html>';
		var frame = document.createElement('iframe');

		frame.src = URL.createObjectURL(new Blob([page], {type: 'text/html'}));

		frames.push(frame);

		document.body.appendChild(frame);

		expect(await waitFor(function () {
			return !!(frame.contentDocument && frame.contentDocument.querySelector('.next'));
		}, 5000)).toBe(true);
		expect(frame.contentDocument.querySelector('.next').textContent).toBe('hello');

		frame.contentDocument.querySelector('.next').click();

		expect(await waitFor(function () {
			return !!frame.contentDocument.querySelector('.about');
		}, 5000)).toBe(true);
		expect(frame.contentWindow.location.protocol).toBe('blob:');
	});
});
