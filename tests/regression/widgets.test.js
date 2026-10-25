import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var applications = [];
var stops = [];

describe('Contract: Elemenx.Widgets, Components of an Application on a page of another site', function () {
	var application;
	var counter;
	var badge;
	var widget;

	beforeAll(async function () {
		await loadElemenx();

		application = unique('Shop');
		counter = unique('Counter');
		badge = unique('CounterBadge');
		widget = unique('CounterButton');

		/* A Service of the Application, its state shared by every widget of it; it tells them when it changes. */
		Elemenx.Service(counter, {
			Count: 0,
			$OnCreate: function () {
				this.Listeners = [];
			},
			Add: function () {
				var count = ++this.Count;

				this.Listeners.forEach(function (listener) {
					listener(count);
				});
			},
			OnChange: function (listener) {
				this.Listeners.push(listener);
			}
		});

		Elemenx.Component(widget, {
			$Template: '<button class="widget-add" (click)="Pressed">{{Label}} {{Count}}</button>',
			Label: 'Add',
			Count: 0,
			$OnCreate: function () {
				var self = this;

				this.Count = this.$Service(counter).Count;

				this.$Service(counter).OnChange(function (count) {
					self.Count = count;
				});
			},
			Pressed: function () {
				this.$Service(counter).Add();

				this.$Emit('added', {Count: this.$Service(counter).Count});
			}
		});

		Elemenx.Component(badge, {
			$Template: '<span class="widget-badge">{{Count}}</span>',
			Count: 0,
			$OnCreate: function () {
				var self = this;

				this.Count = this.$Service(counter).Count;

				this.$Service(counter).OnChange(function (count) {
					self.Count = count;
				});
			}
		});
	});

	beforeEach(function () {
		resetDOM();

		applications.push(Elemenx.Application(application, {}));

		Elemenx.Widgets.Define('Add', {Component: widget, Application: application, Props: {Label: 'Add'}, Events: ['added']});
		Elemenx.Widgets.Define('Badge', {Component: badge, Application: application});
	});

	afterEach(function () {
		while (stops.length) stops.pop()();

		Array.prototype.forEach.call(document.querySelectorAll('[data-elemenx-widget-mounted]'), function (element) {
			Elemenx.Widgets.Unmount(element);
		});

		while (applications.length) applications.pop().$Destroy();
	});

	it('mounts a widget in a shadow root of its element, with its props, tells its events to the page and takes it away', async function () {
		var place = document.createElement('div');
		var heard = [];
		var mounted;

		document.getElementById('mount').appendChild(place);

		place.addEventListener('added', function (event) {
			heard.push(event.detail.Count);
		});

		mounted = Elemenx.Widgets.Mount(place, 'Add', {Label: 'Buy'});

		await tick(20);

		expect(mounted.Name).toBe('Add');
		expect(place.shadowRoot.querySelector('.widget-add').textContent).toBe('Buy 0');
		expect(place.querySelector('.widget-add')).toBe(null);
		expect(place.getAttribute('data-elemenx-widget-mounted')).toBe('Add');

		/* Its props change; its events bubble from its element as DOM events. */
		mounted.Update({Label: 'Take'});

		place.shadowRoot.querySelector('.widget-add').click();

		await tick(20);

		expect(place.shadowRoot.querySelector('.widget-add').textContent).toBe('Take 1');
		expect(heard).toEqual([1]);

		mounted.Unmount();

		expect(place.shadowRoot.childNodes.length).toBe(0);
		expect(place.hasAttribute('data-elemenx-widget-mounted')).toBe(false);
		expect(Elemenx.Widgets.Unmount(place)).toBe(false);
	});

	it('watches the page: mounts its places, the ones added later, follows their props and takes away the ones removed', async function () {
		var host = document.getElementById('mount');
		var later;
		var other;

		host.innerHTML = '<div class="first" data-elemenx-widget="Add" data-props=\'{"Label": "One"}\'></div><div class="badge" data-elemenx-widget="Badge"></div><div class="foreign" data-elemenx-widget="Elsewhere"></div>';

		stops.push(Elemenx.Widgets.Watch());

		await tick(20);

		expect(host.querySelector('.first').shadowRoot.querySelector('.widget-add').textContent).toContain('One');

		/* A widget of another code is left alone. */
		expect(host.querySelector('.foreign').shadowRoot).toBe(null);

		/* Two widgets of one Application: one Service, one state. */
		host.querySelector('.first').shadowRoot.querySelector('.widget-add').click();

		await tick(20);

		expect(host.querySelector('.badge').shadowRoot.querySelector('.widget-badge').textContent).toBe(host.querySelector('.first').shadowRoot.querySelector('.widget-add').textContent.split(' ').pop());
		expect(host.querySelector('.badge').shadowRoot.querySelector('.widget-badge').textContent).not.toBe('0');

		/* Added later: mounted; its data-props changed: updated; removed: unmounted. */
		later = document.createElement('section');
		later.innerHTML = '<div class="later" data-elemenx-widget="Add" data-props=\'{"Label": "Later"}\'></div>';

		host.appendChild(later);

		await tick(20);

		other = host.querySelector('.later');

		expect(other.shadowRoot.querySelector('.widget-add').textContent).toContain('Later');

		other.setAttribute('data-props', '{"Label": "Changed"}');

		await tick(20);

		expect(other.shadowRoot.querySelector('.widget-add').textContent).toContain('Changed');

		later.remove();

		await tick(20);

		expect(other.hasAttribute('data-elemenx-widget-mounted')).toBe(false);
		expect(Elemenx.Widgets.Names()).toEqual(expect.arrayContaining(['Add', 'Badge']));
	});

	it('refuses a widget it does not know and a definition without a Component', function () {
		expect(function () {
			Elemenx.Widgets.Mount(document.createElement('div'), 'Nothing');
		}).toThrow('Elemenx.Widgets does not know the widget Nothing');

		expect(function () {
			Elemenx.Widgets.Define('Broken', {});
		}).toThrow('Elemenx.Widgets.Define expects (name, {Component, Application, Props, Events, Shadow})');
	});
});
