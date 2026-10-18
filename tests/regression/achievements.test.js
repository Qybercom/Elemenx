import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

var source = fs.readFileSync(path.join(import.meta.dirname, '../../libraries/ElemenxUI/services/Achievements.js'), 'utf8');

/* The GameAchievements Service on the timers of the test. */
function create () {
	var definition;
	var instance;

	vm.runInNewContext(source, {
		Elemenx: {
			Service: function (name, value) {
				definition = value;
			}
		},
		window: {
			setTimeout: setTimeout,
			clearTimeout: clearTimeout
		}
	});

	instance = Object.assign({}, definition);

	instance.$OnCreate();

	return instance;
}

beforeEach(function () {
	vi.useFakeTimers();
});

afterEach(function () {
	vi.useRealTimers();
});

describe('ElemenxUI Achievements Service', function () {
	it('shows the achievements one after another, each for its Duration, and reports every change', function () {
		var achievements = create();
		var states = [];
		var first;
		var second;

		achievements.OnChange(function (state) {
			states.push((state.Current ? state.Current.Title : '-') + '/' + state.Queue.length);
		});

		first = achievements.Show({Title: 'First blood', Points: 10});
		second = achievements.Show('Pack hunter');

		expect(first).toBe('achievement-1');
		expect(second).toBe('achievement-2');
		expect(achievements.Current()).toEqual({ID: first, Title: 'First blood', Text: '', Icon: 'trophy', Image: '', Rarity: 'common', Points: 10, Overline: '', Duration: 6000});
		expect(achievements.Queue().map(function (item) {
			return item.Title;
		})).toEqual(['Pack hunter']);

		vi.advanceTimersByTime(5999);

		expect(achievements.Current().ID).toBe(first);

		vi.advanceTimersByTime(1);

		expect(achievements.Current().ID).toBe(second);

		vi.advanceTimersByTime(6000);

		expect(achievements.Current()).toBe(null);
		expect(states).toEqual(['First blood/0', 'First blood/1', 'Pack hunter/0', '-/0']);
	});

	it('keeps an achievement of Duration 0 until it is dismissed, takes one out of the queue, and clears all', function () {
		var achievements = create();
		var kept = achievements.Show({Title: 'Kept', Duration: 0, Image: 'trophy.png', Rarity: 'legendary'});
		var waiting = achievements.Show({Title: 'Waiting'});
		var last = achievements.Show({Title: 'Last'});
		var listener = vi.fn();

		expect(achievements.Current().Icon).toBe('');

		vi.advanceTimersByTime(60000);

		expect(achievements.Current().ID).toBe(kept);

		achievements.Dismiss(waiting);

		expect(achievements.Queue().map(function (item) {
			return item.ID;
		})).toEqual([last]);

		achievements.Dismiss(kept);

		expect(achievements.Current().ID).toBe(last);

		achievements.OnChange(listener);
		achievements.OffChange(listener);
		achievements.Show({Title: 'More'});
		achievements.Clear();

		expect(achievements.Current()).toBe(null);
		expect(achievements.Queue()).toEqual([]);
		expect(listener).not.toHaveBeenCalled();
	});
});
