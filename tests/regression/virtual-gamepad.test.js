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

describe('Contract: pads of the page, the motion of a device (InputDevices), the page moved by pads (Gamepad), VirtualGamepad', function () {
	var input;
	var gamepad;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:InputDevices', 'service:Gamepad', 'VirtualGamepad']);

		input = Elemenx.Service('InputDevices');
		gamepad = Elemenx.Service('Gamepad');

		/* The page moves by the pads from its start. */
		gamepad.$Generation();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('InputDevices: a pad of the page is a pad as any other: its events, its sticks and triggers, its buttons held; quiet by choice', async function () {
		var events = [];
		var listen = input.On('button', function (detail) {
			events.push(detail.Button + ':' + detail.Pad.Kind);
		});
		var connected = [];
		var connect = input.On('connect', function (detail) {
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

		quiet = input.Virtual('quiet', {Navigate: false});

		expect(connected).toEqual(['virtual']);
		expect(input.Pads().some(function (pad) {
			return pad.Kind === 'virtual';
		})).toBe(true);

		quiet.Stick('left', 0.6, -0.05);
		quiet.Trigger('right', 0.4);
		quiet.Press('a');

		/* A small lean is none; the triggers as far as they are pressed. */
		expect(input.Axes()).toEqual({LeftX: 0.6, LeftY: 0, RightX: 0, RightY: 0, LeftTrigger: 0, RightTrigger: 0.4});
		expect(input.Held('a')).toBe(true);
		expect(input.Held('right')).toBe(true);

		await frame();

		expect(events).toContain('a:virtual');
		expect(keys).toEqual([]);

		quiet.Release('a');

		expect(input.Held('a')).toBe(false);

		quiet.Destroy();

		expect(input.Axes().LeftX).toBe(0);

		/* A frame with A up: the next press is a press (a pad reported twice presses once). */
		await frame();

		/* One that leads the page as a real one: A is Enter on the focused control. */
		loud = input.Virtual('loud');

		loud.Press('a');

		await frame();

		expect(keys).toContain('Enter');

		loud.Destroy();

		input.Off(listen);
		input.Off(connect);
	});

	it('InputDevices: the keys held, the pointer and how far it went, the fingers; a window left lets every key go', function () {
		window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyW', key: 'w'}));
		window.dispatchEvent(new KeyboardEvent('keydown', {code: 'ShiftLeft', key: 'Shift'}));

		expect(input.Down('KeyW')).toBe(true);
		expect(input.Keys()).toEqual(['KeyW', 'ShiftLeft']);

		window.dispatchEvent(new KeyboardEvent('keyup', {code: 'KeyW', key: 'w'}));

		expect(input.Down('KeyW')).toBe(false);

		window.dispatchEvent(new Event('blur'));

		expect(input.Keys()).toEqual([]);

		input.Moved();

		window.dispatchEvent(new PointerEvent('pointermove', {clientX: 30, clientY: 40, movementX: 5, movementY: -2}));
		window.dispatchEvent(new PointerEvent('pointermove', {clientX: 33, clientY: 41, movementX: 3, movementY: 1}));
		window.dispatchEvent(new PointerEvent('pointerdown', {clientX: 33, clientY: 41, buttons: 1}));

		expect(input.Pointer()).toEqual({X: 33, Y: 41, Buttons: 1, Locked: false});
		expect(input.Moved()).toEqual({X: 8, Y: -1});
		expect(input.Moved()).toEqual({X: 0, Y: 0});

		window.dispatchEvent(new PointerEvent('pointerup', {clientX: 33, clientY: 41, buttons: 0}));

		window.dispatchEvent(new TouchEvent('touchstart', {touches: [new Touch({identifier: 4, target: document.body, clientX: 10, clientY: 20})]}));

		expect(input.Touches()).toEqual([{ID: 4, X: 10, Y: 20}]);

		window.dispatchEvent(new TouchEvent('touchend', {touches: []}));

		expect(input.Touches()).toEqual([]);
	});

	it('InputDevices: actions bound to keys, buttons, halves of the sticks and the mouse; their contexts', function () {
		var pad = input.Virtual(unique('actions'), {Navigate: false});

		input.Bind('Ahead', ['KeyW', 'ArrowUp', 'LeftY-']);
		input.Bind('Back', ['KeyS', 'LeftY+']);
		input.Bind('Fire', ['Mouse0', 'rt']);
		input.Bind('Brake', ['Space'], {Context: 'driving'});
		input.Bind('Jump', ['Space'], {Context: 'walking'});

		expect(input.Value('Ahead')).toBe(0);

		window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyW'}));

		expect(input.Value('Ahead')).toBe(1);
		expect(input.Held('Ahead')).toBe(true);

		window.dispatchEvent(new KeyboardEvent('keyup', {code: 'KeyW'}));

		/* A stick as far as it leans, its other half none; one axis of two actions. */
		pad.Stick('left', 0, 0.4);

		expect(input.Value('Back')).toBeCloseTo(0.4, 6);
		expect(input.Value('Ahead')).toBe(0);
		expect(input.Held('Back')).toBe(false);
		expect(input.Axis('Back', 'Ahead')).toBeCloseTo(-0.4, 6);
		expect(input.Value('LeftY+')).toBeCloseTo(0.4, 6);

		pad.Trigger('right', 1);

		expect(input.Held('Fire')).toBe(true);
		expect(input.Held('rt')).toBe(true);

		/* A binding of a context works only in it; one with none always. */
		window.dispatchEvent(new KeyboardEvent('keydown', {code: 'Space'}));

		expect(input.Context()).toBe('');
		expect(input.Held('Brake')).toBe(false);
		expect(input.Context('driving')).toBe('driving');
		expect(input.Held('Brake')).toBe(true);
		expect(input.Held('Jump')).toBe(false);
		expect(input.Held('Fire')).toBe(true);

		input.Context('walking');

		expect(input.Held('Jump')).toBe(true);

		window.dispatchEvent(new KeyboardEvent('keyup', {code: 'Space'}));

		expect(input.Actions().filter(function (one) {
			return one.Action === 'Jump';
		})).toEqual([{Action: 'Jump', Sources: ['Space'], Context: 'walking'}]);

		['Ahead', 'Back', 'Fire', 'Brake', 'Jump'].forEach(function (action) {
			input.Unbind(action);
		});

		input.Context('');

		expect(input.Actions()).toEqual([]);

		expect(function () {
			input.Bind('Nothing');
		}).toThrow('Elemenx InputDevices: Bind expects (action, sources)');

		pad.Destroy();
	});

	it('InputDevices: the lean of a device as a wheel, its top away, and flat; the way the screen is turned; its middle', function () {
		var turned = input.Turned;
		var tilt;

		expect(input.MotionSupported()).toBe(true);

		input.RequestMotion(function (error, state) {
			expect(state).toBe('granted');
		});

		input.StartMotion();

		/* Upright, facing the eye: nothing leans. */
		lean(0, 0);

		tilt = input.Tilt();

		expect(tilt.Steer).toBeCloseTo(0, 6);
		expect(tilt.Pitch).toBeCloseTo(0, 6);
		expect(input.Motion().Orientation.Beta).toBeCloseTo(90, 6);

		/* Turned 20 degrees to the right as a wheel: past the dead zone, as far as the range. */
		lean(20, 0);

		expect(input.Tilt().Steer).toBeCloseTo((20 - 2) / (35 - 2), 4);

		lean(-60, 0);

		expect(input.Tilt().Steer).toBe(-1);

		/* Leaned back 30 degrees, then that made the middle. */
		lean(0, 30);

		expect(input.Tilt().Pitch).toBeCloseTo((30 - 2) / 33, 4);

		input.Center();

		expect(input.Tilt().Pitch).toBeCloseTo(0, 6);

		lean(10, 30);

		expect(input.Tilt().Steer).toBeCloseTo(8 / 33, 4);

		input.Center();

		expect(input.Tilt().Steer).toBeCloseTo(0, 6);

		/* Landscape: the device turned a quarter, a wheel is the same turn of the screen. */
		input.Turned = function () {
			return 90;
		};

		window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {alpha: 0, beta: 0, gamma: -90}));

		expect(input.Tilt().Up.map(function (value) {
			return Math.round(value * 1e4) / 1e4 || 0;
		})).toEqual([0, 1, 0]);

		input.Turned = turned;
		input.Middle = {Steer: 0, Pitch: 0};

		/* Flat on a hand, its right edge down. */
		window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {alpha: 0, beta: 0, gamma: 20}));

		expect(input.Tilt().X).toBeCloseTo((20 - 2) / 33, 4);
		expect(input.Tilt().Y).toBeCloseTo(0, 6);

		input.StopMotion();

		window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {alpha: 0, beta: 0, gamma: 0}));

		expect(input.Motion().Orientation.Gamma).toBe(20);
	});

	it('VirtualGamepad: its stick leans the pad as far as the finger, its buttons hold, and it goes with its pad', async function () {
		var told = [];
		var host = mount('<div style="position: relative; width: 600px; height: 400px"><VirtualGamepad Show="always" Buttons="a,b,lt,start" Size="100" DeadZone="0" (button)="Told" /></div>', {
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

		expect(input.Axes().LeftX).toBeCloseTo(0.5, 2);

		pointer(stick, 'pointermove', box.left + 50, box.top - 200, 3);

		expect(input.Axes().LeftY).toBeCloseTo(-1, 4);

		/* Out of the ring on a slant: on its rim, not past it. */
		pointer(stick, 'pointermove', box.left + 250, box.top - 150, 3);

		expect(input.Axes().LeftX).toBeCloseTo(Math.SQRT1_2, 2);
		expect(input.Axes().LeftY).toBeCloseTo(-Math.SQRT1_2, 2);

		pointer(stick, 'pointerup', box.left + 50, box.top - 200, 3);

		expect(input.Axes().LeftY).toBe(0);

		/* A button held while the finger is on it; the trigger is pressed all the way. */
		var a = root.querySelector('[data-button="a"]');
		var trigger = root.querySelector('[data-button="lt"]');

		pointer(a, 'pointerdown', 0, 0, 4);
		pointer(trigger, 'pointerdown', 0, 0, 5);

		expect(input.Held('a')).toBe(true);
		expect(input.Axes().LeftTrigger).toBe(1);

		pointer(a, 'pointerup', 0, 0, 4);
		pointer(trigger, 'pointerup', 0, 0, 5);

		expect(input.Held('a')).toBe(false);
		expect(told).toEqual(['a+', 'lt+', 'a-', 'lt-']);

		var count = input.Pads().length;

		owned.pop().$Destroy();

		expect(input.Pads().length).toBe(count - 1);

		var never = mount('<div><VirtualGamepad Show="never" /></div>');

		await frame();

		expect(never.$Element().querySelector('.elemenx-virtual-pad').hidden).toBe(true);
	});

	/* Regression: the first two shoulders went to the left whatever they were: a lone rb on the left, over what was there. */
	it('VirtualGamepad: puts the shoulders of the left on the left and those of the right on the right', async function () {
		var host = mount('<div style="position: relative; width: 600px; height: 400px"><VirtualGamepad Show="always" Buttons="a,rb,rt" /></div>');
		var both = mount('<div style="position: relative; width: 600px; height: 400px"><VirtualGamepad Show="always" Buttons="lb,rt" /></div>');

		function side (component, name) {
			return Array.prototype.map.call(component.$Element().querySelectorAll('.elemenx-virtual-pad-shoulders.' + name + ' [data-button]'), function (button) {
				return button.getAttribute('data-button');
			});
		}

		await frame();

		expect(side(host, 'left')).toEqual([]);
		expect(side(host, 'right')).toEqual(['rb', 'rt']);
		expect(side(both, 'left')).toEqual(['lb']);
		expect(side(both, 'right')).toEqual(['rt']);
	});

	it('VirtualGamepad: shows a cross of up, down, left and right (dpad for all four) whose buttons hold the pad', async function () {
		var all = mount('<div style="position: relative; width: 600px; height: 400px"><VirtualGamepad Show="always" Buttons="a,dpad" /></div>');
		var two = mount('<div style="position: relative; width: 600px; height: 400px"><VirtualGamepad Show="always" Buttons="up,down" /></div>');
		var none = mount('<div style="position: relative; width: 600px; height: 400px"><VirtualGamepad Show="always" Buttons="a" /></div>');
		var input = Elemenx.Service('InputDevices');
		var up;

		function cross (component) {
			return Array.prototype.map.call(component.$Element().querySelectorAll('.elemenx-virtual-pad-dpad [data-button]'), function (button) {
				return button.getAttribute('data-button');
			});
		}

		await frame();

		expect(cross(all)).toEqual(['up', 'left', 'right', 'down']);
		expect(cross(two)).toEqual(['up', 'down']);
		expect(none.$Element().querySelector('.elemenx-virtual-pad-dpad')).toBe(null);

		up = all.$Element().querySelector('.elemenx-virtual-pad-dpad [data-button="up"]');

		pointer(up, 'pointerdown', 10, 10);

		await waitFor(function () {
			return input.Held('up');
		}, 2000);

		expect(input.Held('up')).toBe(true);

		pointer(up, 'pointerup', 10, 10);

		await waitFor(function () {
			return !input.Held('up');
		}, 2000);

		expect(input.Held('up')).toBe(false);
	});

	/*
	 * Regression: the right stick of a pad on the screen went on turning the view: a finger taken from it (its capture lost)
	 * left it leaning, and the least lean turned it.
	 */
	it('VirtualGamepad: gives nothing within its dead zone, the right stick by its curve, lets go of a finger taken away, and floats', async function () {
		var host = mount('<div style="position: relative; width: 600px; height: 400px"><VirtualGamepad Show="always" Right="true" Size="100" Buttons="a" /></div>');
		var floating = mount('<div style="position: relative; width: 600px; height: 400px"><VirtualGamepad Show="always" Right="true" Size="100" Buttons="a" Floating="true" /></div>');
		var root;
		var left;
		var right;
		var box;

		await frame();

		root = host.$Element().querySelector('.elemenx-virtual-pad');
		left = root.querySelector('.elemenx-virtual-pad-stick.left');
		right = root.querySelector('.elemenx-virtual-pad-stick.right');
		box = left.getBoundingClientRect();

		/* A tenth of the way: within the dead zone (0.12), nothing. */
		pointer(left, 'pointerdown', box.left + 55, box.top + 50, 3);

		expect(input.Axes().LeftX).toBe(0);

		/* Half the way: the rest of the way past the dead zone, even on the left stick. */
		pointer(left, 'pointermove', box.left + 75, box.top + 50, 3);

		expect(input.Axes().LeftX).toBeCloseTo((0.5 - 0.12) / 0.88, 3);

		/* Its capture lost (a finger the page took): the stick lets go. */
		left.dispatchEvent(new PointerEvent('lostpointercapture', {bubbles: true, pointerId: 3, pointerType: 'touch'}));

		expect(input.Axes().LeftX).toBe(0);

		/* The right stick half the way: the square of it, fine to aim; all the way: all of it. */
		box = right.getBoundingClientRect();

		pointer(right, 'pointerdown', box.left + 50, box.top + 25, 4);

		expect(input.Axes().RightY).toBeCloseTo(-Math.pow((0.5 - 0.12) / 0.88, 2), 3);

		pointer(right, 'pointermove', box.left + 50, box.top - 100, 4);

		expect(input.Axes().RightY).toBeCloseTo(-1, 3);

		pointer(right, 'pointerup', box.left + 50, box.top - 100, 4);

		expect(input.Axes().RightY).toBe(0);

		/* Floating: a finger on the lower left of the screen, the stick under it; a lean from there; back as it lifts. */
		root = floating.$Element().querySelector('.elemenx-virtual-pad');
		left = root.querySelector('.elemenx-virtual-pad-stick.left');

		var zone = root.querySelector('.elemenx-virtual-pad-zone.left');
		var area = root.getBoundingClientRect();
		var at = [area.left + 200, area.top + 250];

		pointer(zone, 'pointerdown', at[0], at[1], 5);

		await frame();

		box = left.getBoundingClientRect();

		expect(box.left + box.width / 2).toBeCloseTo(at[0], 0);
		expect(box.top + box.height / 2).toBeCloseTo(at[1], 0);
		expect(input.Axes().LeftX).toBe(0);

		pointer(zone, 'pointermove', at[0] + 50, at[1], 5);

		expect(input.Axes().LeftX).toBeCloseTo(1, 3);

		pointer(zone, 'pointerup', at[0] + 50, at[1], 5);

		await frame();

		expect(input.Axes().LeftX).toBe(0);
		expect(left.getBoundingClientRect().left).toBeLessThan(at[0] - 50);
	});
});
