import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, waitFor } from '../setup.js';

var nodes = [];

function add (element) {
	nodes.push(element);

	document.body.appendChild(element);

	return element;
}

/* An element with an endless animation of its own name, at a place of the page (top in pixels, fixed to the viewport). */
function spinner (name, top) {
	var element = document.createElement('div');

	element.style.cssText = 'position: fixed; left: 0; width: 20px; height: 20px; top: ' + top + 'px; animation: ' + name + ' 500ms linear infinite;';

	return add(element);
}

function state (element) {
	return element.getAnimations({subtree: true})[0].playState;
}

/* Regression: a page of many endless animations took a whole core, as each made the browser paint the page at every frame. */
describe('Regression: the endless animations of Elemenx rest out of the viewport', function () {
	beforeAll(async function () {
		await loadElemenx();

		add(document.createElement('style')).textContent = '@keyframes elemenx-test-turn { to { transform: rotate(1turn); } } @keyframes app-turn { to { transform: rotate(1turn); } }';
	});

	afterEach(function () {
		while (nodes.length > 1) nodes.pop().remove();
	});

	it('an endless elemenx-* animation out of the viewport rests, and runs again when its element comes back', async function () {
		var element = spinner('elemenx-test-turn', 5000);

		expect(await waitFor(function () {
			return state(element) === 'paused';
		})).toBe(true);

		element.style.top = '0px';

		expect(await waitFor(function () {
			return state(element) === 'running';
		})).toBe(true);
	});

	it('an animation on the screen runs, and one of the application keeps running out of the viewport', async function () {
		var shown = spinner('elemenx-test-turn', 0);
		var application = spinner('app-turn', 5000);

		await waitFor(function () {
			return false;
		}, 300);

		expect(state(shown)).toBe('running');
		expect(state(application)).toBe('running');
	});

	it('an animation that starts again on an element out of the viewport (a class put back) rests at once', async function () {
		var element = spinner('elemenx-test-turn', 5000);

		await waitFor(function () {
			return state(element) === 'paused';
		});

		element.style.animationName = 'none';

		element.getBoundingClientRect();

		element.style.animationName = 'elemenx-test-turn';

		expect(await waitFor(function () {
			return element.getAnimations().length && state(element) === 'paused';
		})).toBe(true);
	});
});
