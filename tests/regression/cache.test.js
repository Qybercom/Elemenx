import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, mount, resetDOM, tick, unique, waitFor } from '../setup.js';

/* Elemenx.Cache: idle definitions unloaded, instances asleep instead of destroyed (keep-alive). */
describe('Contract: Elemenx.Cache', function () {
	var owned;

	function off () {
		Elemenx.Cache({Definitions: {MaxAge: 0, Max: 0}, Instances: {Scope: 'none', MaxAge: 0, Max: 0}});
	}

	/* A parent with a child under *if (and the attributes given), and a counter of the lives of the child. */
	function parent (attributes, child) {
		var name = unique('CacheParent');
		var childName = unique('CacheChild');
		var life = {Created: 0, Destroyed: 0, Slept: 0, Woken: 0};
		var factory;
		var component;

		Elemenx.Component(childName, Object.assign({
			$Template: '<div class="cache-child"><input class="cache-text"><input class="cache-secret" type="password"></div>',
			$OnCreate: function () {
				life.Created++;
			},
			$OnDestroy: function () {
				life.Destroyed++;
			},
			$OnSleep: function () {
				life.Slept++;
			},
			$OnWake: function () {
				life.Woken++;
			}
		}, child || {}));

		factory = Elemenx.Component(name, {
			$Template: '<section><' + childName + ' *if="Shown" ' + (attributes || '') + ' /></section>',
			Shown: true
		});

		component = factory();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		return {Component: component, Life: life};
	}

	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () {
		resetDOM();

		owned = [];
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		off();

		Elemenx.Cache.Clear();
	});

	it('is off by default: a component that leaves is destroyed, *keep or not', async function () {
		var test = parent('*keep');

		expect(Elemenx.Cache()).toEqual({Definitions: {MaxAge: 0, Max: 0}, Instances: {Scope: 'none', MaxAge: 0, Max: 0}});

		test.Component.Shown = false;

		await tick();

		test.Component.Shown = true;

		await tick();

		expect([test.Life.Created, test.Life.Destroyed, test.Life.Slept]).toEqual([2, 1, 0]);
		expect(Elemenx.Cache.Stats().Instances).toEqual([]);
	});

	it('checks its policy and keeps the keys not given', function () {
		expect(function () { Elemenx.Cache('all'); }).toThrow('Elemenx.Cache expects a policy object');
		expect(function () { Elemenx.Cache({Pages: {}}); }).toThrow('Elemenx.Cache does not know Pages');
		expect(function () { Elemenx.Cache({Instances: {Scope: 'some'}}); }).toThrow('Elemenx.Cache expects Instances.Scope to be none, marked, router or all');
		expect(function () { Elemenx.Cache({Definitions: {MaxAge: -1}}); }).toThrow('Elemenx.Cache expects Definitions.MaxAge to be a number of 0 or more');
		expect(function () { Elemenx.Cache({Definitions: {Scope: 'all'}}); }).toThrow('Elemenx.Cache does not know Definitions.Scope');

		expect(Elemenx.Cache({Instances: {Scope: 'marked'}})).toEqual({Definitions: {MaxAge: 0, Max: 0}, Instances: {Scope: 'marked', MaxAge: 0, Max: 0}});
		expect(Elemenx.Cache({Instances: {Max: 3}}).Instances).toEqual({Scope: 'marked', MaxAge: 0, Max: 3});
	});

	it('marked: a child with *keep sleeps out of the page and wakes as it was, its secrets emptied', async function () {
		var test;
		var first;

		Elemenx.Cache({Instances: {Scope: 'marked'}});

		test = parent('*keep');
		first = document.querySelector('.cache-child');

		first.querySelector('.cache-text').value = 'kept';
		first.querySelector('.cache-secret').value = 'secret';

		test.Component.Shown = false;

		await tick();

		expect(document.querySelector('.cache-child')).toBeNull();
		expect([test.Life.Destroyed, test.Life.Slept, first.querySelector('.cache-secret').value]).toEqual([0, 1, '']);
		expect(Elemenx.Cache.Stats().Instances.length).toBe(1);

		test.Component.Shown = true;

		await tick();

		expect(document.querySelector('.cache-child')).toBe(first);
		expect([test.Life.Created, test.Life.Woken, first.querySelector('.cache-text').value]).toEqual([1, 1, 'kept']);
		expect(Elemenx.Cache.Stats().Instances).toEqual([]);
	});

	it('$OnSleep and $OnWake run untracked: an event to the owner that changes its state does not loop its *if', async function () {
		var name = unique('CacheLogParent');
		var childName = unique('CacheLogChild');
		var errors = [];
		var component;

		function capture (event) {
			errors.push(event.message);

			event.preventDefault();
		}

		Elemenx.Cache({Instances: {Scope: 'marked'}});

		Elemenx.Component(childName, {
			$Template: '<p class="cache-log-child">child</p>',
			$OnSleep: function () {
				this.$Emit('life', 'sleep');
			},
			$OnWake: function () {
				this.$Emit('life', 'wake');
			}
		});

		component = Elemenx.Component(name, {
			$Template: '<section><div *if="Shown" *keep><' + childName + ' (life)="Logged" /></div><i class="cache-log">{{Log.join(",")}}</i></section>',
			Shown: true,
			Log: [],
			Logged: function (line) {
				this.Log = this.Log.concat([line]);
			}
		})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		window.addEventListener('error', capture);

		try {
			component.Shown = false;

			await tick();

			component.Shown = true;

			await tick();
		}
		finally {
			window.removeEventListener('error', capture);
		}

		expect(errors).toEqual([]);
		expect(document.querySelector('.cache-log').textContent).toBe('sleep,wake');
		expect(document.querySelectorAll('.cache-log-child').length).toBe(1);
	});

	it('marked: $KeepAlive brings a component in; *keep="false" and $KeepAlive: false keep one out of every scope', async function () {
		var kept;
		var refused;
		var definition;

		Elemenx.Cache({Instances: {Scope: 'marked'}});

		kept = parent('', {$KeepAlive: true});
		kept.Component.Shown = false;

		await tick();

		expect([kept.Life.Slept, kept.Life.Destroyed]).toEqual([1, 0]);

		Elemenx.Cache({Instances: {Scope: 'all'}});

		refused = parent('*keep="false"');
		refused.Component.Shown = false;

		await tick();

		definition = parent('', {$KeepAlive: false});
		definition.Component.Shown = false;

		await tick();

		expect([refused.Life.Slept, refused.Life.Destroyed, definition.Life.Slept, definition.Life.Destroyed]).toEqual([0, 1, 0, 1]);
	});

	it('all: a plain element under *if sleeps too, and the components and directives inside it', async function () {
		var name = unique('CacheTree');
		var inner = unique('CacheInner');
		var directive = unique('cachemark');
		var calls = [];
		var component;
		var section;

		Elemenx.Cache({Instances: {Scope: 'all'}});

		Elemenx.Directive(directive, {
			$OnSleep: function () { calls.push('directive sleep'); },
			$OnWake: function () { calls.push('directive wake'); }
		});

		Elemenx.Component(inner, {
			$Template: '<b>inner</b>',
			$OnSleep: function () { calls.push('inner sleep'); },
			$OnWake: function () { calls.push('inner wake'); }
		});

		component = Elemenx.Component(name, {
			$Template: '<main><div class="cache-tree" *if="Shown"><span *' + directive + '>mark</span><' + inner + ' /></div></main>',
			Shown: true
		})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await tick();

		section = document.querySelector('.cache-tree');
		component.Shown = false;

		await tick();

		component.Shown = true;

		await tick();

		expect(document.querySelector('.cache-tree')).toBe(section);
		expect(calls.sort()).toEqual(['directive sleep', 'directive wake', 'inner sleep', 'inner wake']);
	});

	it('the items of a collection never sleep: *keep needs a conditional host', function () {
		var name = unique('CacheFor');

		expect(function () {
			Elemenx.Component(name, {$Template: '<ul><li *for="item of Items" *keep>{{item}}</li></ul>', Items: [1]})();
		}).toThrow('*keep');
	});

	it('Max and MaxAge destroy the instances asleep longest; a parent that goes destroys its children asleep', async function () {
		var first;
		var second;
		var aged;
		var dropped;

		Elemenx.Cache({Instances: {Scope: 'marked', Max: 1}});

		first = parent('*keep');
		second = parent('*keep');

		first.Component.Shown = false;

		await tick();

		second.Component.Shown = false;

		await tick();

		expect([first.Life.Destroyed, second.Life.Destroyed]).toEqual([1, 0]);

		first.Component.Shown = true;

		await tick();

		expect(first.Life.Created).toBe(2);

		Elemenx.Cache({Instances: {Max: 0, MaxAge: 150}});

		aged = parent('*keep');
		aged.Component.Shown = false;

		await tick();

		/* MaxAge reaches every instance asleep, the one asleep since before as well. */
		expect(await waitFor(function () { return aged.Life.Destroyed === 1 && second.Life.Destroyed === 1; }, 2000)).toBe(true);

		Elemenx.Cache({Instances: {MaxAge: 0}});

		dropped = parent('*keep');
		dropped.Component.Shown = false;

		await tick();

		owned.splice(owned.indexOf(dropped.Component), 1);

		dropped.Component.$Destroy();

		expect(dropped.Life.Destroyed).toBe(1);
		expect(Elemenx.Cache.Stats().Instances).toEqual([]);
	});

	it('router: a page that leaves sleeps under its route and parameters and wakes with the route of now', async function () {
		var root = unique('CacheRouterRoot');
		var page = unique('CacheRouterPage');
		var other = unique('CacheRouterOther');
		var made = 0;
		var woken = 0;
		var app;
		var router;

		history.replaceState({}, '', '/');

		mount();

		Elemenx.Cache({Instances: {Scope: 'router'}});

		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main>'});
		Elemenx.Component(page, {
			$Template: '<div class="cache-page">{{$Params.id}}|{{$Query.q}}</div>',
			$OnCreate: function () { made++; },
			$OnWake: function () { woken++; }
		});
		Elemenx.Component(other, {$Template: '<div class="cache-other">other</div>'});

		app = Elemenx.Application(unique('CacheRouterApp'), {$Component: root, $Mount: '#mount'});
		router = Elemenx.Router({
			Root: app.$Component(),
			Routes: [
				{Path: '/cache/:id', Component: page},
				{Path: '/elsewhere', Component: other}
			]
		});

		router.Start();
		router.Go('/cache/1?q=a');

		await tick();

		router.Go('/elsewhere');

		await tick();

		router.Go('/cache/1?q=b');

		await tick();

		expect([made, woken, document.querySelector('.cache-page').textContent]).toEqual([1, 1, '1|b']);

		router.Go('/elsewhere');

		await tick();

		router.Go('/cache/2');

		await tick();

		expect([made, document.querySelector('.cache-page').textContent]).toEqual([2, '2|']);

		router.Destroy();

		app.$Destroy();

		expect(Elemenx.Cache.Stats().Instances).toEqual([]);
	});

	it('Definitions: an idle definition unloads its stylesheet, and its next instance places it again', async function () {
		var name = unique('CacheStyled');
		var css = '.cache-styled { color: rgb(1, 2, 3); }';
		var factory = Elemenx.Component(name, {$Template: '<p class="cache-styled">styled</p>', $Style: css});
		var styles = function () {
			return Array.prototype.filter.call(document.querySelectorAll('style'), function (style) {
				return style.textContent === css;
			}).length;
		};
		var entry = function () {
			return Elemenx.Cache.Stats().Definitions.filter(function (item) {
				return item.Name === name;
			})[0];
		};
		var component = factory();

		document.getElementById('mount').appendChild(component.$Element());

		expect([styles(), entry().Instances, entry().Cached]).toEqual([1, 1, true]);

		component.$Destroy();

		Elemenx.Cache({Definitions: {MaxAge: 100}});

		expect(await waitFor(function () { return styles() === 0; }, 2000)).toBe(true);
		expect(entry().Cached).toBe(false);

		component = factory();

		document.getElementById('mount').appendChild(component.$Element());

		expect([styles(), entry().Cached, getComputedStyle(component.$Element()).color]).toEqual([1, true, 'rgb(1, 2, 3)']);

		component.$Destroy();
	});

	it('Definitions: a remote definition forgets its template and style and loads them again', async function () {
		var name = unique('CacheRemote');
		var factory = Elemenx.Component(name, {
			$Template: '<div class="cache-remote">remote</div>',
			$StyleURL: 'Component.css',
			$DefinitionURL: '/tests/public/component-style/Component.js'
		});
		var styles = function () {
			return Array.prototype.filter.call(document.querySelectorAll('style'), function (style) {
				return style.textContent.indexOf('.remote-style-test') !== -1;
			}).length;
		};
		var component = factory();

		document.getElementById('mount').appendChild(component.$Element());

		expect(await waitFor(function () { return document.querySelector('.cache-remote'); }, 2000)).not.toBe(false);

		component.$Destroy();

		Elemenx.Cache.Clear();

		expect([styles(), factory.Definition.$Style]).toEqual([0, undefined]);

		component = factory();

		document.getElementById('mount').appendChild(component.$Element());

		expect(await waitFor(function () { return styles() === 1; }, 2000)).toBe(true);

		component.$Destroy();
	});
});
