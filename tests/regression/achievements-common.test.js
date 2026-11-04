import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

/*
 * Achievements of ElemenxCommon: what they are, how far each came, which are unlocked, as data and events; the
 * AchievementQueue of ElemenxUI shows each one unlocked by itself.
 */
describe('Contract: Achievements, the achievements of an Application as data, and the AchievementQueue that shows them', function () {
	var achievements;
	var told;
	var heard = [];

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Achievements', 'service:AchievementQueue']);
	});

	beforeEach(function () {
		achievements = Elemenx.Service('Achievements');

		achievements.Reset();

		told = [];

		['progress', 'unlock', 'reset', 'change'].forEach(function (name) {
			heard.push([name, achievements.On(name, function (event) {
				told.push([name, event.ID]);
			})]);
		});

		achievements.Define([
			{ID: 'first', Title: 'First steps', Text: 'Walk a mile', Group: 'Travel', Goal: 1609, Points: 10, Rarity: 'uncommon'},
			{ID: 'secret', Title: 'The cave', Text: 'Find the cave', Group: 'Travel', Secret: true, Points: 20},
			{ID: 'hidden', Title: 'Easter egg', Hidden: true, Points: 50},
			{ID: 'talk', Title: 'Talker', Group: 'People', Image: 'talk.png'}
		]);

		told = [];
	});

	afterEach(function () {
		while (heard.length) {
			var one = heard.pop();

			achievements.Off(one[0], one[1]);
		}
	});

	it('counts progress to the goal, unlocks once at it, and tells each step', function () {
		var state = achievements.Progress('first', 600);

		expect(state).toEqual({ID: 'first', Value: 600, Goal: 1609, Part: 600 / 1609, Unlocked: false, At: 0});

		achievements.Progress('first', 2000);

		expect(achievements.State('first')).toMatchObject({Value: 1609, Part: 1, Unlocked: true});
		expect(achievements.State('first').At).toBeGreaterThan(0);
		expect(told).toEqual([['progress', 'first'], ['change', 'first'], ['progress', 'first'], ['unlock', 'first'], ['change', 'first']]);

		/* Unlocked, it moves no more and tells nothing. */
		told = [];

		achievements.Progress('first');
		achievements.Unlock('first');

		expect(told).toEqual([]);
		expect(achievements.Unlock('talk').Unlocked).toBe(true);
		expect(achievements.Set('secret', 0).Value).toBe(0);
		expect(achievements.State('nothing')).toBeNull();

		expect(function () {
			achievements.Progress('nothing');
		}).toThrow('Elemenx Achievements: no achievement nothing');
		expect(function () {
			achievements.Define({Title: 'No ID'});
		}).toThrow('Elemenx Achievements: an achievement needs its ID');
	});

	it('lists them with their states: a hidden one only once unlocked, a secret one kept back until then; groups, points and counts', function () {
		var list = achievements.List();

		expect(list.map(function (one) {
			return one.ID;
		})).toEqual(['first', 'secret', 'talk']);
		expect(list[1]).toMatchObject({ID: 'secret', Title: '', Text: '', Secret: true, Points: 20});
		expect(list[2]).toMatchObject({Icon: '', Image: 'talk.png', Rarity: 'common', Goal: 1});
		expect(achievements.Groups()).toEqual(['Travel', 'People']);
		expect(achievements.List({Group: 'People'}).length).toBe(1);

		achievements.Unlock('secret');
		achievements.Unlock('hidden');

		expect(achievements.List({Unlocked: true}).map(function (one) {
			return [one.ID, one.Title];
		})).toEqual([['secret', 'The cave'], ['hidden', 'Easter egg']]);
		expect(achievements.List({Unlocked: false}).length).toBe(2);
		expect(achievements.Points()).toBe(70);
		expect(achievements.Count()).toEqual({Unlocked: 2, Total: 4});
	});

	it('exports its states for the Application to keep, imports them back without unlock events, and resets', function () {
		achievements.Progress('first', 100);
		achievements.Unlock('talk');

		var record = JSON.parse(JSON.stringify(achievements.Export()));

		expect(record).toEqual({Version: 1, States: {first: {Value: 100, At: 0}, talk: {Value: 1, At: achievements.State('talk').At}}});

		achievements.Reset();

		expect(achievements.Count().Unlocked).toBe(0);
		expect(achievements.State('first').Value).toBe(0);

		told = [];

		achievements.Import(record);

		expect(told).toEqual([['change', '']]);
		expect(achievements.State('first').Value).toBe(100);
		expect(achievements.State('talk').Unlocked).toBe(true);

		/* A state of an achievement not yet defined waits for it. */
		achievements.Import({Version: 1, States: {later: {Value: 3, At: 0}}});
		achievements.Define({ID: 'later', Goal: 5});

		expect(achievements.State('later').Value).toBe(3);

		achievements.Reset('later');

		expect(achievements.State('later').Value).toBe(0);
	});

	it('shows in the AchievementQueue each achievement unlocked, unless told not to follow', function () {
		var queue = Elemenx.Service('AchievementQueue');

		queue.Clear();

		achievements.Unlock('first');

		var shown = queue.Current() || queue.Queue()[0];

		expect(shown).toMatchObject({Title: 'First steps', Rarity: 'uncommon', Points: 10, Achievement: 'first'});

		queue.Follow = false;

		queue.Clear();

		achievements.Unlock('talk');

		expect(queue.Current()).toBeNull();

		queue.Follow = true;
	});
});
