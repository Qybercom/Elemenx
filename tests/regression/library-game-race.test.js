import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/*
 * GameRace: a race on a closed road of a Scene, declared inside it. A racer here is a unit carried along the road by hand,
 * so each lap, checkpoint and position comes when the test says.
 */
describe('Contract: GameRace, laps, checkpoints, times and positions of a race on a road of a Scene', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'GameRace']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	async function mount (race) {
		var ready = null;
		var told = [];
		var component = Elemenx.Component(unique('RaceHost'), {
			$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="400" Height="1" Water="0" Seed="race" />' + race + '</Scene></div>',
			Ready: function (space) {
				ready = space;
			},
			Told: function (name) {
				return function (event) {
					told.push([name, event]);
				};
			}
		})();
		var now = performance.now() + 1000;

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 6000);

		ready.Add('road', {ID: 'ring', Type: 'kart', Closed: true, Points: [[-60, -40], [60, -40], [60, 40], [-60, 40]]});

		var race = await waitFor(function () {
			var element = ready.$Element().querySelector('.elemenx-game-race');

			return element && Elemenx.Instance(element);
		}, 4000);

		['countdown', 'start', 'checkpoint', 'lap', 'position', 'wrong', 'finish', 'end'].forEach(function (name) {
			race.$On(name, function (event) {
				told.push([name, event]);
			});
		});

		return {
			Scene: ready,
			Race: race,
			Told: told,
			Frames: function (count, step) {
				var i;

				for (i = 0; i < (count || 1); i++) {
					ready.Scene().Rest = 0;

					ready.Engine().Frame(now += step || 100);
				}
			},
			/* Each racer to metres along the road, one frame. */
			Put: function (places) {
				var road = ready.Roads()[0];
				var length = road.Points[road.Points.length - 1].Along;

				Object.keys(places).forEach(function (id) {
					var at = Elemenx.Service('SceneRoads').At(road, ((places[id] % length) + length) % length);

					ready.Change(id, {X: at.X, Y: at.Z});
				});

				ready.Scene().Rest = 0;

				ready.Engine().Frame(now += 100);
			},
			Names: function () {
				return told.map(function (one) {
					return one[0];
				});
			}
		};
	}

	it('counts down, counts the laps of each racer through its checkpoints, their times and best, finishes and ends', async function () {
		var mounted = await mount('<GameRace Racers="a, b" Laps="2" Checkpoints="3" Countdown="1" />');
		var scene = mounted.Scene;
		var road;
		var length;
		var at;

		scene.Add('unit', {ID: 'a', X: -58, Y: -40});
		scene.Add('unit', {ID: 'b', X: -56, Y: -40});

		mounted.Frames(14);

		road = scene.Roads()[0];
		length = road.Points[road.Points.length - 1].Along;

		expect(mounted.Names().slice(0, 2)).toEqual(['countdown', 'start']);
		expect(mounted.Told[0][1]).toEqual({Seconds: 1});

		/* a goes round twice, b slower; a passes b on the way. */
		for (at = 0; at <= length * 2 + 20; at += 8)
			mounted.Put({a: at + 2, b: at * 0.6 + 4});

		var laps = mounted.Told.filter(function (one) {
			return one[0] === 'lap' && one[1].ID === 'a';
		});
		var checks = mounted.Told.filter(function (one) {
			return one[0] === 'checkpoint' && one[1].ID === 'a';
		});
		var finish = mounted.Told.filter(function (one) {
			return one[0] === 'finish';
		});

		expect(laps.map(function (one) {
			return one[1].Lap;
		})).toEqual([1, 2]);
		expect(laps[0][1].Time).toBeGreaterThan(0);
		expect(laps[1][1].Best).toBeLessThanOrEqual(laps[0][1].Time);
		expect(checks.length).toBe(6);
		expect(finish).toEqual([['finish', expect.objectContaining({ID: 'a', Position: 1})]]);
		expect(mounted.Names()).toContain('position');

		var standings = mounted.Race.Standings();

		expect(standings.map(function (one) {
			return one.ID;
		})).toEqual(['a', 'b']);
		expect(standings[0]).toMatchObject({Position: 1, Lap: 2, Finished: true, LapTime: 0});
		expect(standings[1].Finished).toBe(false);
		/* The seconds of the lap under way: of the race, less those of the laps done. */
		expect(standings[1].LapTime).toBeGreaterThan(0);
		expect(standings[1].LapTime).toBeLessThan(standings[1].Time);

		/* b goes on to its end: the race ends. */
		for (at = length * 1.25; at <= length * 2 + 20; at += 8)
			mounted.Put({b: at});

		expect(mounted.Names()).toContain('end');
		expect(mounted.Race.Standings()[1]).toMatchObject({ID: 'b', Position: 2, Finished: true});
	});

	it('counts no lap of a racer that goes back over the line, and tells the wrong way and the right way again', async function () {
		var mounted = await mount('<GameRace Racers="a" Laps="1" Countdown="0" />');
		var scene = mounted.Scene;
		var at;

		scene.Add('unit', {ID: 'a', X: -58, Y: -40});

		mounted.Frames(3);

		/* Back over the start line and on back for 40 metres: no lap, the wrong way. */
		for (at = 0; at >= -40; at -= 4)
			mounted.Put({a: at});

		expect(mounted.Names()).not.toContain('lap');
		expect(mounted.Told.filter(function (one) {
			return one[0] === 'wrong';
		})[0][1]).toEqual({ID: 'a', Wrong: true});

		/* Forward again: the right way, and still no lap at the line. */
		for (at = -40; at <= 10; at += 4)
			mounted.Put({a: at});

		expect(mounted.Told.filter(function (one) {
			return one[0] === 'wrong';
		}).map(function (one) {
			return one[1].Wrong;
		})).toEqual([true, false]);
		expect(mounted.Names()).not.toContain('lap');
	});
});
