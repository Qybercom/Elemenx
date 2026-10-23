import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';

var richText;

describe('Regression: RichText URL sanitization', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/services/RichText.js');

		richText = Elemenx.Service('RichText');
	});

	it.each([
		'java\tscript:alert(1)',
		'java\nscript:alert(1)',
		'java\rscript:alert(1)',
		'\u0001javascript:alert(1)',
		'\u001f JaVa\tScRi\nPt:alert(1)\r',
		'javascript:alert(1)'
	])('rejects an executable URL: %j', function (url) {
		expect(new URL(url, location.href).protocol).toBe('javascript:');
		expect(richText.SafeURL(url)).toBe('');
		expect(richText.SafeURL(url, true)).toBe('');
	});

	it.each(['&#9;', '&#10;', '&#13;', '&#x0a;'])('removes unsafe links and images after decoding %s', function (separator) {
		var html = '<p><a href="java' + separator + 'script:alert(1)">Read more</a><img src="java' + separator + 'script:alert(1)" /></p>';

		expect(richText.Sanitize(html)).toBe('<p>Read more</p>');
	});

	it.each([
		'https://example.com/page?q=1#part',
		'http://example.com/',
		'mailto:reader@example.com',
		'tel:+123456789',
		'/images/photo.png',
		'//example.com/photo.png',
		'./page',
		'../page',
		'page?q=1',
		'?q=1',
		'#part'
	])('preserves an allowed URL: %s', function (url) {
		expect(richText.SafeURL(url)).toBe(url);
	});

	it('normalizes browser-ignored characters in allowed URLs and preserves image data URLs', function () {
		var data = 'data:image/png;base64,aGVsbG8=';

		expect(richText.SafeURL('\u0001 ht\ttps://example.com/\r\n')).toBe('https://example.com/');
		expect(richText.SafeURL(data, true)).toBe(data);
		expect(richText.SafeURL('data:image/png;base64,aGVs\nbG8=', true)).toBe(data);
		expect(richText.SafeURL(data)).toBe('');
		expect(richText.SafeURL('data:text/html;base64,aGVsbG8=', true)).toBe('');
		expect(richText.SafeURL('data:image/svg+xml;base64,aGVsbG8=', true)).toBe('');
	});
});
