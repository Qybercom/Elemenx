import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';

var richText;

describe('Regression: RichText keeps no executable URL', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/services/RichText.js');

		richText = Elemenx.Service('RichText');
	});

	/* A browser drops tabs and line breaks in a URL and the controls around it: each of these is a javascript: URL. */
	it.each([
		'java\tscript:alert(1)',
		'java\nscript:alert(1)',
		'java\rscript:alert(1)',
		'\u0001javascript:alert(1)',
		'\u001f JaVa\tScRi\nPt:alert(1)\r',
		'javascript:alert(1)'
	])('refuses %j, for a link and for an image', function (url) {
		expect(new URL(url, location.href).protocol).toBe('javascript:');
		expect(richText.SafeURL(url)).toBe('');
		expect(richText.SafeURL(url, true)).toBe('');
	});

	it.each(['&#9;', '&#10;', '&#13;', '&#x0a;'])('takes away a link and an image whose URL hides javascript: behind %s', function (separator) {
		var html = '<p><a href="java' + separator + 'script:alert(1)">Read more</a><img src="java' + separator + 'script:alert(1)" /></p>';

		expect(richText.Sanitize(html)).toBe('<p>Read more</p>');
	});

	it('keeps the URLs it allows, without the characters a browser drops', function () {
		['https://example.com/page?q=1#part', 'mailto:reader@example.com', 'tel:+123456789', '/images/photo.png', './page', '../page', '?q=1', '#part'].forEach(function (url) {
			expect(richText.SafeURL(url)).toBe(url);
		});

		expect(richText.SafeURL('\u0001 ht\ttps://example.com/\r\n')).toBe('https://example.com/');
		expect(richText.SafeURL('data:image/png;base64,aGVsbG8=', true)).toBe('data:image/png;base64,aGVsbG8=');
		expect(richText.SafeURL('data:image/png;base64,aGVsbG8=')).toBe('');
	});
});
