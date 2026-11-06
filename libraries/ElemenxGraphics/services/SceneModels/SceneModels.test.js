import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

describe('Contract: Models, a recipe of data: parts of shapes in pieces, mirrors, chances and variants of a seed', function () {
	var models;
	var defined = [];

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneModels']);

		models = Elemenx.Service('SceneModels');
	});

	function define (name, recipe) {
		defined.push(name);

		models.Define(name, recipe);

		return name;
	}

	function piece (model, id) {
		return model.Pieces.filter(function (one) {
			return one.ID === id;
		})[0];
	}

	/* The bounds of the positions of a piece: [x0, y0, z0, x1, y1, z1]. */
	function bounds (made) {
		var p = made.Geometry.Positions;
		var low = [Infinity, Infinity, Infinity];
		var high = [-Infinity, -Infinity, -Infinity];
		var i;

		for (i = 0; i < p.length; i += 3) {
			low = [Math.min(low[0], p[i]), Math.min(low[1], p[i + 1]), Math.min(low[2], p[i + 2])];
			high = [Math.max(high[0], p[i]), Math.max(high[1], p[i + 1]), Math.max(high[2], p[i + 2])];
		}

		return low.concat(high).map(function (value) {
			return Math.round(value * 1e4) / 1e4;
		});
	}

	it('makes its parts where they are told in the pieces they name, of their colors, with the pieces it describes', function () {
		var name = define('recipe-plain', {Type: 'unit', Rig: 'Biped', Pieces: [{ID: 'head', Parent: 'body', Pivot: [0, 0.8, 0], Team: true}], Parts: [
			{ID: 'chest', Shape: 'box', At: [0, 0.5, 0], Size: [0.4, 0.6, 0.2], Color: '#ff8000'},
			{ID: 'head', Shape: 'ball', Piece: 'head', At: [0, 0.9, 0], Size: [0.2, 0.2, 0.2], Color: [0, 0, 1], Tags: ['face']},
			{ID: 'arm', Shape: 'cylinder', Piece: 'arm-l', At: [0.3, 0.5, 0], Size: [0.1, 0.4, 0.1], Mirror: true, Tags: ['limb']}
		]});
		var model = models.Make(name);
		var colors = piece(model, 'body').Geometry.Colors;

		expect(model.Pieces.map(function (one) {
			return one.ID;
		})).toEqual(['body', 'head', 'arm-l', 'arm-r']);
		expect(bounds(piece(model, 'body'))).toEqual([-0.2, 0.2, -0.1, 0.2, 0.8, 0.1]);
		/* A ball of faces: its poles at its height, its sides a little inside its size. */
		expect(bounds(piece(model, 'head'))[1]).toBe(0.8);
		expect(bounds(piece(model, 'head'))[4]).toBe(1);
		expect(bounds(piece(model, 'head'))[3]).toBeGreaterThan(0.09);
		expect(bounds(piece(model, 'head'))[3]).toBeLessThanOrEqual(0.1);
		expect(piece(model, 'head')).toMatchObject({Parent: 'body', Pivot: [0, 0.8, 0], Team: true});
		expect([colors[0], colors[1], colors[2]].map(function (value) {
			return Math.round(value * 1000) / 1000;
		})).toEqual([1, Math.round(128 / 255 * 1000) / 1000, 0]);

		/* The mirror: the same on the other side of X, in the piece of the other side. */
		expect(bounds(piece(model, 'arm-l'))).toEqual([0.25, 0.3, -0.05, 0.35, 0.7, 0.05]);
		expect(bounds(piece(model, 'arm-r'))).toEqual([-0.35, 0.3, -0.05, -0.25, 0.7, 0.05]);

		/* Its rig gives its clips; its tags tell its pieces. */
		expect(model.Clips).toEqual(models.Rigs().Biped);
		expect(models.Tagged(name, 'limb')).toEqual(['arm-l', 'arm-r']);
		expect(models.Tagged(name, 'face')).toEqual(['head']);
		expect(models.Tagged(name, 'none')).toEqual([]);
		expect(function () {
			models.Define('recipe-none', {});
		}).toThrow('Elemenx Models: Define expects (name, {Build}) or (name, {URL})');
	});

	it('varies its variants by their seed, the first as it is told, and leaves out what a variant does not have by its chance', function () {
		var parts = [
			{ID: 'base', Shape: 'box', At: [0, 0.2, 0], Size: [1, 0.4, 1], Vary: {Size: [0.3, 0, 0.3]}},
			{ID: 'flag', Shape: 'box', Piece: 'flag', At: [0, 0.8, 0], Size: [0.1, 0.4, 0.1], Chance: 0.5},
			{ID: 'top', Shape: 'cylinder', Piece: 'top', At: [0, 0.5, 0], Size: [0.4, 0.2, 0.4], Vary: {At: [0, 0.1, 0], Color: 0.3}}
		];
		var name = define('recipe-varied', {Variants: 12, Parts: parts});
		var made = [];
		var i;

		for (i = 0; i < 12; i++)
			made.push(models.Make(name, {Variant: i}));

		/* The first is the parts as they are, with all of them. */
		expect(bounds(piece(made[0], 'body'))).toEqual([-0.5, 0, -0.5, 0.5, 0.4, 0.5]);
		expect(piece(made[0], 'flag')).toBeTruthy();

		/* The others: as wide as their seed says, within the vary; some with no flag, some with it. */
		expect(new Set(made.slice(1).map(function (model) {
			return bounds(piece(model, 'body'))[3];
		})).size).toBeGreaterThan(5);
		expect(made.slice(1).every(function (model) {
			var x = bounds(piece(model, 'body'))[3];

			return x >= 0.35 && x <= 0.65;
		})).toBe(true);
		expect(made.slice(1).some(function (model) {
			return !piece(model, 'flag');
		})).toBe(true);
		expect(made.slice(1).some(function (model) {
			return piece(model, 'flag');
		})).toBe(true);

		/* The same variant of the same name is the same model; a part left out takes nothing of the draws of the others. */
		models.Made = {};

		expect(bounds(piece(models.Make(name, {Variant: 5}), 'top'))).toEqual(bounds(piece(made[5], 'top')));

		define(name, {Variants: 12, Parts: [parts[0], Object.assign({}, parts[1], {Chance: 0}), parts[2]]});

		for (i = 1; i < 12; i++) {
			expect(piece(models.Make(name, {Variant: i}), 'flag')).toBeFalsy();
			expect(bounds(piece(models.Make(name, {Variant: i}), 'top'))).toEqual(bounds(piece(made[i], 'top')));
			expect(Array.from(piece(models.Make(name, {Variant: i}), 'top').Geometry.Colors.slice(0, 3))).toEqual(Array.from(piece(made[i], 'top').Geometry.Colors.slice(0, 3)));
		}

		defined.forEach(function (one) {
			delete models.Recipes[one];
		});
	});

	it('gives a model defined again under its name a Key of its own, so what drew the one before draws it anew', function () {
		var name = 'recipe-again-' + Date.now();
		var first;
		var second;

		models.Define(name, {Parts: [{ID: 'a', Shape: 'box'}]});

		first = models.Make(name);

		expect(first.Key).toBe(name + '~0');
		expect(models.Make(name)).toBe(first);

		models.Define(name, {Parts: [{ID: 'a', Shape: 'box', Size: [2, 1, 1]}]});

		second = models.Make(name);

		expect(second.Key).toBe(name + '~0~1');
		expect(bounds(piece(second, 'body'))[3]).toBe(1);

		models.Define(name, {Parts: [{ID: 'a', Shape: 'box'}]});

		expect(models.Make(name).Key).toBe(name + '~0~2');

		delete models.Recipes[name];
	});

	/* The furniture of streets: each its real height; what glows (a lamp, a signal) of a color over 1. */
	it('has the furniture of streets, each of its real height, its lamps glowing', function () {
		var models = Elemenx.Service('SceneModels');
		var heights = {streetlamp: 4.5, roadlamp: 9, bench: 0.85, bin: 0.9, 'bus-stop': 2.6, roadsign: 2.6, 'traffic-light': 3.6, hydrant: 0.8, bollard: 0.9, planter: 0.7, kiosk: 2.8};

		Object.keys(heights).forEach(function (name) {
			expect(models.Has(name), name).toBe(true);
			expect(models.Info(name).Size).toBe(heights[name]);
		});

		['streetlamp', 'roadlamp', 'traffic-light'].forEach(function (name) {
			var made = models.Make(name);
			var colors = made.Pieces[0].Geometry.Colors;
			var hot = false;
			var i;

			for (i = 0; i < colors.length; i++) {
				if (colors[i] > 1)
					hot = true;
			}

			expect(hot, name).toBe(true);
		});

		/* Its lamps light at night: lights of their own in the units of the model. */
		expect(models.Make('streetlamp').Lamps[0]).toMatchObject({Night: true});
		expect(models.Make('roadlamp').Lamps.length).toBe(2);
		expect(models.Make('bench').Lamps).toEqual([]);
	});

	/*
	 * What is done to a model and its pieces, over its source (its recipe, or a file, as it is): split, grouped, merged,
	 * renamed, hidden, moved, mirrored, copied, its origin moved; pieces taken out into a model of their own, and models put
	 * together into one. Kept for the model, the model made again with them.
	 */
	it('edits a model over its source: splits, groups, merges, hides, moves, mirrors and copies its pieces, takes some out, puts models together', function () {
		var models = Elemenx.Service('SceneModels');
		var name = 'test-edited';
		var list;
		var made;

		function bounds (model, id) {
			var low = [Infinity, Infinity, Infinity];
			var high = [-Infinity, -Infinity, -Infinity];

			model.Pieces.filter(function (piece) {
				return !id || piece.ID === id;
			}).forEach(function (piece) {
				var p = piece.Geometry.Positions;
				var i;

				for (i = 0; i < p.length; i += 3) {
					low = [Math.min(low[0], p[i]), Math.min(low[1], p[i + 1]), Math.min(low[2], p[i + 2])];
					high = [Math.max(high[0], p[i]), Math.max(high[1], p[i + 1]), Math.max(high[2], p[i + 2])];
				}
			});

			return low.concat(high);
		}

		/* One piece of two boxes apart, and a roof. */
		models.Define(name, {Size: 2, Build: function (tools) {
			return [tools.Piece('body', [tools.Box(0.2, 0.2, 0.2, [-0.5, 0.1, 0], [1, 0, 0]), tools.Box(0.2, 0.2, 0.2, [0.5, 0.1, 0], [0, 0, 1])]), tools.Piece('roof', [tools.Box(1.2, 0.1, 0.4, [0, 0.5, 0], [0, 1, 0])])];
		}});
		models.SetEdits(name, []);

		expect(models.PieceList(name).map(function (piece) {
			return piece.ID;
		})).toEqual(['body', 'roof']);

		/* Split as it hangs together: two pieces of it. */
		models.Edit(name, {Op: 'split', Piece: 'body', By: 'connected'});

		list = models.PieceList(name);

		expect(list.map(function (piece) {
			return piece.ID;
		})).toEqual(['body#1', 'body#2', 'roof']);
		expect(list[0].Triangles).toBe(12);

		/* Grouped and renamed; hidden, it is listed but not made. */
		models.Edit(name, {Op: 'group', Pieces: ['body#1', 'body#2'], Name: 'feet'});
		models.Edit(name, {Op: 'rename', Piece: 'roof', Name: 'Top'});
		models.Edit(name, {Op: 'hide', Pieces: ['body#2']});

		list = models.PieceList(name);

		expect(list[0].Group).toBe('feet');
		expect(list[2].Name).toBe('Top');
		expect(list[1].Hidden).toBe(true);
		expect(models.Make(name).Pieces.map(function (piece) {
			return piece.ID;
		})).toEqual(['body#1', 'roof']);

		/* Moved, mirrored, copied. */
		models.Edit(name, {Op: 'hide', Pieces: ['body#2'], Hidden: false});
		models.Edit(name, {Op: 'transform', Pieces: ['roof'], Move: [0, 0.2, 0]});

		made = models.Make(name);

		expect(bounds(made, 'roof')[4]).toBeCloseTo(0.75, 5);

		models.Edit(name, {Op: 'mirror', Pieces: ['body#1'], Axis: 'x'});

		expect(bounds(models.Make(name), 'body#1')[0]).toBeCloseTo(0.4, 5);

		models.Edit(name, {Op: 'duplicate', Piece: 'roof', ID: 'roof2', Move: [0, 0.3, 0]});

		expect(bounds(models.Make(name), 'roof2')[4]).toBeCloseTo(1.05, 5);

		/* Merged into one piece, the origin at its bottom middle. */
		models.Edit(name, {Op: 'merge', Pieces: ['roof', 'roof2'], ID: 'roofs'});
		models.Edit(name, {Op: 'transform', Pieces: ['body#1', 'body#2'], Move: [0, 0.5, 0]});
		models.Edit(name, {Op: 'origin', To: 'bottom'});

		made = models.Make(name);

		expect(made.Pieces.map(function (piece) {
			return piece.ID;
		})).toEqual(['body#1', 'body#2', 'roofs']);
		expect(bounds(made)[1]).toBeCloseTo(0, 5);

		/* Kept for it: the list of what was done, undone by setting it back. */
		expect(models.Edits(name).length).toBe(11);
		expect(models.SetEdits(name, models.Edits(name).slice(0, 1)).length).toBe(1);
		expect(models.Make(name).Pieces.length).toBe(3);

		/* Taken out: a model of its own of those pieces, gone from it. */
		models.Extract(name, ['roof'], 'test-edited-roof');

		expect(models.Make('test-edited-roof').Pieces.map(function (piece) {
			return piece.ID;
		})).toEqual(['roof']);
		expect(models.Make(name).Pieces.map(function (piece) {
			return piece.ID;
		})).toEqual(['body#1', 'body#2']);

		/* Put together: two models in one, each where it is put. */
		models.Combine('test-edited-both', [{Model: name, At: [0, 0, 0]}, {Model: 'test-edited-roof', At: [2, 0, 0]}], {Size: 3});

		made = models.Make('test-edited-both');

		expect(made.Pieces.map(function (piece) {
			return piece.ID;
		})).toEqual(['0:body#1', '0:body#2', '1:roof']);
		expect(made.Pieces[2].Rest[12]).toBe(2);
		expect(models.Info('test-edited-both').Size).toBe(3);

		models.SetEdits(name, []);
		models.SetEdits('test-edited-roof', []);

		[name, 'test-edited-roof', 'test-edited-both'].forEach(function (one) {
			delete models.Recipes[one];
		});
	});
});
