import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import boardSource from '../../libraries/ElemenxUI/components/Board/Board.js?raw';
import boardTemplate from '../../libraries/ElemenxUI/components/Board/Board.html?raw';
import boardStyle from '../../libraries/ElemenxUI/components/Board/Board.css?raw';
import buttonSource from '../../libraries/ElemenxUI/components/Button/Button.js?raw';
import buttonTemplate from '../../libraries/ElemenxUI/components/Button/Button.html?raw';

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

		/* Its buttons of the zoom are Buttons. */
		new Function(buttonSource.replace("$StyleURL: 'Button.css',\n", '').replace("$TemplateURL: 'Button.html'", function () {
			return '$Template: ' + JSON.stringify(buttonTemplate);
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
		host.$Element().querySelectorAll('.elemenx-board-controls button')[2].click();

		await tick(20);

		expect(host.$Element().querySelector('.elemenx-board-zoom').textContent.trim()).toBe('125%');
		expect(host.$Element().querySelector('.elemenx-board-zoom button').getAttribute('aria-label')).toBe(Elemenx.Locale.Text('ui.board.fit'));

		host.$Element().querySelector('.elemenx-board-zoom button').click();

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

		expect(host.$Element().querySelector('.elemenx-board-zoom').textContent.trim()).toBe('400%');
		expect(component).not.toBe(null);
	});

	it('leaves the wheel to an element of its content that scrolls that way, and zooms over it with Ctrl', async function () {
		var host = mount('<div style="height: 100%"><Board Controls="false"><div class="list" style="position: absolute; left: 0; top: 0; width: 200px; height: 100px; overflow: auto"><div style="height: 400px"></div></div></Board></div>');
		var component;
		var list;
		var wheel;

		await tick(20);

		component = Elemenx.Instance(host.$Element().querySelector('.elemenx-board-host'));
		list = host.$Element().querySelector('.list');
		wheel = function (target, deltaY, ctrlKey) {
			var event = new WheelEvent('wheel', {deltaY: deltaY, ctrlKey: !!ctrlKey, clientX: 10, clientY: 10, bubbles: true, cancelable: true});

			target.dispatchEvent(event);

			return event.defaultPrevented;
		};

		/* Down over the list: the list scrolls (the browser does it), the view stays. */
		expect(wheel(list.firstChild, 60)).toBe(false);
		expect(component.Y).toBe(0);

		/* Up at its top, it scrolls no further: the view moves. */
		expect(wheel(list.firstChild, -60)).toBe(true);
		expect(component.Y).toBe(-60);

		/* At its end, down moves the view too; Ctrl zooms anywhere. */
		list.scrollTop = 1000;

		expect(wheel(list.firstChild, 60)).toBe(true);
		expect(component.Y).toBe(0);

		list.scrollTop = 0;

		expect(wheel(list.firstChild, -300, true)).toBe(true);
		expect(component.Zoom).toBeCloseTo(2, 5);
	});

	it('keeps the view to its content with Bounds content: a margin around it, a smaller part in the middle', async function () {
		var views = [];
		var host = mount('<div style="height: 100%"><Board Controls="false" Bounds="content" BoundsMargin="20" (view)="Viewed"><div style="position: absolute; left: 0; top: 0; width: 1600px; height: 1200px"></div></Board></div>', {Viewed: function (view) {
			views.push(view);
		}});
		var component;

		await tick(20);

		component = Elemenx.Instance(host.$Element().querySelector('.elemenx-board-host'));

		expect(component.Limits()).toEqual({Left: -20, Top: -20, Right: 1620, Bottom: 1220});

		/* Far out on either side: at the edge of the content and its margin. */
		component.Pan(-500, -500);

		expect([component.X, component.Y]).toEqual([-20, -20]);

		component.Pan(5000, 5000);

		expect([component.X, component.Y]).toEqual([1620 - 800, 1220 - 600]);

		/* Zoomed out until all of it is smaller than the view: it stays in the middle, wherever the view is moved. */
		component.ZoomTo(0.25);
		component.Pan(300, -300);

		expect(component.X).toBeCloseTo(-20 - (800 / 0.25 - 1640) / 2, 5);
		expect(component.Y).toBeCloseTo(-20 - (600 / 0.25 - 1240) / 2, 5);
		expect(views[views.length - 1].Zoom).toBe(0.25);
	});

	it('keeps the view to one frame with Bounds frame, follows the Frame named and its size, and fits it', async function () {
		var host = mount('<div style="height: 100%"><Board Controls="false" Bounds="frame" BoundsMargin="0" [frame]="Shown">' +
			'<div data-frame="home" style="position: absolute; left: 0; top: 0; width: 800px; height: 1000px"></div>' +
			'<div data-frame="about" class="about" style="position: absolute; left: 2000px; top: 0; width: 400px; height: 300px"></div>' +
			'</Board></div>', {Shown: 'home'});
		var component;

		await tick(20);

		component = Elemenx.Instance(host.$Element().querySelector('.elemenx-board-host'));

		/* As wide as the view: across it does not move; down it goes as far as the frame. */
		component.Pan(300, 5000);

		expect([component.X, component.Y]).toEqual([0, 400]);

		/* Another frame: the view goes to it, in its middle (it is smaller than the view). */
		host.Shown = 'about';

		await tick(20);

		expect([component.X, component.Y]).toEqual([2000 - 200, -150]);

		/* The frame grows: the view follows it. */
		host.$Element().querySelector('.about').style.width = '1200px';

		await tick(60);

		expect(component.X).toBe(2000);

		component.Pan(5000, 0);

		expect(component.X).toBe(2000 + 1200 - 800);

		/* Fitting fits the frame alone, not all of the content. */
		component.FitContent(0);

		expect(component.Zoom).toBeCloseTo(800 / 1200, 5);
		expect(component.X).toBeCloseTo(2000, 5);
	});
});
