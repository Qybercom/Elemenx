import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';
import sceneSource from '../../libraries/ElemenxGraphics/components/Scene/Scene.js?raw';
import galaxySource from '../../libraries/ElemenxGraphics/traits/SceneGalaxy/SceneGalaxy.js?raw';
import cosmosSource from '../../libraries/ElemenxGraphics/traits/SceneCosmos/SceneCosmos.js?raw';
import nebulaSource from '../../libraries/ElemenxGraphics/traits/SceneNebula/SceneNebula.js?raw';
import screensSource from '../../libraries/ElemenxGraphics/traits/SceneScreens/SceneScreens.js?raw';
import effectsSource from '../../libraries/ElemenxGraphics/traits/SceneEffects/SceneEffects.js?raw';
import lightingSource from '../../libraries/ElemenxGraphics/traits/SceneLighting/SceneLighting.js?raw';
import cameraSource from '../../libraries/ElemenxGraphics/traits/SceneCamera/SceneCamera.js?raw';
import giantsSource from '../../libraries/ElemenxGraphics/traits/SceneGiants/SceneGiants.js?raw';
import landingSource from '../../libraries/ElemenxGraphics/traits/SceneLanding/SceneLanding.js?raw';
import vehiclesSource from '../../libraries/ElemenxGraphics/traits/SceneVehicles/SceneVehicles.js?raw';
import weaponsSource from '../../libraries/ElemenxGraphics/traits/SceneWeapons/SceneWeapons.js?raw';
import modelsSource from '../../libraries/ElemenxGraphics/services/SceneModels/SceneModels.js?raw';
import planetEditorSource from '../../libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.js?raw';
import combatSource from '../../libraries/ElemenxGaming/components/GameCombat/GameCombat.js?raw';
import strategySource from '../../libraries/ElemenxGaming/components/GameStrategy/GameStrategy.js?raw';

var owned = [];

/*
 * Regression: numbers and kinds an author of a world changes, written in the code (the levels of the graphics in six
 * traits, a giant of gas told by its two names in six places, the rigs of a camera, the roles of the parts of models, the
 * materials a shot hits, the evergreen plants, the plume of a gas, the numbers of the picture), the radius of the Earth ten
 * times, and the same code written more than once (eight readers of a color, three draws of the ground of a body, two bars
 * of health, a shader changed by a replace that told nothing when it found nothing). Each is one table of resources/ or one
 * function now.
 */
describe('Regression: the tables of the Libraries and the code written once', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:ScenePlanet', 'service:ModelRoles', 'service:Renderer', 'service:Vitals', 'service:SceneBlueprints']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('gives each level of the graphics all it draws of one table, the traits reading theirs of it', async function () {
		var quality = Elemenx.Resources('Data', 'ElemenxGraphics/graphics/quality');
		var ready = null;
		var host;
		var graphics;

		expect(Object.keys(quality)).toEqual(['low', 'medium', 'high', 'ultra']);
		['Galaxy', 'Cosmos', 'Nebula', 'Screens', 'Effects', 'Mirrors', 'Shadow'].forEach(function (part) {
			var keys = Object.keys(quality.low[part]).sort();

			['medium', 'high', 'ultra'].forEach(function (level) {
				expect(Object.keys(quality[level][part]).sort(), level + ' ' + part).toEqual(keys);
			});
		});

		host = Elemenx.Component(unique('QualityHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="high" (ready)="Ready"></Scene></div>', Ready: function (space) {
			ready = space;
		}})();

		owned.push(host);

		document.getElementById('mount').appendChild(host.$Element());

		await waitFor(function () {
			return ready;
		}, 8000);

		graphics = ready.Graphics();

		expect(graphics.Level).toBe('high');
		expect(graphics.Galaxy).toEqual(quality.high.Galaxy);
		expect(graphics.Nebula.Steps).toBe(80);

		/* None of the traits keeps a table of its own of the levels. */
		[sceneSource, galaxySource, cosmosSource, nebulaSource, screensSource, effectsSource].forEach(function (source) {
			expect(source).not.toMatch(/\{low: [\d.]+, medium: /);
			expect(source).not.toMatch(/level === 'low' \? \d/);
		});
		expect(lightingSource).not.toContain('0.62 * (1 +');

		/* A color of #rrggbb read once, of no canvas: a wrong one its fallback. */
		expect(ready.Engine().Hex('#ff8000', null)).toEqual([1, 128 / 255, 0]);
		expect(ready.Engine().Hex(' 336699 ', null)).toEqual([0.2, 0.4, 0.6]);
		expect(ready.Engine().Hex('red', [0, 0, 1])).toEqual([0, 0, 1]);
	}, 30000);

	it('tells a giant of gas, the look of a surface and the radius of a planet of tables', function () {
		var planets = Elemenx.Service('ScenePlanet');

		expect(planets.Giant('gas')).toBe(true);
		expect(planets.Giant('ice-giant')).toBe(true);
		expect(planets.Giant('terran')).toBe(false);
		expect(planets.Giant('unknown')).toBe(false);
		expect(planets.SurfaceType('ocean').Shader).toBe(1);
		expect(planets.SurfaceType('lava').Shader).toBe(3);
		expect(planets.Defaults.Radius).toBe(6371);

		[sceneSource, giantsSource, landingSource, vehiclesSource].forEach(function (source) {
			expect(source).not.toContain("=== 'ice-giant'");
			expect(source).not.toContain("!== 'ice-giant'");
		});
		expect(sceneSource).not.toContain('|| 6371');
		expect(planetEditorSource).not.toContain("{Key: 'Radius', Value: 6371}");
	});

	it('reads the rigs of a camera, the roles of parts, the materials a shot hits and the evergreen plants of tables', function () {
		var rigs = Elemenx.Resources('Data', 'ElemenxGraphics/camera/rigs');
		var roles = Elemenx.Resources('Data', 'ElemenxGraphics/models/roles');
		var materials = Elemenx.Resources('Data', 'ElemenxGraphics/weapons/materials');

		expect(Object.keys(rigs)).toEqual(['tripod', 'handheld', 'gimbal', 'steadicam', 'drone']);
		expect(rigs.drone).toMatchObject({Lag: 0.9, Spring: 0.85, Lean: true, Hover: true});
		expect(cameraSource).not.toContain("rig === 'drone'");

		expect(Elemenx.Service('ModelRoles').Catalogue).toEqual(roles);
		expect(Elemenx.Service('ModelRoles').Kind('door').Motion.Angle).toBe(70);
		expect(modelsSource).not.toContain("Kinds: {unit: 'unit'");

		expect(materials.Names[0].Material).toBe('glass');
		expect(weaponsSource).not.toContain('/glass|window');
		expect(sceneSource).not.toContain('/pine|fir|spruce');
		expect(Elemenx.Resources('Data', 'ElemenxGraphics/pipes/fluids').steam.Plume.Effect).toBe('steam');
	});

	it('patches a shader loud, draws a bar of health once and reads a shader graph of the library once', function () {
		var renderer = Elemenx.Service('Renderer');
		var vitals = Elemenx.Service('Vitals');
		var shaders = Elemenx.Service('SceneBlueprints');
		var drawn = [];
		var context = {fillRect: function (x, y, width, height) {
			drawn.push([this.fillStyle, x, y, width, height]);
		}};

		expect(renderer.Patch('void main() { a(); }', 'a();', 'b();')).toBe('void main() { b(); }');
		expect(function () {
			renderer.Patch('void main() {}', 'a();', 'b();');
		}).toThrow('Elemenx Renderer: the shader has no "a();" to patch');

		vitals.Bar(context, 100, 50, 0.5, '#6ad15f', 40, 4);

		expect(drawn).toEqual([['rgba(0, 0, 0, 0.6)', 79, 47, 42, 6], ['#6ad15f', 80, 48, 20, 4]]);
		expect(combatSource).toContain('vitals.Bar(context,');
		expect(strategySource).toContain('vitals.Bar(context,');

		expect(shaders.LibraryShader('ring')).toEqual(shaders.LibraryRing());
	});
});
