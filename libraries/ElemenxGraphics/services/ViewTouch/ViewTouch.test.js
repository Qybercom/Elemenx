import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, tick } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var touch;

/* A pointer event as the view gets it: a finger (touch) or a mouse. */
function event (type, id, x, y, kind) {
	return {type: type, pointerId: id, pointerType: kind || 'touch', clientX: x, clientY: y, button: 0, target: null, currentTarget: null, preventDefault: function () {}};
}

/* The handlers of an editor that write down what reaches them. */
function editor (options) {
	var told = [];
	var camera = [];
	var aborted = 0;
	var made = touch.Make(Object.assign({
		Wait: 40,
		Edit: {Down: function (e) {
			told.push('down ' + e.clientX + ',' + e.clientY + ' ' + e.button);
		}, Move: function (e) {
			told.push('move ' + e.clientX + ',' + e.clientY);
		}, Up: function (e) {
			told.push('up ' + e.clientX + ',' + e.clientY);
		}},
		Camera: function (gesture) {
			camera.push(gesture.Type + ':' + gesture.Pointers);
		},
		Abort: function () {
			aborted++;
		}
	}, options || {}));

	return {Made: made, Told: told, Camera: camera, Aborted: function () {
		return aborted;
	}};
}

/* A camera of a Scene as ViewTouch.Orbit reads and sets it. */
function scene (view) {
	return {View: view, Viewpoint: function () {
		return Object.assign({}, this.View, {Target: this.View.Target.slice()});
	}, SetViewpoint: function (next) {
		this.View = next;
	}};
}

describe('Contract: ViewTouch, the fingers on the view of an editor: one edits, two move the camera', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:ViewTouch']);

		touch = Elemenx.Service('ViewTouch');
	});

	it('gives a mouse to the editor as it comes', function () {
		var one = editor();

		one.Made.Down(event('pointerdown', 1, 10, 10, 'mouse'));
		one.Made.Move(event('pointermove', 1, 30, 10, 'mouse'));
		one.Made.Up(event('pointerup', 1, 30, 10, 'mouse'));

		expect(one.Told).toEqual(['down 10,10 0', 'move 30,10', 'up 30,10']);
		expect(one.Camera).toEqual([]);
	});

	it('lets one finger edit after it waited for a second one, at once when it moves or lifts', async function () {
		var held = editor();
		var moved = editor();
		var tapped = editor();

		held.Made.Down(event('pointerdown', 1, 10, 10));

		expect(held.Told).toEqual([]);

		await tick(80);

		expect(held.Told).toEqual(['down 10,10 0']);

		held.Made.Move(event('pointermove', 1, 12, 10));
		held.Made.Up(event('pointerup', 1, 12, 10));

		expect(held.Told).toEqual(['down 10,10 0', 'move 12,10', 'up 12,10']);

		moved.Made.Down(event('pointerdown', 1, 10, 10));
		moved.Made.Move(event('pointermove', 1, 40, 10));

		expect(moved.Told).toEqual(['down 10,10 0', 'move 40,10']);

		tapped.Made.Down(event('pointerdown', 1, 10, 10));
		tapped.Made.Up(event('pointerup', 1, 10, 10));

		expect(tapped.Told).toEqual(['down 10,10 0', 'up 10,10']);
	});

	it('gives two fingers to the camera, the editor never seeing the first when the second came soon', async function () {
		var one = editor();

		one.Made.Down(event('pointerdown', 1, 100, 100));
		one.Made.Down(event('pointerdown', 2, 200, 100));

		await tick(80);

		one.Made.Move(event('pointermove', 1, 60, 100));
		one.Made.Move(event('pointermove', 2, 240, 100));
		one.Made.Up(event('pointerup', 1, 60, 100));
		one.Made.Move(event('pointermove', 2, 260, 100));
		one.Made.Up(event('pointerup', 2, 260, 100));

		expect(one.Told).toEqual([]);
		expect(one.Aborted()).toBe(0);
		expect(one.Camera).toContain('pinch:2');
	});

	it('lets an edit go when a second finger comes late to it, and the camera has the fingers till all lift', function () {
		var one = editor();

		one.Made.Down(event('pointerdown', 1, 100, 100));
		one.Made.Move(event('pointermove', 1, 130, 100));
		one.Made.Down(event('pointerdown', 2, 300, 100));
		one.Made.Move(event('pointermove', 1, 100, 100));
		one.Made.Move(event('pointermove', 2, 330, 100));
		one.Made.Up(event('pointerup', 2, 330, 100));
		one.Made.Move(event('pointermove', 1, 50, 100));
		one.Made.Up(event('pointerup', 1, 50, 100));

		expect(one.Told).toEqual(['down 100,100 0', 'move 130,100']);
		expect(one.Aborted()).toBe(1);
	});

	it('gives one finger to the camera too when OneFinger says so', function () {
		var hand = true;
		var one = editor({OneFinger: function () {
			return hand;
		}});

		one.Made.Down(event('pointerdown', 1, 100, 100));
		one.Made.Move(event('pointermove', 1, 140, 100));
		one.Made.Move(event('pointermove', 1, 160, 100));
		one.Made.Up(event('pointerup', 1, 160, 100));

		expect(one.Told).toEqual([]);
		expect(one.Camera).toContain('pan:1');

		hand = false;

		one.Made.Down(event('pointerdown', 1, 100, 100));
		one.Made.Move(event('pointermove', 1, 140, 100));

		expect(one.Told).toEqual(['down 100,100 0', 'move 140,100']);
	});

	it('Orbit turns the camera of a scene round what it looks at, carries it aside and brings it nearer', function () {
		var view = scene({Target: [0, 0, 0], Yaw: 0, Pitch: 0.3, Distance: 10});

		expect(touch.Orbit(view, {Type: 'pan', Pointers: 1, MoveX: 100, MoveY: 0})).toBe(true);
		expect(view.View.Yaw).toBeCloseTo(-0.6, 6);
		expect(view.View.Target).toEqual([0, 0, 0]);

		view.View.Yaw = 0;

		touch.Orbit(view, {Type: 'pan', Pointers: 2, MoveX: 100, MoveY: 0});

		expect(view.View.Target[0]).toBeCloseTo(-1.5, 6);
		expect(view.View.Distance).toBe(10);

		touch.Orbit(view, {Type: 'pinch', Pointers: 2, Step: 2});

		expect(view.View.Distance).toBe(5);

		touch.Orbit(view, {Type: 'pinch', Pointers: 2, Step: 1000});

		expect(view.View.Distance).toBe(0.3);
		expect(touch.Orbit(view, {Type: 'tap', Pointers: 1})).toBe(false);
	});
});
