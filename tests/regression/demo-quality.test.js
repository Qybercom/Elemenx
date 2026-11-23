import { describe, expect, it } from 'vitest';
import qualitySource from '../../examples/Advanced/application/services/DemoQuality.js?raw';
import frameSource from '../../examples/Advanced/application/components/DemoFrame/DemoFrame.js?raw';
import traitSource from '../../examples/Advanced/application/traits/SceneDemo/SceneDemo.js?raw';

/* The definition a source gives (Elemenx.Service, Component or Trait caught). */
function definition (source) {
	var caught = null;

	function catcher (name, made) {
		caught = made;
	}

	new Function('Elemenx', source)({Service: catcher, Component: catcher, Trait: catcher});

	return caught;
}

/*
 * Regression: the quality of the scenes of the demos was kept and told by the frame of the page (DemoFrame) and by the demos
 * (SceneDemo) each with a code and a list of its own. One service now (DemoQuality): both read it and choose by it.
 */
describe('Regression: one quality of the scenes of the demos (DemoQuality)', function () {
	it('keeps the quality chosen, tells it to the page, and is what the frame and the demos read', function () {
		var service = definition(qualitySource);
		var told = [];

		function heard (event) {
			told.push(event.detail);
		}

		window.addEventListener('scene-demo-quality', heard);

		try {
			service.Choose('high');

			expect(service.Read()).toBe('high');
			expect(told).toEqual(['high']);
			expect(service.List.map(function (one) {
				return one.Value;
			})).toEqual(['auto', 'low', 'medium', 'high', 'ultra']);
		}
		finally {
			window.removeEventListener('scene-demo-quality', heard);
			window.localStorage.removeItem(service.Key);
		}

		expect(frameSource).not.toContain('ui-kit-quality');
		expect(traitSource).not.toContain('ui-kit-quality');
		expect(definition(frameSource).QualityChosen.toString()).toContain('DemoQuality');
		expect(definition(traitSource).SceneQualityChosen.toString()).toContain('DemoQuality');
	});
});
