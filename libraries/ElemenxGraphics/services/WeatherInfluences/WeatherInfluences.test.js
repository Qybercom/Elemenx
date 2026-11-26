import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

describe('Contract: WeatherInfluences, what is done to the weather of a planet in a place for a while', function () {
	var influences;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:WeatherInfluences', 'service:Blueprints']);

		influences = Elemenx.Service('WeatherInfluences');
	});

	it('has its kinds of the resource, each of a graph, how long, how wide and how strong', function () {
		var kinds = influences.Kinds();

		expect(Object.keys(kinds).sort()).toEqual(['anti-hail', 'dispersal', 'fog', 'seeding', 'storm-seed']);
		expect(kinds['storm-seed']).toMatchObject({Graph: 'weather/influence/storm-seed', Hours: 6, Radius: 30});
		expect(kinds['storm-seed'].Spawns[0]).toMatchObject({Kind: 'fog', At: 1});
	});

	it('makes an influence of a kind at a way and a time, its own values over those of its kind', function () {
		var one = influences.Make('seeding', [0, 2, 0], 10, {Radius: 12, ID: 'mine'});

		expect(one).toEqual({ID: 'mine', Kind: 'seeding', Direction: [0, 1, 0], Radius: 12, Start: 10, Length: 4 / 24, Strength: 1, Seed: 0});
	});

	it('adds to the forecast of a place within its radius as it lives, nothing past it, and takes away of its kind', function () {
		var storm = influences.Make('storm-seed', [0, 1, 0], 0);
		var gone = influences.Make('dispersal', [0, 1, 0], 0);
		var over = {Cover: 0.3, Rain: 0.1, Kind: 0.2, Cirrus: 0.1, Warm: 0.6};
		var middle = influences.Apply(over, [0, 1, 0], 3 / 24, [storm], null, 6371);
		var far = influences.Apply(over, [Math.sin(0.01), Math.cos(0.01), 0], 3 / 24, [storm], null, 6371);

		expect(middle.Cover).toBeGreaterThan(0.7);
		expect(middle.Rain).toBeGreaterThan(0.6);
		expect(middle.Kind).toBeGreaterThan(0.7);
		expect(middle.Warm).toBe(0.6);
		/* 64 km off: past its 30. */
		expect(far).toEqual(Object.assign({Fog: 0}, over));
		/* Before it began and after it ended: nothing. */
		expect(influences.Apply(over, [0, 1, 0], -1, [storm], null, 6371)).toEqual(Object.assign({Fog: 0}, over));
		expect(influences.Apply(over, [0, 1, 0], 3 / 24, [gone], null, 6371).Cover).toBe(0);
	});

	it('leaves the influences of its kind when it ends, made of it: a fog after a storm', function () {
		var storm = influences.Make('storm-seed', [0, 1, 0], 0, {ID: 'storm'});

		expect(influences.Expand([storm], 3 / 24, null).map(function (one) {
			return one.ID;
		})).toEqual(['storm']);
		expect(influences.Expand([storm], 9 / 24, null)).toEqual([expect.objectContaining({ID: 'storm/0', Kind: 'fog', Start: 6 / 24, Length: 6 / 24, Radius: 36, Strength: 0.6})]);
		expect(influences.Expand([storm], 13 / 24, null)).toEqual([]);
		expect(influences.Apply({Cover: 0.3, Rain: 0, Kind: 0, Cirrus: 0}, [0, 1, 0], 9 / 24, [storm], null, 6371).Fog).toBeGreaterThan(0.3);
	});

	it('drifts with the wind it is given, as long as it lives', function () {
		var one = influences.Make('fog', [0, 1, 0], 0);
		var east = function () {
			return [0.4, 0, 0];
		};

		expect(influences.Center(one, 1, null)).toEqual([0, 1, 0]);
		expect(influences.Center(one, 3 / 24, east)[0]).toBeGreaterThan(0.04);
		/* No farther once it ended (6 hours). */
		expect(influences.Center(one, 5, east)).toEqual(influences.Center(one, 6 / 24, east));
	});
});
