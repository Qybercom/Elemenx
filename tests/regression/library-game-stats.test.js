import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount (template, state) {
	var component = Elemenx.Component(unique('GameStatsHost'), Object.assign({$Template: '<div>' + template + '</div>'}, state))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await tick(20);

	return component;
}

function texts (root, selector) {
	return Array.prototype.map.call(root.querySelectorAll(selector), function (node) {
		return node.textContent.trim();
	});
}

describe('Contract: the values of a game (GameStat, GameStats), a compact Field and a GameHud over a scene', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['GameStat', 'GameStats', 'GameHud', 'Field', 'Input', 'Icon']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('GameStat shows its value, unit and name, stacked by default, inline with the name after the value, of its tone and size', async function () {
		var host = await mount('<GameStat class="one" Label="Lap" Value="2/3" /><GameStat class="two" Label="Gold" Value="1250" Unit="g" Layout="inline" Tone="warning" Size="large" />', {});
		var one = host.$Element().querySelector('.one');
		var two = host.$Element().querySelector('.two');

		expect(one.classList.contains('stacked')).toBe(true);
		expect(one.classList.contains('medium')).toBe(true);
		expect(one.firstElementChild.className).toBe('elemenx-game-stat-label');
		expect(one.querySelector('.elemenx-game-stat-value').textContent).toBe('2/3');
		expect(two.classList.contains('inline')).toBe(true);
		expect(two.classList.contains('warning')).toBe(true);
		expect(two.classList.contains('large')).toBe(true);
		expect(two.querySelector('.elemenx-game-stat-unit').textContent).toBe('g');
		expect(two.lastElementChild.className).toBe('elemenx-game-stat-label');
		expect(getComputedStyle(two).fontVariantNumeric).toBe('tabular-nums');
	});

	it('GameStats draws a GameStat for each item on a panel, follows a change of a value, and keeps what is put in its slot', async function () {
		var host = await mount('<GameStats Label="Race" Size="small" Orientation="vertical" [Items]="Items"><span class="extra">Wrong way</span></GameStats>', {Items: [{ID: 'lap', Label: 'Lap', Value: '1/3'}, {ID: 'time', Label: 'Time', Value: '0:05', Tone: 'accent'}]});
		var stats = host.$Element().querySelector('.elemenx-game-stat-group');

		expect(stats.classList.contains('elemenx-game-panel')).toBe(true);
		expect(stats.classList.contains('vertical')).toBe(true);
		expect(stats.getAttribute('aria-label')).toBe('Race');
		expect(texts(stats, '.elemenx-game-stat-label')).toEqual(['Lap', 'Time']);
		expect(stats.querySelectorAll('.elemenx-game-stat.small').length).toBe(2);
		expect(stats.querySelector('.elemenx-game-stat.accent .elemenx-game-stat-value').textContent).toBe('0:05');
		expect(stats.querySelector('.extra').textContent).toBe('Wrong way');

		host.Items = [{ID: 'lap', Label: 'Lap', Value: '2/3'}, {ID: 'time', Label: 'Time', Value: '0:09', Tone: 'accent'}];

		await tick(20);

		expect(texts(stats, '.elemenx-game-stat-value')).toEqual(['2/3', '0:09']);
	});

	it('Field Size small sets its label narrow, of small type, in line with its control', async function () {
		var host = await mount('<Field class="one" Label="Drops" Horizontal="true" Size="small"><Input /></Field><Field class="two" Label="Drops" Horizontal="true"><Input /></Field>', {});
		var small = host.$Element().querySelector('.one');
		var plain = host.$Element().querySelector('.two');

		expect(small.classList.contains('small')).toBe(true);
		expect(plain.classList.contains('small')).toBe(false);
		expect(getComputedStyle(small.querySelector('.elemenx-field-label')).width).toBe('76px');
		expect(getComputedStyle(plain.querySelector('.elemenx-field-label')).width).not.toBe('76px');
	});

	/* A GameHud in the hud of a Scene took the pointer of the whole canvas: only what lies in its areas takes it now. */
	it('a GameHud in the hud of a scene lets the pointer through to the scene, but its contents take it', async function () {
		var host = await mount('<div class="elemenx-scene-hud" style="position: relative; width: 400px; height: 300px;"><GameHud><GameStats slot="top" [Items]="Items" /></GameHud></div>', {Items: [{ID: 'lap', Label: 'Lap', Value: '1/3'}]});
		var hud = host.$Element().querySelector('.elemenx-game-hud');

		expect(getComputedStyle(hud).pointerEvents).toBe('none');
		expect(getComputedStyle(hud.querySelector('.elemenx-game-hud-scene')).pointerEvents).toBe('none');
		expect(getComputedStyle(hud.querySelector('.elemenx-game-hud-layer')).pointerEvents).toBe('none');
		expect(getComputedStyle(hud.querySelector('.elemenx-game-stat-group')).pointerEvents).toBe('auto');
	});
});
