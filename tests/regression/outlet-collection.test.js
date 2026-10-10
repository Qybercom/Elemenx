import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: current component structural surface', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () { resetDOM(); });

	it('does not expose removed imperative Outlet / Render / RenderAll / List methods', function () {
		var name = unique('CurrentSurface');
		var Component = Elemenx.Component(name, {
			$Template: '<main><div *outlet="body"></div><div #rows></div></main>'
		});
		var component = Component();

		expect(component.Outlet).toBeUndefined();
		expect(component.Render).toBeUndefined();
		expect(component.RenderAll).toBeUndefined();
		expect(component.List).toBeUndefined();

		component.$Destroy();
	});

	it('keeps Ref as the supported public DOM lookup helper', function () {
		var name = unique('CurrentRef');
		var Component = Elemenx.Component(name, {
			$Template: '<main><span #value>ok</span></main>'
		});
		var component = Component();

		expect(component.$Ref('value')).not.toBeNull();
		expect(component.$Ref('value').textContent).toBe('ok');
		expect(component.$Ref('missing')).toBeNull();

		component.$Destroy();
	});
});