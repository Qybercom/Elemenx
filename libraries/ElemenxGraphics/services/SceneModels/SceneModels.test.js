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
});
