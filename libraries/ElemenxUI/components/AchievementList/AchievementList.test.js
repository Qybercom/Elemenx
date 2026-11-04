import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

/* AchievementList: the showcase of the achievements of the Achievements Service, following it as it changes. */
describe('Contract: AchievementList, the showcase of the achievements', function () {
	var achievements;

	beforeAll(async function () {
		await loadElemenx();

		Use(['AchievementList']);

		achievements = Elemenx.Service('Achievements');

		achievements.Define([
			{ID: 'list-walk', Title: 'Walker', Text: 'Walk ten miles', Group: 'Travel', Goal: 10, Points: 10, Rarity: 'rare'},
			{ID: 'list-cave', Title: 'The cave', Group: 'Travel', Secret: true, Points: 20},
			{ID: 'list-egg', Title: 'Easter egg', Hidden: true, Points: 50},
			{ID: 'list-talk', Title: 'Talker', Group: 'People'}
		]);
	});

	beforeEach(function () {
		resetDOM();

		achievements.Reset();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	function mount (attributes) {
		var component = Elemenx.Component(unique('ListHost'), {$Template: '<div><AchievementList ' + (attributes || '') + ' /></div>'})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		return component.$Element();
	}

	function cards (element) {
		return Array.from(element.querySelectorAll('.elemenx-achievement-card')).filter(function (card) {
			return /^list-/.test(card.getAttribute('data-id'));
		});
	}

	it('shows a card for each, locked and secret ones as they are, and follows unlocks and progress', async function () {
		var element = mount();

		await waitFor(function () {
			return cards(element).length === 3;
		}, 2000);

		var walk = cards(element)[0];

		expect(walk.classList.contains('locked')).toBe(true);
		expect(walk.classList.contains('rare')).toBe(true);
		expect(cards(element)[1].querySelector('.elemenx-achievement-card-title').textContent).toBe('Secret achievement');
		expect(walk.querySelector('.elemenx-achievement-card-value').textContent).toBe('0 / 10');

		achievements.Progress('list-walk', 4);

		await waitFor(function () {
			return walk.querySelector('.elemenx-achievement-card-progress > span').style.width === '40%';
		}, 2000);

		achievements.Unlock('list-cave');
		achievements.Unlock('list-egg');

		await waitFor(function () {
			return cards(element).length === 4;
		}, 2000);

		expect(cards(element)[1].classList.contains('unlocked')).toBe(true);
		expect(cards(element)[1].querySelector('.elemenx-achievement-card-title').textContent).toBe('The cave');
		expect(element.querySelector('.elemenx-achievement-list-summary span').textContent).toContain(String(achievements.Points()));
	});

	it('shows one group, the unlocked or the locked ones, and no summary when told', async function () {
		achievements.Unlock('list-talk');

		var travel = mount('Group="Travel" Summary="false"');
		var done = mount('Filter="unlocked"');

		await waitFor(function () {
			return cards(travel).length === 2 && cards(done).length === 1;
		}, 2000);

		expect(travel.querySelector('.elemenx-achievement-list-summary')).toBeNull();
		expect(cards(done)[0].getAttribute('data-id')).toBe('list-talk');
	});
});
