import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: $ system namespace', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () { resetDOM(); });

	it('keeps ordinary application names free while framework APIs stay under $', function () {
		var name = unique('NamespaceComponent');

		Elemenx.Component(name, {
			$Template: '<div>{{Title}}|{{Template}}|{{Value}}</div>',
			Title: 'user-title',
			Template: 'user-template',
			Value: 'A',
			Application: function () { return 'user-application'; },
			Update: function () { this.Value = 'user-update'; }
		});

		var component = Elemenx.Component(name)();

		document.getElementById('mount').appendChild(component.$Element());

		expect(component.Title).toBe('user-title');
		expect(component.Template).toBe('user-template');
		expect(component.Application()).toBe('user-application');
		expect(component.$Application()).toBeNull();

		component.Update();

		expect(component.Value).toBe('user-update');

		component.$Update({Value: 'framework-update'});

		expect(component.Value).toBe('framework-update');
		expect(component.$Element().textContent).toBe('user-title|user-template|framework-update');

		component.$Destroy();
	});

	it('reserves every $ value name for Elemenx', function () {
		var name = unique('NamespaceReserved');

		Elemenx.Component(name, {$Template: '<div></div>'});

		var component = Elemenx.Component(name)();

		expect(function () { component.$Update({$Custom: 'value'}); }).toThrow(/reserved \$ namespace/);

		component.$Destroy();
	});
});