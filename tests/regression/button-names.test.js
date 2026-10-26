import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import buttonSource from '../../libraries/ElemenxUI/components/Button/Button.js?raw';
import buttonTemplate from '../../libraries/ElemenxUI/components/Button/Button.html?raw';

var owned = [];

async function mount (template, state) {
	var definition = {$Template: '<div>' + template + '</div>'};
	var key;
	var component;

	for (key in state || {}) {
		definition[key] = state[key];
	}

	component = Elemenx.Component(unique('ButtonHost'), definition)();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await tick(20);

	return component;
}

describe('Contract: Button names itself for a screen reader apart from its text, and tells what it opens', function () {
	beforeAll(async function () {
		await loadElemenx();

		new Function(buttonSource.replace(/\$StyleURL: '[^']+',\n/, '').replace("$TemplateURL: 'Button.html'", function () {
			return '$Template: ' + JSON.stringify(buttonTemplate);
		}))();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('AriaLabel names it whatever its text; without one its text names it, and an icon button its Title', async function () {
		var host = await mount('<Button Label="M" AriaLabel="Mute the drums" Title="Mute" /><Button Label="Save" /><Button Icon="close" Title="Close" />');
		var buttons = host.$Element().querySelectorAll('button');

		expect([buttons[0].getAttribute('aria-label'), buttons[0].textContent.trim(), buttons[0].getAttribute('title')]).toEqual(['Mute the drums', 'M', 'Mute']);
		expect(buttons[1].getAttribute('aria-label')).toBe(null);
		expect(buttons[2].getAttribute('aria-label')).toBe('Close');
	});

	it('Expanded true or false is its aria-expanded, as it changes; empty, it has none', async function () {
		var host = await mount('<Button Icon="chevron-right" Title="More" [expanded]="Open" /><Button Label="Plain" />', {Open: false});
		var buttons = host.$Element().querySelectorAll('button');

		expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
		expect(buttons[1].hasAttribute('aria-expanded')).toBe(false);

		host.Open = true;

		await tick(20);

		expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
	});
});
