import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';

describe('Regression: Component Style / StyleURL', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () { resetDOM(); });

	it('Style installs component CSS once for all instances', function () {
		var name = unique('InlineStyle');
		var css = '.inline-style-test { display: block; }';
		var factory = Elemenx.Component(name, {$Template: '<div class="inline-style-test"></div>', $Style: css});
		var first = factory();
		var second = factory();

		document.getElementById('mount').appendChild(first.$Element());
		document.getElementById('mount').appendChild(second.$Element());

		var styles = Array.prototype.filter.call(document.querySelectorAll('style'), function (style) {
			return style.textContent === css;
		});

		expect(styles.length).toBe(1);
		expect(styles[0].hasAttribute('data-elemenx-style')).toBe(false);

		first.$Destroy();
		second.$Destroy();
	});

	it('StyleURL loads CSS and resolves relative to the component definition URL', async function () {
		var name = unique('RemoteStyle');
		var factory = Elemenx.Component(name, {
			$Template: '<div id="remote-style-component"></div>',
			$StyleURL: 'Component.css',
			$DefinitionURL: '/tests/public/component-style/Component.js'
		});
		var component = factory();

		document.getElementById('mount').appendChild(component.$Element());

		expect(await waitFor(function () {return document.getElementById('remote-style-component');}, 1000)).not.toBe(false);

		var styles = Array.prototype.filter.call(document.querySelectorAll('style'), function (item) {
			return item.textContent.indexOf('.remote-style-test') !== -1;
		});

		expect(styles.length).toBe(1);
		expect(styles[0].hasAttribute('data-elemenx-style')).toBe(false);
		expect(factory.Definition.$StyleURL).toBe('/tests/public/component-style/Component.css');

		component.$Destroy();
	});

	/*
	 * Regression: every instance of a component of a StyleURL placed its stylesheet once more (thousands on a large page,
	 * and each one restyled the whole page: a long pause before a dialog opened).
	 */
	it('StyleURL places the CSS once, for the first instance and for every later one', async function () {
		var name = unique('RemoteStyleMany');
		var factory = Elemenx.Component(name, {
			$Template: '<div class="remote-style-many"></div>',
			$StyleURL: 'Component.css',
			$DefinitionURL: '/tests/public/component-style/Component.js'
		});
		var instances = [];
		var i = 0;
		var before;
		var count = function () {
			return Array.prototype.filter.call(document.querySelectorAll('style'), function (item) {
				return item.textContent.indexOf('.remote-style-test') !== -1;
			}).length;
		};

		before = count();

		while (i < 5) {
			instances.push(factory());

			document.getElementById('mount').appendChild(instances[i].$Element());

			i++;
		}

		expect(await waitFor(function () {
			return document.querySelectorAll('.remote-style-many').length === 5;
		}, 1000)).not.toBe(false);

		expect(count()).toBe(before + 1);

		instances.push(factory());

		document.getElementById('mount').appendChild(instances[5].$Element());

		await waitFor(function () {
			return document.querySelectorAll('.remote-style-many').length === 6;
		}, 1000);

		expect(count()).toBe(before + 1);

		instances.forEach(function (instance) {
			instance.$Destroy();
		});
	});
});