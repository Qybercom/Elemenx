import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('PadHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function frame () {
	return new Promise(function (resolve) {
		requestAnimationFrame(function () {
			requestAnimationFrame(resolve);
		});
	});
}

function pointer (target, type, x, y, id) {
	target.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, composed: true, pointerId: id || 1, pointerType: 'touch', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y}));
}

/* The lean of a device: the turn of the screen as a wheel (degrees, right +) and of its top back from upright. */
function lean (wheel, back) {
	var w = wheel * Math.PI / 180;
	var b = back * Math.PI / 180;
	var up = [-Math.sin(w) * Math.cos(b), Math.cos(w) * Math.cos(b), Math.sin(b)];
	var beta = Math.asin(up[1]);
	var gamma = Math.atan2(-up[0], up[2]);

	/* The spec: up = (-cos β sin γ, sin β, cos β cos γ); β past 90 when the top leans back from upright. */
	if (up[2] < 0) {
		beta = Math.PI - beta;
		gamma = Math.atan2(up[0], -up[2]);
	}

	window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {alpha: 0, beta: beta * 180 / Math.PI, gamma: gamma * 180 / Math.PI}));
}

describe('Contract: pads of the page, the motion of a device, VirtualGamepad', function () {
	var gamepad;
	var motion;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Gamepad', 'service:Motion', 'VirtualGamepad']);

		gamepad = Elemenx.Service('Gamepad');
		motion = Elemenx.Service('Motion');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('Gamepad: a pad of the page is a pad as any other: its events, its sticks and triggers, its buttons held; quiet by choice', async function () {
		var events = [];
		var listen = gamepad.On('button', function (detail) {
			events.push(detail.Button + ':' + detail.Pad.Kind);
		});
		var connected = [];
		var connect = gamepad.On('connect', function (detail) {
			connected.push(detail.Pad.Kind);
		});
		var field = document.createElement('button');
		var keys = [];
		var quiet;
		var loud;

		field.addEventListener('keydown', function (event) {
			keys.push(event.key);
		});

		document.getElementById('mount').appendChild(field);

		field.focus();

		quiet = gamepad.Virtual('quiet', {Navigate: false});

		expect(connected).toEqual(['virtual']);
		expect(gamepad.Pads().some(function (pad) {
			return pad.Kind === 'virtual';
		})).toBe(true);

		quiet.Stick('left', 0.6, -0.05);
		quiet.Trigger('right', 0.4);
		quiet.Press('a');

		/* A small lean is none; the triggers as far as they are pressed. */
		expect(gamepad.Axes()).toEqual({LeftX: 0.6, LeftY: 0, RightX: 0, RightY: 0, LeftTrigger: 0, RightTrigger: 0.4});
		expect(gamepad.Held('a')).toBe(true);
		expect(gamepad.Held('right')).toBe(true);

		await frame();

		expect(events).toContain('a:virtual');
		expect(keys).toEqual([]);

		quiet.Release('a');

		expect(gamepad.Held('a')).toBe(false);

		quiet.Destroy();

		expect(gamepad.Axes().LeftX).toBe(0);

		/* A frame with A up: the next press is a press (a pad reported twice presses once). */
		await frame();

		/* One that leads the page as a real one: A is Enter on the focused control. */
		loud = gamepad.Virtual('loud');

		loud.Press('a');

		await frame();

		expect(keys).toContain('Enter');

		loud.Destroy();

		gamepad.Off(listen);
		gamepad.Off(connect);
	});

	it('Motion: the lean of a device as a wheel, its top away, and flat; the way the screen is turned; its middle', function () {
		var turned = motion.Turned;
		var tilt;

		expect(motion.Supported()).toBe(true);

		motion.Request(function (error, state) {
			expect(state).toBe('granted');
		});

		motion.Start();

		/* Upright, facing the eye: nothing leans. */
		lean(0, 0);

		tilt = motion.Tilt();

		expect(tilt.Steer).toBeCloseTo(0, 6);
		expect(tilt.Pitch).toBeCloseTo(0, 6);
		expect(motion.State().Orientation.Beta).toBeCloseTo(90, 6);

		/* Turned 20 degrees to the right as a wheel: past the dead zone, as far as the range. */
		lean(20, 0);

		expect(motion.Tilt().Steer).toBeCloseTo((20 - 2) / (35 - 2), 4);

		lean(-60, 0);

		expect(motion.Tilt().Steer).toBe(-1);

		/* Leaned back 30 degrees, then that made the middle. */
		lean(0, 30);

		expect(motion.Tilt().Pitch).toBeCloseTo((30 - 2) / 33, 4);

		motion.Center();

		expect(motion.Tilt().Pitch).toBeCloseTo(0, 6);

		lean(10, 30);

		expect(motion.Tilt().Steer).toBeCloseTo(8 / 33, 4);

		motion.Center();

		expect(motion.Tilt().Steer).toBeCloseTo(0, 6);

		/* Landscape: the device turned a quarter, a wheel is the same turn of the screen. */
		motion.Turned = function () {
			return 90;
		};

		window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {alpha: 0, beta: 0, gamma: -90}));

		expect(motion.Tilt().Up.map(function (value) {
			return Math.round(value * 1e4) / 1e4 || 0;
		})).toEqual([0, 1, 0]);

		motion.Turned = turned;
		motion.Middle = {Steer: 0, Pitch: 0};

		/* Flat on a hand, its right edge down. */
		window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {alpha: 0, beta: 0, gamma: 20}));

		expect(motion.Tilt().X).toBeCloseTo((20 - 2) / 33, 4);
		expect(motion.Tilt().Y).toBeCloseTo(0, 6);

		motion.Stop();

		window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {alpha: 0, beta: 0, gamma: 0}));

		expect(motion.State().Orientation.Gamma).toBe(20);
	});

	it('VirtualGamepad: its stick leans the pad as far as the finger, its buttons hold, and it goes with its pad', async function () {
		var told = [];
		var host = mount('<div style="position: relative; width: 600px; height: 400px"><VirtualGamepad Show="always" Buttons="a,b,lt,start" Size="100" (button)="Told" /></div>', {
			Told: function (detail) {
				told.push(detail.Button + (detail.Down ? '+' : '-'));
			}
		});
		var root;
		var stick;
		var box;

		await frame();

		root = host.$Element().querySelector('.elemenx-virtual-pad');
		stick = root.querySelector('.elemenx-virtual-pad-stick.left');
		box = stick.getBoundingClientRect();

		expect(root.hidden).toBe(false);
		expect(Array.from(root.querySelectorAll('[data-button]')).map(function (node) {
			return node.getAttribute('data-button');
		}).sort()).toEqual(['a', 'b', 'lt', 'start']);
		expect(box.width).toBe(100);

		/* Half way to the right and all the way up (past the ring: as far as it goes). */
		pointer(stick, 'pointerdown', box.left + 75, box.top + 50, 3);

		expect(gamepad.Axes().LeftX).toBeCloseTo(0.5, 2);

		pointer(stick, 'pointermove', box.left + 50, box.top - 200, 3);

		expect(gamepad.Axes().LeftY).toBeCloseTo(-1, 4);

		/* Out of the ring on a slant: on its rim, not past it. */
		pointer(stick, 'pointermove', box.left + 250, box.top - 150, 3);

		expect(gamepad.Axes().LeftX).toBeCloseTo(Math.SQRT1_2, 2);
		expect(gamepad.Axes().LeftY).toBeCloseTo(-Math.SQRT1_2, 2);

		pointer(stick, 'pointerup', box.left + 50, box.top - 200, 3);

		expect(gamepad.Axes().LeftY).toBe(0);

		/* A button held while the finger is on it; the trigger is pressed all the way. */
		var a = root.querySelector('[data-button="a"]');
		var trigger = root.querySelector('[data-button="lt"]');

		pointer(a, 'pointerdown', 0, 0, 4);
		pointer(trigger, 'pointerdown', 0, 0, 5);

		expect(gamepad.Held('a')).toBe(true);
		expect(gamepad.Axes().LeftTrigger).toBe(1);

		pointer(a, 'pointerup', 0, 0, 4);
		pointer(trigger, 'pointerup', 0, 0, 5);

		expect(gamepad.Held('a')).toBe(false);
		expect(told).toEqual(['a+', 'lt+', 'a-', 'lt-']);

		var count = gamepad.Pads().length;

		owned.pop().$Destroy();

		expect(gamepad.Pads().length).toBe(count - 1);

		var never = mount('<div><VirtualGamepad Show="never" /></div>');

		await frame();

		expect(never.$Element().querySelector('.elemenx-virtual-pad').hidden).toBe(true);
	});
});
