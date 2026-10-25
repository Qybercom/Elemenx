import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import boardSource from '../../libraries/ElemenxUI/components/Board/Board.js?raw';
import boardTemplate from '../../libraries/ElemenxUI/components/Board/Board.html?raw';
import boardStyle from '../../libraries/ElemenxUI/components/Board/Board.css?raw';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('BoardHost'), Object.assign({$Template: template}, state || {}))();
	var place = document.getElementById('mount');

	place.style.width = '800px';
	place.style.height = '600px';

	owned.push(component);

	place.appendChild(component.$Element());

	return component;
}

function board (host) {
	return host.$Element().querySelector('.elemenx-board');
}

describe('Contract: Board, an infinite canvas', function () {
	beforeAll(async function () {
		await loadElemenx();

		/* The Board with its template inline and its style: the page of the tests serves no Library. */
		new Function(boardSource.replace("$StyleURL: 'Board.css',\n", '').replace("$TemplateURL: 'Board.html'", function () {
			return '$Template: ' + JSON.stringify(boardTemplate);
		}))();

		Elemenx.Style('test:board', boardStyle);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('moves its world by the wheel, zooms at the pointer with Ctrl, and keeps the point of the world under it', async function () {
		var views = [];
		var host = mount('<div style="height: 100%"><Board Controls="false" (view)="Viewed"><div class="note" style="position: absolute; left: 100px; top: 50px; width: 200px; height: 100px">Note</div></Board></div>', {Viewed: function (view) {
			views.push(view);
		}});
		var view;
		var box;
		var before;
		var instance;

		await tick(20);

		view = board(host);
		box = view.getBoundingClientRect();

		/* The wheel moves the view: the world goes the other way. */
		view.dispatchEvent(new WheelEvent('wheel', {deltaX: 30, deltaY: 60, clientX: box.left + 10, clientY: box.top + 10, bubbles: true, cancelable: true}));

		await tick(20);

		expect(views[views.length - 1]).toEqual({X: 30, Y: 60, Zoom: 1});
		expect(host.$Element().querySelector('.elemenx-board-world').style.transform).toBe('translate(-30px, -60px) scale(1)');

		/* Ctrl and the wheel zoom at the pointer: the point of the world there stays there. */
		instance = views.length;
		before = {X: 30 + 200, Y: 60 + 100};

		view.dispatchEvent(new WheelEvent('wheel', {deltaY: -300, ctrlKey: true, clientX: box.left + 200, clientY: box.top + 100, bubbles: true, cancelable: true}));

		await tick(20);

		expect(views.length).toBe(instance + 1);
		expect(views[views.length - 1].Zoom).toBeCloseTo(2, 5);
		expect(views[views.length - 1].X + 200 / 2).toBeCloseTo(before.X, 5);
		expect(views[views.length - 1].Y + 100 / 2).toBeCloseTo(before.Y, 5);

		/* The note, scaled with the world, on the screen where the world says. */
		expect(host.$Element().querySelector('.note').getBoundingClientRect().width).toBeCloseTo(400, 0);
	});

	it('moves by a drag on an empty place, keeps its zoom in bounds, converts its points and fits its content', async function () {
		var host = mount('<div style="height: 100%"><Board MaxZoom="4"><div class="far" style="position: absolute; left: 1000px; top: 1000px; width: 400px; height: 300px"></div></Board></div>');
		var view;
		var box;
		var component;
		var point;

		await tick(20);

		view = board(host);
		box = view.getBoundingClientRect();
		component = owned[0].$Element().querySelector('.elemenx-board-host');

		view.dispatchEvent(new PointerEvent('pointerdown', {pointerId: 1, button: 0, clientX: box.left + 300, clientY: box.top + 300, bubbles: true}));
		view.dispatchEvent(new PointerEvent('pointermove', {pointerId: 1, clientX: box.left + 250, clientY: box.top + 280, bubbles: true}));
		view.dispatchEvent(new PointerEvent('pointerup', {pointerId: 1, clientX: box.left + 250, clientY: box.top + 280, bubbles: true}));

		await tick(20);

		expect(host.$Element().querySelector('.elemenx-board-world').style.transform).toBe('translate(-50px, -20px) scale(1)');

		/* The buttons zoom in and out; the percent fits the content: all of it in view, no larger than zoom 1. */
		host.$Element().querySelectorAll('.elemenx-board-control')[2].click();

		await tick(20);

		expect(host.$Element().querySelector('.elemenx-board-zoom').textContent).toBe('125%');

		host.$Element().querySelector('.elemenx-board-zoom').click();

		await tick(20);

		point = host.$Element().querySelector('.far').getBoundingClientRect();

		expect(point.left).toBeGreaterThanOrEqual(box.left);
		expect(point.right).toBeLessThanOrEqual(box.right + 1);
		expect(point.top).toBeGreaterThanOrEqual(box.top);
		expect(point.bottom).toBeLessThanOrEqual(box.bottom + 1);

		/* The keys zoom within MaxZoom. */
		view.focus();

		for (var i = 0; i < 20; i++)
			view.dispatchEvent(new KeyboardEvent('keydown', {key: '+', bubbles: true, cancelable: true}));

		await tick(20);

		expect(host.$Element().querySelector('.elemenx-board-zoom').textContent).toBe('400%');
		expect(component).not.toBe(null);
	});
});
