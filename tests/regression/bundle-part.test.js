import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';

var owned = [];
var urls = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('PartHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* A part as a build writes it: a script that gives the bundle the loaders of its entities. */
function part (code) {
	var url = URL.createObjectURL(new Blob([code], {type: 'text/javascript'}));

	urls.push(url);

	return url;
}

describe('Contract: Elemenx.Bundle.Part, a part of a bundle fetched the first time one of its entities is wanted', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		while (urls.length) URL.revokeObjectURL(urls.pop());
	});

	it('makes the Components of a part once it is fetched, one script for all of them', async function () {
		var a = unique('PartA');
		var b = unique('PartB');
		var url = part('window.partLoads = (window.partLoads || 0) + 1;\nElemenx.Bundle({Component: {' +
			a + ': function () { Elemenx.Component(' + JSON.stringify(a) + ', {$Template: \'<b class="part-a">A</b>\'}); },' +
			b + ': function () { Elemenx.Component(' + JSON.stringify(b) + ', {$Template: \'<i class="part-b">B</i>\'}); }' +
			'}});');
		var component;

		window.partLoads = 0;

		expect(Elemenx.Bundle.Part(url, {Component: [a, b]})).toBe(Elemenx);

		component = mount('<div><' + a + ' /><' + b + ' /></div>');

		expect(await waitFor(function () {
			return !!component.$Element().querySelector('.part-a') && !!component.$Element().querySelector('.part-b');
		}, 5000)).toBe(true);
		expect(window.partLoads).toBe(1);

		/* Made again later: from the bundle, without a fetch. */
		component = mount('<div><' + a + ' /></div>');

		expect(component.$Element().querySelector('.part-a')).not.toBe(null);
		expect(window.partLoads).toBe(1);
	});

	it('tells the owner a part that failed or did not bring its Component', async function () {
		var missing = unique('PartMissing');
		var broken = unique('PartBroken');
		var errors = [];

		Elemenx.Bundle.Part(part('/* nothing */'), {Component: [missing]});
		Elemenx.Bundle.Part('/no-such-part-' + Date.now() + '.js', {Component: [broken]});

		mount('<div><' + missing + ' /><' + broken + ' /></div>', {
			$OnChildError: function (event) {
				errors.push(event.Error.message);

				return true;
			}
		});

		expect(await waitFor(function () {
			return errors.length === 2;
		}, 5000)).toBe(true);
		expect(errors).toEqual(expect.arrayContaining([
			'Elemenx Bundle part did not bring Component: ' + missing + ' (' + urls[urls.length - 1] + ')',
			expect.stringMatching(/^Elemenx Bundle part failed: .*\/no-such-part-\d+\.js$/)
		]));
	});

	it('expects a URL and the names of its entities by type', function () {
		expect(function () {
			Elemenx.Bundle.Part('', {Component: ['A']});
		}).toThrow('Elemenx.Bundle.Part expects a URL and {Type: [names]}');
		expect(function () {
			Elemenx.Bundle.Part('parts/a.js', {Component: 'A'});
		}).toThrow('Elemenx.Bundle.Part expects a URL and {Type: [names]}');
	});
});
