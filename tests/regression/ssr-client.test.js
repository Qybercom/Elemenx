import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';

var owned = [];
var applications = [];

/* A state script of a page a server rendered, in the body. */
function stateScript (components) {
	var script = document.createElement('script');

	script.type = 'application/json';

	script.setAttribute('data-elemenx-state', '');

	script.textContent = JSON.stringify({Version: 1, Application: 'App', URL: location.href, Components: components});

	document.body.appendChild(script);

	owned.push({$Destroy: function () {
		script.remove();
	}});

	return script;
}

describe('Contract: SSR on the client: $OnSSR, the state of a server, its markup replaced', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		while (applications.length) applications.pop().$Destroy();
	});

	it('calls $OnSSR on the client with no state for it, before its first render, with its key of the tree of Components', function () {
		var child = unique('SsrCard');
		var parent = unique('SsrList');
		var calls = [];
		var host;

		Elemenx.Component(child, {
			$Template: '<b class="card">{{Title}}</b>',
			Title: '',
			$OnSSR: function (done, context) {
				calls.push(context);

				this.Title = 'Loaded ' + context.Key.split('#').pop();

				done();
			}
		});

		Elemenx.Component(parent, {
			$Template: '<div><' + child + ' /><' + child + ' /><i>{{Count}}</i></div>',
			Count: 0,
			$OnSSR: function (done, context) {
				calls.push(context);

				/* Late, as data that comes from the network: what it shows changes when it comes. */
				var self = this;

				setTimeout(function () {
					self.Count = 2;

					done();
				}, 0);
			}
		});

		host = Elemenx.Component(parent)();

		owned.push(host);

		document.getElementById('mount').appendChild(host.$Element());

		expect(calls.map(function (context) {
			return context.Key;
		})).toEqual([parent + '#0', parent + '#0/' + child + '#0', parent + '#0/' + child + '#1']);
		expect(calls.every(function (context) {
			return context.Server === false && context.URL === location.href;
		})).toBe(true);
		expect(Array.prototype.map.call(host.$Element().querySelectorAll('.card'), function (card) {
			return card.textContent;
		})).toEqual(['Loaded 0', 'Loaded 1']);

		return waitFor(function () {
			return host.$Element().querySelector('i').textContent === '2';
		}, 1000).then(function (shown) {
			expect(shown).toBe(true);
		});
	});

	it('starts a Component of the state of its server with its fields, not calling $OnSSR, once: the next of that key loads its own', function () {
		var name = unique('SsrPage');
		var loads = 0;
		var first;
		var second;

		Elemenx.Component(name, {
			$Template: '<ul><li *for="item of Items" *key="item">{{item}}</li></ul>',
			Items: [],
			Created: null,
			$OnCreate: function () {
				this.Created = this.Items.length;
			},
			$OnSSR: function (done) {
				loads++;
				this.Items = ['own'];

				done();
			}
		});

		stateScript({[name + '#0']: {Items: ['a', 'b', 'c']}});

		first = Elemenx.Component(name)();

		owned.push(first);

		expect(loads).toBe(0);
		expect(first.Items).toEqual(['a', 'b', 'c']);
		expect(first.$Element().querySelectorAll('li').length).toBe(3);

		/* Its fields come after $OnCreate, before the first render: $OnCreate saw its own. */
		expect(first.Created).toBe(0);

		second = Elemenx.Component(name)();

		owned.push(second);

		expect(loads).toBe(1);
		expect(second.Items).toEqual(['own']);

		/* A state script that came later is read too. */
		stateScript({[name + '#2']: {Items: ['late']}});

		var third = Elemenx.Component(name)();

		owned.push(third);

		expect(third.Items).toEqual(['late']);
		expect(loads).toBe(1);
	});

	it('makes the root of an Application out of sight beside the markup of a server, and puts it in its place once ready', async function () {
		var name = unique('SsrRoot');
		var mount = document.createElement('div');
		var seen = null;
		var app;

		mount.id = unique('ssr-mount');

		mount.setAttribute('data-elemenx-ssr', '0.12.7');

		mount.innerHTML = '<p class="served">Rendered by the server</p>';

		document.getElementById('mount').appendChild(mount);

		Elemenx.Component(name, {$Template: '<p class="client">Made here</p>'});

		app = Elemenx.Application(unique('SsrApp'), {
			$Component: name,
			$Mount: '#' + mount.id,
			$OnReady: function () {
				seen = {Served: mount.querySelectorAll('.served').length, Client: mount.querySelector('.client').parentNode.style.display};
			}
		});

		applications.push(app);

		await waitFor(function () {
			return seen;
		}, 2000);

		/* At $OnReady the markup of the server has gone already, and the root shows. */
		expect(seen).toEqual({Served: 0, Client: ''});
		expect(mount.textContent.trim()).toBe('Made here');
		expect(mount.hasAttribute('data-elemenx-ssr')).toBe(false);

		/* What hid it is gone, and nothing else of its style: it had none. */
		expect(mount.querySelector('.client').parentNode.hasAttribute('style')).toBe(false);
	});

	it('takes over with $Hydrate what the reader did in the markup of the server: what was typed and chosen, the details opened, the scroll, the focus', async function () {
		var template = '<form class="form"><input class="name" name="Name" [(value)]="Name" /><input type="checkbox" name="Agree" [(checked)]="Agree" /><select name="Size"><option>S</option><option>M</option><option>L</option></select><details><summary>More</summary><p>Text</p></details><div class="list" style="height: 40px; overflow: auto"><p style="height: 400px">Long</p></div></form>';
		var results = [];

		for (var hydrate of [true, false]) {
			var name = unique('SsrForm');
			var mount = document.createElement('div');
			var app;
			var instance;

			mount.id = unique('ssr-form');

			mount.setAttribute('data-elemenx-ssr', '0.12.7');

			mount.innerHTML = '\n\t' + template.replace(/ \[\(\w+\)\]="\w+"/g, '') + '\n';

			document.getElementById('mount').appendChild(mount);

			/* The reader, before the scripts ran. */
			mount.querySelector('.name').value = 'Ada';
			mount.querySelector('[type="checkbox"]').checked = true;
			mount.querySelector('select').selectedIndex = 2;
			mount.querySelector('details').open = true;
			mount.querySelector('.list').scrollTop = 120;

			mount.querySelector('.name').focus();

			Elemenx.Component(name, {$Template: template, Name: '', Agree: false});

			app = Elemenx.Application(unique('SsrHydrate'), {$Component: name, $Mount: '#' + mount.id, $Hydrate: hydrate});

			applications.push(app);

			await waitFor(function () {
				return !mount.hasAttribute('data-elemenx-ssr');
			}, 2000);

			instance = app.$Component();

			results.push({
				Hydrate: hydrate,
				Value: mount.querySelector('.name').value,
				Name: instance.Name,
				Agree: instance.Agree,
				Size: mount.querySelector('select').value,
				Open: mount.querySelector('details').open,
				Scroll: mount.querySelector('.list').scrollTop,
				Focused: document.activeElement === mount.querySelector('.name'),
				Forms: mount.querySelectorAll('form').length
			});
		}

		expect(results).toEqual([
			{Hydrate: true, Value: 'Ada', Name: 'Ada', Agree: true, Size: 'L', Open: true, Scroll: 120, Focused: true, Forms: 1},
			{Hydrate: false, Value: '', Name: '', Agree: false, Size: 'S', Open: false, Scroll: 0, Focused: false, Forms: 1}
		]);
	});

	it('renders no page for a server in a page that is not one (no ElemenxSSR), and asks for a callback', function () {
		var told = null;

		Elemenx.Render(function (error) {
			told = error;
		});

		expect(told.message).toBe('Elemenx.Render renders a page for a server: ElemenxSSR is not set');
		expect(function () {
			Elemenx.Render();
		}).toThrow('Elemenx.Render expects (callback)');
	});

	it('keeps the markup of a server until the page of the first navigation of its Router is there', async function () {
		var name = unique('SsrShell');
		var page = unique('SsrHome');
		var mount = document.createElement('div');
		var app;

		mount.id = unique('ssr-router');

		mount.setAttribute('data-elemenx-ssr', '0.12.7');

		mount.innerHTML = '<p class="served">Home from the server</p>';

		document.getElementById('mount').appendChild(mount);

		Elemenx.Component(page, {$Template: '<p class="home">Home</p>'});
		Elemenx.Component(name, {$Template: '<main *outlet="Content"></main>'});

		app = Elemenx.Application(unique('SsrRouted'), {
			$Component: name,
			$Mount: '#' + mount.id,
			$Router: {Routes: [{Path: '/', Component: page}]}
		});

		applications.push(app);

		await waitFor(function () {
			return mount.querySelector('.home');
		}, 3000);

		await tick(30);

		expect(mount.querySelector('.served')).toBe(null);
		expect(mount.querySelector('.home').closest('main').parentNode.style.display).toBe('');
		expect(mount.hasAttribute('data-elemenx-ssr')).toBe(false);
	});
});
