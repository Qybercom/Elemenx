import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';

/* The prompt of the browser to install the page, as Chrome gives it: an event with prompt() and the choice to come. */
function offer (outcome) {
	var event = new Event('beforeinstallprompt', {cancelable: true});

	event.Shown = 0;
	event.prompt = function () {
		event.Shown++;
	};
	event.userChoice = Promise.resolve({outcome: outcome, platform: 'web'});

	window.dispatchEvent(event);

	return event;
}

describe('Contract: Elemenx.Install, the page as an application of the system', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	it('keeps the prompt of the browser, shows it when the Application asks, and tells its outcome', async function () {
		var states = [];
		var listener = function (state) {
			states.push(state.Available);
		};
		var event;
		var result;

		expect(Elemenx.Install.Available()).toBe(false);
		expect(Elemenx.Install.State()).toEqual({Available: false, Installed: false, Manual: false});

		expect(Elemenx.Install.OnChange(listener)).toBe(Elemenx.Install);

		event = offer('dismissed');

		/* The browser does not show it on its own: the page decides when. */
		expect(event.defaultPrevented).toBe(true);
		expect(Elemenx.Install.Available()).toBe(true);

		result = await new Promise(function (resolve) {
			Elemenx.Install.Prompt(function (error, value) {
				resolve([error, value]);
			});
		});

		expect(event.Shown).toBe(1);
		expect(result).toEqual([null, {Outcome: 'dismissed'}]);
		expect(Elemenx.Install.Available()).toBe(false);
		expect(Elemenx.Install.Installed()).toBe(false);

		/* A prompt shows once. */
		result = await new Promise(function (resolve) {
			Elemenx.Install.Prompt(resolve);
		});

		expect(result.message).toBe('Elemenx.Install has no prompt of the browser: the page is installed, not installable here, or not yet');

		/* Another one, accepted: the page is installed. */
		offer('accepted');

		result = await new Promise(function (resolve) {
			Elemenx.Install.Prompt(function (error, value) {
				resolve(value);
			});
		});

		expect(result).toEqual({Outcome: 'accepted'});
		expect(Elemenx.Install.Installed()).toBe(true);
		expect(states).toEqual([true, false, false, true, false, false]);

		expect(Elemenx.Install.OffChange(listener)).toBe(Elemenx.Install);

		window.dispatchEvent(new Event('appinstalled'));

		expect(states.length).toBe(6);
	});
});
