import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Checked, Qualities, Scenarios } from '../perf/scene-scenarios.mjs';

var pages = path.join(import.meta.dirname, '..', '..', 'examples', 'Advanced', 'application', 'components');

/* The demos a page lists: {Name: 'Racing', ...} in its list of demos. */
function demos (file) {
	var text = fs.readFileSync(path.join(pages, file), 'utf8');
	var found = [];
	var match;
	var pattern = /\{Name: '(\w+)', Label:/g;

	while ((match = pattern.exec(text)))
		found.push(match[1]);

	return found;
}

/*
 * The bench of the frames of 3D (tests/perf/scene.bench.mjs) measures every demo of /gaming and /graphics: a demo
 * added to a page and not to its scenarios would go unmeasured.
 */
describe('Contract: the bench of 3D measures every demo of the pages of games and graphics', function () {
	it('has a scenario for each demo, on its page, at the levels medium, high and ultra', function () {
		var gaming = demos('GamingPage/GamingPage.js');
		var graphics = demos('GraphicsPage/GraphicsPage.js');

		expect(gaming.length).toBeGreaterThan(3);
		expect(graphics.length).toBeGreaterThan(3);
		expect(Scenarios.filter(function (one) {
			return one.Page === 'gaming';
		}).map(function (one) {
			return one.Name;
		}).sort()).toEqual(gaming.slice().sort());
		expect(Scenarios.filter(function (one) {
			return one.Page === 'graphics';
		}).map(function (one) {
			return one.Name;
		}).sort()).toEqual(graphics.slice().sort());
		expect(Qualities).toEqual(['medium', 'high', 'ultra']);
		expect(Checked).toEqual(['Draws', 'Triangles', 'Gl', 'Garbage']);
	});
});
