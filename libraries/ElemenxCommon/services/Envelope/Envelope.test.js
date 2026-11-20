import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

describe('Contract: Envelope, the air, seas and depths of a body as one model, of one source', function () {
	var envelope;
	var blueprints;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Envelope', 'service:Blueprints', 'service:Astronomy']);

		envelope = Elemenx.Service('Envelope');
		blueprints = Elemenx.Service('Blueprints');
	});

	/* The air of the Earth as the standard atmosphere has it; its sky and the top of its air where the scenes had them (100 and 120 km). */
	it('gives the air of the Earth as the standard atmosphere has it, its sky at 100 km and its top at 120 km', function () {
		var earth = envelope.Make('earth', {Radius: 6371, Mass: 1});
		var sea = envelope.At(earth, 0);
		var high = envelope.At(earth, 10.999);
		var deep = envelope.At(earth, -1);

		expect(sea.Pressure).toBeCloseTo(1.01325, 4);
		expect(sea.Temperature).toBeCloseTo(288.15, 3);
		expect(sea.Density).toBeCloseTo(1.225, 2);
		expect(high.Temperature).toBeCloseTo(216.65, 1);
		expect(high.Pressure).toBeGreaterThan(0.21);
		expect(high.Pressure).toBeLessThan(0.24);
		expect(high.Zone).toBe('troposphere');
		expect(envelope.At(earth, 0.001).Light).toBeGreaterThan(0.75);
		expect(earth.Top).toBeCloseTo(120, 0);
		expect(earth.Sky).toBeCloseTo(100, 0);

		/* Its ocean: water a hundred times as heavy each kilometre, dark past a few hundred metres. */
		expect(deep.Phase).toBe('liquid');
		expect(deep.Zone).toBe('ocean');
		expect(deep.Pressure).toBeCloseTo(1.01325 + 1025 * 9.80665 * 1000 / 100000, 1);
		expect(deep.Light).toBeLessThan(1e-6);
		expect(envelope.At(earth, 700)).toMatchObject({Zone: '', Phase: 'space', Pressure: 0, Inside: false});
	});

	/* Dense air: the deep hot air of Venus under its clouds, a few hundredths of its sun; the haze of Titan, a tenth. */
	it('makes the dense air of Venus and the haze of Titan of the same model', function () {
		var venus = envelope.Make('venus', {Radius: 6052, Mass: 0.815});
		var titan = envelope.Make('titan', {Radius: 2575, Mass: 0.0225});
		var ground = envelope.At(venus, 0);

		expect(ground.Pressure).toBeCloseTo(92, 3);
		expect(ground.Temperature).toBeCloseTo(737, 3);
		expect(ground.Light).toBeGreaterThan(0.015);
		expect(ground.Light).toBeLessThan(0.06);
		expect(envelope.At(venus, 60).Phase).toBe('cloud');
		expect(venus.Top).toBeGreaterThan(120);
		expect(envelope.At(titan, 0).Light).toBeGreaterThan(0.07);
		expect(envelope.At(titan, 0).Light).toBeLessThan(0.15);
		expect(titan.Top).toBeGreaterThan(300);
	});

	/*
	 * A giant: 1 bar at its Radius, its decks of cloud under it, dark past a hundred kilometres, its heat glowing dark red a
	 * thousand down, white deep in its metallic hydrogen, its core solid at 0.15 of its radius.
	 */
	it('goes down through a giant: its decks, the dark, the glow of its heat growing white, its solid core', function () {
		var jupiter = envelope.Make('jupiter', {Radius: 69911, Mass: 317.8});
		var top = envelope.At(jupiter, 0);
		var water = envelope.At(jupiter, -60);
		var dark = envelope.At(jupiter, -300);
		var red = envelope.At(jupiter, -1000);
		var white = envelope.At(jupiter, -40000);
		var core = envelope.At(jupiter, -0.9 * 69911);

		expect(top.Pressure).toBeCloseTo(1, 4);
		expect(top.Temperature).toBeCloseTo(165, 3);
		expect(water.Zone).toBe('clouds of water');
		expect(water.Pressure).toBeGreaterThan(4);
		expect(dark.Light).toBeLessThan(0.001);
		expect(red.Temperature).toBeGreaterThan(2000);
		expect(red.Glow[0]).toBeGreaterThan(red.Glow[2]);
		expect(white.Zone).toBe('metallic hydrogen');
		expect(white.Glow[2] / white.Glow[0]).toBeGreaterThan(0.8);
		expect(white.Pressure).toBeGreaterThan(1e6);
		expect(core).toMatchObject({Zone: 'core', Phase: 'solid', Solid: true, Inside: true});
		expect(jupiter.Floor).toBeCloseTo(-0.85 * 69911, 3);
	});

	/* No air: the Moon has none (its top 0); Europa a shell of ice over an ocean, solid at its surface. */
	it('gives none to a body of no air, and the ocean under the ice of Europa', function () {
		var moon = envelope.Make('none', {Radius: 1737, Mass: 0.0123});
		var europa = envelope.Make('europa', {Radius: 1561, Mass: 0.008});

		expect(moon.Top).toBe(0);
		expect(envelope.At(moon, 0)).toMatchObject({Phase: 'space', Pressure: 0, Inside: false});
		expect(envelope.At(europa, -5)).toMatchObject({Zone: 'shell of ice', Phase: 'solid', Solid: true});
		expect(envelope.At(europa, -50)).toMatchObject({Zone: 'ocean under the ice', Phase: 'liquid', Solid: false});
		expect(envelope.Presets().Types.gas).toBe('jupiter');
		expect(envelope.Make({Preset: 'earth', Pressure: 2}, {Radius: 6371, Mass: 1}).Pressure).toBe(2);
	});

	/*
	 * Its weather of its air and its turning: decks of clouds where a vapour first saturates going up (the Earth: water at
	 * a kilometre or two; Jupiter: ammonia over ammonium hydrosulphide over water, at a few tenths, about two and about
	 * five to seven bar; Titan: methane), the cells of its winds (3 of the Earth, many of Jupiter, 1 of Venus), how much
	 * warmer and how much less its places differ than the Earth's.
	 */
	it('makes the decks of clouds where a vapour saturates, the cells of the winds of how it turns, its warmth and contrast', function () {
		var earth = envelope.Make('earth', {Radius: 6371, Mass: 1, Day: 23.93});
		var jupiter = envelope.Make('jupiter', {Radius: 69911, Mass: 317.8, Day: 9.93});
		var venus = envelope.Make('venus', {Radius: 6052, Mass: 0.815, Day: -5832.5});
		var titan = envelope.Make('titan', {Radius: 2575, Mass: 0.0225, Day: 382.7});
		var decks = jupiter.Decks.map(function (deck) {
			return deck.Name;
		});
		var pressure = function (made, deck) {
			return envelope.At(made, (deck.Base + deck.Top) / 2).Pressure;
		};

		expect(earth.Decks.length).toBe(1);
		expect(earth.Decks[0].Base).toBeGreaterThan(1);
		expect(earth.Decks[0].Base).toBeLessThan(3);
		expect(decks).toEqual(['clouds of ammonia', 'clouds of ammonium hydrosulphide', 'clouds of water']);
		expect(pressure(jupiter, jupiter.Decks[0])).toBeLessThan(0.7);
		expect(pressure(jupiter, jupiter.Decks[1])).toBeGreaterThan(1.3);
		expect(pressure(jupiter, jupiter.Decks[1])).toBeLessThan(2.3);
		expect(envelope.At(jupiter, jupiter.Decks[2].Base).Pressure).toBeGreaterThan(5);
		expect(envelope.At(jupiter, jupiter.Decks[2].Base).Pressure).toBeLessThan(9);
		expect(envelope.At(jupiter, (jupiter.Decks[2].Base + jupiter.Decks[2].Top) / 2)).toMatchObject({Zone: 'clouds of water', Phase: 'cloud'});
		expect(envelope.At(venus, 60)).toMatchObject({Zone: 'clouds of sulphuric acid', Phase: 'cloud'});
		expect(titan.Decks[0].Name).toBe('clouds of methane');
		expect(titan.Decks[0].Base).toBeGreaterThan(15);
		expect(titan.Decks[0].Base).toBeLessThan(45);
		expect([earth.Cells, venus.Cells, titan.Cells]).toEqual([3, 1, 1]);
		expect(jupiter.Cells).toBeGreaterThan(6);
		expect([earth.Warm, earth.Contrast, earth.Lapse]).toEqual([0, 1, 6.5]);
		expect(venus.Warm).toBeCloseTo(448.85, 6);
		expect(venus.Contrast).toBeLessThan(0.12);
		expect(envelope.Make('mars', {Radius: 3390, Mass: 0.107, Day: 24.6}).Contrast).toBe(2);
	});

	/*
	 * A vapour condenses only colder than its critical point. Regression: the methane of Neptune "condensed" some 3700 km deep
	 * (the line of its saturation read in a fluid past its critical point), not at 1 to 2 bar as it does.
	 */
	it('condenses a vapour only colder than its critical point: the methane of the ice giants near their tops', function () {
		var neptune = envelope.Make('neptune', {Radius: 24622, Mass: 17.15, Day: 16.1});
		var uranus = envelope.Make('uranus', {Radius: 25362, Mass: 14.5, Day: -17.2});

		[neptune, uranus].forEach(function (made) {
			var methane = made.Decks.filter(function (deck) {
				return deck.Name === 'clouds of methane';
			})[0];

			expect(envelope.At(made, methane.Base).Pressure).toBeGreaterThan(0.8);
			expect(envelope.At(made, methane.Base).Pressure).toBeLessThan(3);
			expect(envelope.At(made, methane.Base).Temperature).toBeLessThan(190.6);
		});

		expect(envelope.Presets().Condensables.methane.Critical).toBe(190.6);
	});

	/* Its blocks of Blueprints: a graph of numbers of them gives what its Kernel gives, in js and in the interpreter alike. */
	it('makes a graph of numbers of its blocks give what its Kernel gives', function () {
		var earth = envelope.Make('earth', {Radius: 6371, Mass: 1});
		var graph = {version: 1, type: 'generator', name: 'Envelope', parameters: [], blocks: [
			{id: 'zones', type: 'Input', x: 0, y: 0, properties: [{key: 'Name', value: 'Zones'}]},
			{id: 'height', type: 'Input', x: 0, y: 100, properties: [{key: 'Name', value: 'Height'}]},
			{id: 'state', type: 'EnvelopeState', x: 200, y: 0, properties: []},
			{id: 'light', type: 'EnvelopeLight', x: 200, y: 100, properties: []},
			{id: 'pressure', type: 'Result', x: 400, y: 0, properties: [{key: 'Key', value: 'Pressure'}]},
			{id: 'shine', type: 'Result', x: 400, y: 100, properties: [{key: 'Key', value: 'Light'}]}
		], links: [
			{id: 'l0', p1: 'zones-out-Value', p2: 'state-in-Zones', kind: 'value'},
			{id: 'l1', p1: 'height-out-Value', p2: 'state-in-Height', kind: 'value'},
			{id: 'l2', p1: 'zones-out-Value', p2: 'light-in-Zones', kind: 'value'},
			{id: 'l3', p1: 'height-out-Value', p2: 'light-in-Height', kind: 'value'},
			{id: 'l4', p1: 'state-out-Pressure', p2: 'pressure-in-Value', kind: 'value'},
			{id: 'l5', p1: 'light-out-Light', p2: 'shine-in-Value', kind: 'value'}
		]};
		var code = blueprints.NumericCode(graph, {}, {Zones: 'floats'}, ['Pressure', 'Light']);
		var main = new Function('B', 'M', 'N', code.Source)().Main;
		var order = code.Numeric.Inputs.map(function (one) {
			return one.Name;
		});

		[0, 5, 11, 40, -0.5].forEach(function (height) {
			var made = main.apply(null, order.map(function (name) {
				return name === 'Zones' ? earth.Zones : height;
			}));
			var at = envelope.At(earth, height);

			expect(made[0]).toBeCloseTo(at.Pressure, 9);
			expect(made[1]).toBeCloseTo(at.Light, 9);
		});
	});

	/* What kind of world the ground of a body is, of its air there: the first rule of the library that holds. */
	it('tells what kind of world the ground of a body is, of its air there', function () {
		var bodies = {earth: [{Radius: 6371, Mass: 1, Day: 23.93}, 'terran'], venus: [{Radius: 6052, Mass: 0.815}, 'desert'], titan: [{Radius: 2575, Mass: 0.0225}, 'ice'], mars: [{Radius: 3390, Mass: 0.107}, 'desert'], europa: [{Radius: 1561, Mass: 0.008}, 'ice'], none: [{Radius: 1737, Mass: 0.0123}, 'moon'], jupiter: [{Radius: 69911, Mass: 317.8}, 'gas']};

		expect(Object.keys(bodies).map(function (name) {
			return envelope.Habitat(envelope.Make(name, bodies[name][0]), bodies[name][1]);
		})).toEqual(['living', 'scorched', 'hydrocarbon', 'dust', 'frozen', 'barren', 'giant']);
		expect(envelope.Make('titan', bodies.titan[0]).Condensables).toEqual(['methane']);
	});
});
