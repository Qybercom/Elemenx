import { describe, expect, it } from 'vitest';
import pageSource from '../../examples/Advanced/application/components/UIKitPage/UIKitPage.js?raw';

describe('Regression: the clocks of the UI kit page of Advanced', function () {
	/* The clocks of the demos of scenes (races, orbits, terrain, space) ran on after the page was gone. */
	it('stops every clock of the page when the page goes', function () {
		var start = pageSource.indexOf('$OnDestroy: function () {');
		var gone = pageSource.slice(start, pageSource.indexOf('\n\t},', start));
		var clocks = [];
		var found = /this\.([A-Za-z]+) = window\.set(Interval|Timeout)\(/g;
		var match;

		while ((match = found.exec(pageSource)))
			if (clocks.indexOf(match[1]) === -1)
				clocks.push(match[1]);

		expect(start).toBeGreaterThan(0);
		expect(clocks.length).toBeGreaterThan(5);
		expect(clocks.filter(function (name) {
			return gone.indexOf('this.' + name + ')') === -1;
		})).toEqual([]);
	});
});
