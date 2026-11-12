import { describe, expect, it } from 'vitest';
import pageSource from '../../examples/Advanced/application/components/UIKitPage/UIKitPage.js?raw';

/* The demos of scenes of the pages Graphics and Gaming, each a component of its own. */
var demos = import.meta.glob('../../examples/Advanced/application/components/*Demo/*Demo.js', {query: '?raw', import: 'default', eager: true});

/* The clocks a source sets (this.X = window.setInterval or setTimeout) that its $OnDestroy does not stop. */
function running (source) {
	var start = source.indexOf('$OnDestroy: function () {');
	var gone = start === -1 ? '' : source.slice(start, source.indexOf('\n\t}', start));
	var clocks = [];
	var found = /this\.([A-Za-z]+) = window\.set(Interval|Timeout)\(/g;
	var match;

	while ((match = found.exec(source)))
		if (clocks.indexOf(match[1]) === -1)
			clocks.push(match[1]);

	return {Clocks: clocks, Running: clocks.filter(function (name) {
		return gone.indexOf('this.' + name + ')') === -1;
	})};
}

describe('Regression: the clocks of the pages of Advanced', function () {
	/* The clocks of the demos of scenes (races, orbits, terrain, space) ran on after the page was gone. */
	it('stops every clock of the UI kit page when the page goes', function () {
		var page = running(pageSource);

		expect(pageSource.indexOf('$OnDestroy: function () {')).toBeGreaterThan(0);
		expect(page.Clocks.length).toBeGreaterThan(2);
		expect(page.Running).toEqual([]);
	});

	it('stops every clock of a demo of Graphics and Gaming when it goes (another demo chosen)', function () {
		var names = Object.keys(demos);
		var all = 0;

		expect(names.length).toBeGreaterThan(10);

		names.forEach(function (name) {
			var demo = running(demos[name]);

			all += demo.Clocks.length;

			expect([name, demo.Running]).toEqual([name, []]);
		});

		/* Orbit, Racing, Terrain and Space keep one each. */
		expect(all).toBeGreaterThanOrEqual(4);
	});
});
