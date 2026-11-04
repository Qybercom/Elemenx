import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';

describe('Services', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	it('keeps application-scoped service instances isolated', function () {
		Elemenx.Service('PackageStore', {
			Value: 0,
			Inc: function () {
				this.Value++;

				return this.Value;
			}
		});

		Elemenx.Component('PackageAppA', {$Template: '<div>A</div>'});
		Elemenx.Component('PackageAppB', {$Template: '<div>B</div>'});

		document.body.innerHTML = '<div id="a"></div><div id="b"></div>';

		var a = Elemenx.Application('PackageA', {$Component: 'PackageAppA', $Mount: '#a'});
		var b = Elemenx.Application('PackageB', {$Component: 'PackageAppB', $Mount: '#b'});
		var sa = a.$Service('PackageStore');
		var sb = b.$Service('PackageStore');

		expect(sa.Inc()).toBe(1);
		expect(sa.Inc()).toBe(2);
		expect(sb.Inc()).toBe(1);
		expect(sa.$Application()).toBe(a);
		expect(sb.$Application()).toBe(b);

		a.$Destroy();
		b.$Destroy();
	});

	/*
	 * A registry (a Service others add to) knows of what is declared to it by $Provides, and makes the Service that
	 * provides a name only when that name is wanted, in the Application that wants it.
	 */
	it('makes the Service that declares in $Provides what a registry wants, when it is wanted, in the same Application', function () {
		var made = [];

		Elemenx.Service('ProvidedRegistry', {
			$OnCreate: function () {
				this.Known = {};
			},

			Add: function (name, value) {
				this.Known[name] = value;
			},

			Get: function (name) {
				if (!this.Known[name])
					this.$Provide('Things', name);

				return this.Known[name] || null;
			},

			All: function () {
				this.$Provide('Things');

				return Object.keys(this.Known).sort();
			}
		});

		Elemenx.Service('ProvidedRust', {
			$Provides: {ProvidedRegistry: {Things: ['rust', 'patina']}},

			$OnCreate: function () {
				var registry = this.$Service('ProvidedRegistry');

				made.push(this.$Application() ? this.$Application().$Name : 'page');

				registry.Add('rust', 'red');
				registry.Add('patina', 'green');

				/* Listing from inside its own making makes it no second time. */
				registry.All();
			}
		});

		Elemenx.Service('ProvidedAny', {
			$Provides: {ProvidedRegistry: {Things: '*', Other: ['x']}},

			$OnCreate: function () {
				made.push('any');

				this.$Service('ProvidedRegistry').Add('wood', 'brown');
			}
		});

		var app = Elemenx.Application('ProvidedApp', {});
		var registry = app.$Service('ProvidedRegistry');

		expect(made).toEqual([]);
		expect(registry.Get('rust')).toBe('red');
		expect(made.indexOf('any')).not.toBe(-1);
		expect(made.length).toBe(2);
		expect(registry.All()).toEqual(['patina', 'rust', 'wood']);
		expect(made.length).toBe(2);

		/* Another Application has registries of its own: its providers are made again for it. */
		expect(Elemenx.Application('ProvidedOther', {}).$Service('ProvidedRegistry').Get('patina')).toBe('green');
		expect(made.length).toBe(4);

		/* The names of the providers; none for what no one provides. */
		expect(registry.$Provide('Things', 'rust')).toEqual(['ProvidedRust', 'ProvidedAny']);
		expect(registry.$Provide('Other')).toEqual(['ProvidedAny']);
		expect(registry.$Provide('Nothing')).toEqual([]);
		expect(registry.Get('stone')).toBe(null);
	});

	/* $Providers names the Services that declare a name to a registry and makes none of them; $Provide makes them. */
	it('names the providers of a registry with $Providers and makes none of them', function () {
		var made = [];

		Elemenx.Service('ListedRegistry', {});
		Elemenx.Service('ListedOne', {
			$Provides: {ListedRegistry: {Things: ['one']}},

			$OnCreate: function () {
				made.push('one');
			}
		});
		Elemenx.Service('ListedAny', {
			$Provides: {ListedRegistry: {Things: '*'}},

			$OnCreate: function () {
				made.push('any');
			}
		});

		var registry = Elemenx.Application('ListedApp', {}).$Service('ListedRegistry');

		expect(registry.$Providers('Things')).toEqual(['ListedOne', 'ListedAny']);
		expect(registry.$Providers('Things', 'two')).toEqual(['ListedAny']);
		expect(registry.$Providers('Nothing')).toEqual([]);
		expect(made).toEqual([]);

		expect(registry.$Provide('Things', 'one')).toEqual(['ListedOne', 'ListedAny']);
		expect(made).toEqual(['one', 'any']);
	});
});