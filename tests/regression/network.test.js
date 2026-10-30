import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, waitFor, unique } from '../setup.js';

function application (root) {
	var shell = unique('NetworkShell');

	Elemenx.Component(shell, {$Template: '<div class="network-shell"></div>'});

	return Elemenx.Application(unique('NetworkApp'), {
		$Component: shell,
		$Root: root,
		$Mount: '#mount'
	});
}

async function ready (app) {
	return await waitFor(function () {
		return app.$Component();
	}, 1500);
}

describe('Regression: deferred / network component discovery', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () {
		resetDOM();

		window.RemoteConcurrentLoads = 0;
		window.RemoteBasicLoads = 0;
		window.RemoteDestroyLoads = 0;
		window.RemoteDestroyHits = 0;
	});

	it('discovers a missing component from Application Root', async function () {
		var app = application('/network');

		expect(await ready(app)).not.toBe(false);

		var c = Elemenx.Component('RemoteBasic')({value: 'A'}, null, {Application: app});

		document.getElementById('mount').appendChild(c.$Element());

		expect(await waitFor(function () {return document.querySelector('.remote-basic');}, 1500)).not.toBe(false);
		expect(document.querySelector('.remote-basic').textContent).toBe('REMOTE:A');

		c.$Destroy();
		app.$Destroy();
	});

	it('coalesces concurrent discovery and caches the resolved component', async function () {
		var app = application('/network');

		expect(await ready(app)).not.toBe(false);

		var a = Elemenx.Component('RemoteConcurrent')({value: 'A'}, null, {Application: app});
		var b = Elemenx.Component('RemoteConcurrent')({value: 'B'}, null, {Application: app});

		document.getElementById('mount').appendChild(a.$Element());
		document.getElementById('mount').appendChild(b.$Element());

		expect(await waitFor(function () {return document.querySelectorAll('.remote-concurrent').length === 2;}, 1500)).toBe(true);
		expect(window.RemoteConcurrentLoads).toBe(1);

		var c = Elemenx.Component('RemoteConcurrent')({value: 'C'}, null, {Application: app});

		document.getElementById('mount').appendChild(c.$Element());

		await tick(40);

		expect(document.querySelectorAll('.remote-concurrent').length).toBe(3);
		expect(window.RemoteConcurrentLoads).toBe(1);

		a.$Destroy();
		b.$Destroy();
		c.$Destroy();
		app.$Destroy();
	});


	it('unwraps discovery and TemplateID deferred layers to the resolved component', async function () {
		var app = application('/network');

		expect(await ready(app)).not.toBe(false);

		var templateRequested = false;
		var resolveTemplate = null;

		Elemenx.Template.Loader(function (name, readyTemplate) {
			if (name !== 'RemoteNestedTemplateID') return;

			templateRequested = true;
			resolveTemplate = readyTemplate;
		});

		var c = Elemenx.Component('RemoteNestedTemplate')({}, null, {Application: app});

		document.getElementById('mount').appendChild(c.$Element());

		expect(await waitFor(function () {return templateRequested;}, 1500)).toBe(true);
		expect(c._Component()).toBeNull();

		resolveTemplate('<button class="remote-nested-template">{{Count}}</button>');

		expect(await waitFor(function () {
			var resolved = c._Component();

			return resolved && typeof resolved.Increment === 'function';
		}, 1500)).toBe(true);

		var resolved = c._Component();
		var changes = [];

		resolved.$On('change', function (value) {changes.push(value);});
		resolved.Increment();

		await tick();

		expect(changes).toEqual([1]);
		expect(document.querySelector('.remote-nested-template').textContent).toBe('1');

		c.$Destroy();
		app.$Destroy();
	});

	it('does not activate a deferred component after owner Destroy', async function () {
		var app = application('/network');

		expect(await ready(app)).not.toBe(false);

		var head = document.head;
		var append = head.appendChild;
		var held = null;

		head.appendChild = function (node) {
			if (node.tagName === 'SCRIPT' && String(node.src).indexOf('RemoteDestroy.js') !== -1) {
				held = node;

				return node;
			}

			return append.call(this, node);
		};

		var c = Elemenx.Component('RemoteDestroy')({value: 'X'}, null, {Application: app});

		document.getElementById('mount').appendChild(c.$Element());

		expect(await waitFor(function () {return held;}, 5000)).not.toBe(false);

		c.$Destroy();

		head.appendChild = append;

		append.call(head, held);

		await tick(120);

		expect(document.querySelector('.remote-destroy')).toBeNull();
		expect(window.RemoteDestroyHits).toBe(0);

		app.$Destroy();
	});
});