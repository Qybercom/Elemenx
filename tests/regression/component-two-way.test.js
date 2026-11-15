import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount (template, state) {
	var component = Elemenx.Component(unique('TwoWayHost'), Object.assign({$Template: '<div>' + template + '</div>'}, state))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await tick(20);

	return component;
}

/* What is typed into the field of the page of an Input: as a person types it. */
function type (field, text) {
	field.value = text;

	field.dispatchEvent(new Event('input', {bubbles: true}));
}

describe('Contract: [(Prop)] on the tag of a Component, and the events sent to the root of its instance', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Input', 'Checkbox', 'Slider', 'Button']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('gives a prop its value and takes back what the Component tells at the event its $Model names', async function () {
		var host = await mount('<Input [(Value)]="Text" />', {Text: 'first'});
		var field = host.$Element().querySelector('.elemenx-input input');

		expect(field.value).toBe('first');

		/* Input names input for Value: each letter, not only when the field is left. */
		type(field, 'second');

		expect(host.Text).toBe('second');

		host.Text = 'third';

		await tick();

		expect(field.value).toBe('third');
	});

	it('finds the prop in any case, as the parser of a template leaves it, and takes back at change by default', async function () {
		var host = await mount('<Checkbox [(checked)]="On" Label="On" />', {On: false});
		var box = host.$Element().querySelector('.elemenx-check input');

		expect(box.checked).toBe(false);

		box.click();

		expect(host.On).toBe(true);

		host.On = false;

		await tick();

		expect(box.checked).toBe(false);
	});

	it('takes back into a path of the state, and keeps an (event) of the same tag as it was', async function () {
		var told = [];
		var host = await mount('<Slider [(Value)]="Car.Speed" [Min]="0" [Max]="200" (input)="Heard" />', {Car: {Speed: 40}, Heard: function (value) {
			told.push(value);
		}});
		var slider = Elemenx.Instance(host.$Element().querySelector('.elemenx-slider'));

		slider.Set(0, 120, true);

		expect(host.Car.Speed).toBe(120);
		expect(told).toEqual([120]);
	});

	it('tells a prop the Component has not and an expression nothing can be given to', async function () {
		var name = unique('TwoWayWrong');
		var made = Elemenx.Component(name, {$Template: '<div><Input [(Nothing)]="Text" /></div>', Text: ''});
		var other = Elemenx.Component(unique('TwoWayWrongExpression'), {$Template: '<div><Input [(Value)]="Text + 1" /></div>', Text: ''});

		expect(function () {
			owned.push(made());
		}).toThrow('Elemenx invalid two-way binding target: [(nothing)]');
		expect(function () {
			owned.push(other());
		}).toThrow('Elemenx invalid two-way binding expression');
	});

	/*
	 * Regression: a directive on the tag of a Component sends its event to the root of the instance (*copy its copied),
	 * and (copied) of the tag heard only what the Component told: the handler was never called.
	 */
	it('hears an event sent to the root of the instance by a script, and not twice what the Component tells itself', async function () {
		var heard = [];
		var clicks = 0;
		var host = await mount('<Button Label="Copy" (copied)="Copied" (click)="Clicked" />', {Copied: function (event, node) {
			heard.push([event.detail.Text, node.classList.contains('elemenx-button')]);
		}, Clicked: function () {
			clicks++;
		}});
		var root = host.$Element().querySelector('.elemenx-button');

		root.dispatchEvent(new CustomEvent('copied', {detail: {Text: 'invite'}}));

		/* From inside it: not the root's. */
		root.querySelector('.elemenx-button-label').dispatchEvent(new CustomEvent('copied', {bubbles: true, detail: {Text: 'inner'}}));

		/* A press on the root: the click the Button tells, once. */
		root.click();

		/* Heard once it is sent. */
		await tick();

		expect(heard).toEqual([['invite', true]]);
		expect(clicks).toBe(1);
	});

	/*
	 * Regression: a Component that tells again what a directive of its own root sends (InfiniteList: *infinite sends more
	 * there, and it tells more) was heard twice, the second time with the event of the page.
	 */
	it('hears once what a Component tells again of an event of its own root', async function () {
		var told = [];
		var inner = unique('Retell');
		var host;

		Elemenx.Component(inner, {$Template: '<div class="retell" (ping)="Pinged"></div>', Pinged: function (event) {
			this.$Emit('ping', {From: event.detail.From});
		}});

		host = await mount('<' + inner + ' (ping)="Heard" />', {Heard: function (data) {
			told.push(data && data.From);
		}});

		host.$Element().querySelector('.retell').dispatchEvent(new CustomEvent('ping', {detail: {From: 'directive'}}));

		await tick();

		expect(told).toEqual(['directive']);
	});
});
