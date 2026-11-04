import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/*
 * A graph made into a shader that does not compile: the scene tells it (the event shader, the errors on the blocks of
 * GLSL they are in) and draws what the library has in its place; the editor of the graph marks the blocks.
 */
describe('Contract: the errors of the shaders made of graphs, told by a Scene and marked by a Blueprint', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'Blueprint']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('tells a wind, a ground and a pass of its own that do not compile, draws the ones of the library, and goes on', async function () {
		var ready = null;
		var told = [];
		var warn = vi.spyOn(console, 'warn').mockImplementation(function () {});
		var blueprints = Elemenx.Service('Blueprints');
		var pipeline;
		var component;
		var scene;
		var gl;

		component = Elemenx.Component(unique('BrokenHost'), {
			$Template: '<div style="width: 240px; height: 160px"><Scene Quality="high" [windGraph]="Wind" (ready)="Ready" (shader)="Told"><SceneObject ID="land" Kind="ground" Size="200" Height="1" Water="0" Seed="test" [blueprint]="Land" /><SceneObject ID="oak" Kind="tree" X="3" Y="3" /></Scene></div>',
			Wind: 'void blueprintVertex(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {\n\tworld.y += nothing;\n}',
			Land: 'void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {\n\tcolor = vec3(1.0);\n\tcolor = nowhere;\n}',
			Ready: function (space) {
				ready = space;
			},
			Told: function (event) {
				told.push(event);
			}
		})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 6000);

		scene = ready;

		scene.Scene().Loop.Stop();

		gl = scene.Engine().Renderer.GL;

		/* A pass of the pipeline of its own, broken too. */
		pipeline = scene.PipelineGraph();

		blueprints.Add(pipeline, 'Shader', {id: 'mine', properties: {Graph: 'void main() { outColor = broken; }'}});
		blueprints.Remove(pipeline, pipeline.links.filter(function (link) {
			return link.p2 === 'present-in-Color';
		})[0].id);
		blueprints.Link(pipeline, ['picture', 'Color'], ['mine', 'Color']);
		blueprints.Link(pipeline, ['mine', 'Color'], ['present', 'Color']);

		scene.Pipeline = pipeline;

		await waitFor(function () {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(performance.now() + 1000);

			return told.some(function (one) {
				return one.Kind === 'land';
			});
		}, 10000);

		var kinds = told.map(function (one) {
			return one.Kind + ':' + one.Owner;
		});

		expect(kinds).toContain('wind:WindGraph');
		expect(kinds).toContain('land:land');

		await waitFor(function () {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(performance.now() + 3000);

			return told.some(function (one) {
				return one.Kind === 'pass';
			});
		}, 10000);

		expect(told.map(function (one) {
			return one.Kind + ':' + one.Owner;
		})).toContain('pass:mine');
		expect(told.filter(function (one) {
			return one.Kind === 'land';
		})[0].Errors.length).toBeGreaterThan(0);
		expect(told[0].Message).toMatch(/ERROR/);

		/* The wind of the library in the place of the broken one; told once, the frames go on with no error. */
		expect(scene.WindMade.Function).toContain('0.035');

		scene.Scene().Rest = 0;

		scene.Engine().Frame(performance.now() + 2000);

		expect(gl.getError()).toBe(gl.NO_ERROR);
		expect(told.filter(function (one) {
			return one.Kind === 'land';
		}).length).toBe(1);

		warn.mockRestore();

		expect(blueprints).toBeTruthy();
	}, 60000);

	it('marks on a block of a Blueprint the errors its owner gives it, with their lines', async function () {
		var blueprints = Elemenx.Service('Blueprints');
		var graph = blueprints.Create('material');
		var code = blueprints.Add(graph, 'GLSL', {id: 'mix', properties: {Inputs: 'A: float', Outputs: 'Out: float', Code: 'Out = A;'}});
		var host = Elemenx.Component(unique('MarksHost'), {$Template: '<div style="width: 600px; height: 400px"><Blueprint [value]="Graph" [errors]="Errors" /></div>', Graph: graph, Errors: null})();
		var element;

		owned.push(host);

		document.getElementById('mount').appendChild(host.$Element());

		element = await waitFor(function () {
			return host.$Element().querySelector('[data-id="mix"]');
		}, 4000);

		expect(element.classList.contains('wrong')).toBe(false);

		host.Errors = [{Block: 'mix', Line: 2, Message: "'nothing' : undeclared identifier"}];

		await waitFor(function () {
			return element.classList.contains('wrong');
		}, 2000);

		expect(element.getAttribute('title')).toContain("GLSL 2: 'nothing' : undeclared identifier");
		expect(code.id).toBe('mix');

		host.Errors = null;

		await waitFor(function () {
			return !element.classList.contains('wrong');
		}, 2000);
	});
});
