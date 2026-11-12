import { test, expect } from '../coverage/playwright.js';

/*
 * The demos of 3D scenes of Advanced, each on a page of its own: /graphics (terrain, space, models...) and /gaming
 * (strategy, racing, orbit, combat), a demo chosen by ?demo=.
 */
var origins = [
	{Name: 'development', URL: 'http://127.0.0.1:4274'},
	{Name: 'production', URL: 'http://127.0.0.1:4276'}
];

function captureErrors (page) {
	var errors = [];

	page.on('pageerror', function (error) {
		errors.push(error.message);
	});

	/* The models kept out of git are asked for with HEAD, and a copy without them answers 404. */
	page.on('console', function (message) {
		if (message.type() === 'error' && !/\/data\/models\/(nyx_common|rigged_elf_woman)\.glb$/.test(message.location().url))
			errors.push(message.text());
	});

	return errors;
}

/* A page of demos with its demo built: its scene is in the page (beside the other workers it may take a while). */
async function ready (page) {
	await expect(page.locator('.demo-frame')).toBeVisible({timeout: 60000});
	await expect(page.locator('.scene-demo .elemenx-scene').first()).toBeVisible({timeout: 60000});
}

/* Opens a demo of a page of demos: /graphics?demo=Space, /gaming?demo=World. */
async function demo (page, origin, where, name) {
	await page.goto(origin.URL + '/' + where + '?demo=' + name);

	await ready(page);
}

for (const origin of origins) {
	test.describe('Demos of Graphics and Gaming (' + origin.Name + ')', function () {
		test('a game world draws its land, selects the units of its team, orders them along their ways, recruits by code and hides the unseen in the fog', async function ({ page }) {
			var errors = captureErrors(page);
			var game;
			var world;
			var header;
			var box;
			var ground;

			await page.setViewportSize({width: 1280, height: 900});

			await demo(page, origin, 'gaming', 'World');

			game = page.locator('.scene-demo');
			world = game.locator('.elemenx-scene');
			header = game.locator('.scene-demo-status');

			await world.scrollIntoViewIfNeeded();

			/* The land is drawn in the middle of the view. */
			ground = async function () {
				return world.evaluate(function (node) {
					var instance = Elemenx.Instance(node);
					var renderer = instance.Engine().Renderer;
					var gl = renderer.GL;
					var data = new Uint8Array(4);

					instance.Engine().Frame(performance.now());

					gl.readPixels(Math.round(renderer.Width / 2), Math.round(renderer.Height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);

					return data[0] + data[1] + data[2];
				});
			};

			await expect.poll(ground).toBeGreaterThan(90);

			/* Ctrl+A: the units of the team; Escape: none. */
			await world.focus();

			await page.keyboard.press('Control+a');

			await expect(header).toContainText('5 selected: archer-1, archer-2, archer-3, knight-1, knight-2');

			await page.keyboard.press('Escape');

			await expect(header).toContainText('Nothing selected');

			/* A frame drawn over the view: the units in it. */
			box = await world.locator('.elemenx-scene-canvas').boundingBox();

			await page.mouse.move(box.x + 4, box.y + 4);
			await page.mouse.down();
			await page.mouse.move(box.x + box.width - 4, box.y + box.height - 4, {steps: 6});
			await page.mouse.up();

			await expect(header).toContainText('5 selected');

			/* A right click on the land: the order, each to its own spot. */
			await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.7, {button: 'right'});

			await expect(header).toContainText(/Move to -?\d+, -?\d+: 5 units/);

			/* A unit of the code: added at the barracks, sent on its way. */
			await game.getByRole('button', {name: 'Recruit'}).click();

			await expect(header).toContainText('Recruited recruit-1');

			/* The fog: the raiders far away, out of sight, are hidden. */
			await game.locator('.elemenx-toggle').filter({hasText: 'Fog of war'}).click();

			await expect.poll(async function () {
				return world.evaluate(function (node) {
					return Elemenx.Instance(node).Scene().Objects['raider-1'].Hidden;
				});
			}).toBe(true);

			expect(errors).toEqual([]);
		});

		test('space draws the Sun and its planets in 3D, selects a body by its name, flies to it, sends a fleet to Mars and makes a system of a seed', async function ({ page }) {
			var errors = captureErrors(page);
			var space;
			var bodies;
			var sun;

			await page.setViewportSize({width: 1280, height: 900});

			await demo(page, origin, 'graphics', 'Space');

			bodies = page.locator('.scene-demo');
			space = bodies.locator('.elemenx-scene');

			await space.scrollIntoViewIfNeeded();

			/* A name of every body but the belts: the Sun, 8 planets, 9 moons, 2 stations and 2 fleets. */
			await expect(space.locator('.elemenx-scene-label')).toHaveCount(22);
			await expect(space.locator('.elemenx-scene-fallback')).toHaveCount(0);

			/* The Sun is drawn bright in the middle of a dark sky. */
			sun = async function (id) {
				return space.evaluate(function (node, star) {
					var instance = Elemenx.Instance(node);
					var renderer = instance.Engine().Renderer;
					var gl = renderer.GL;
					var spot = instance.ToScreen(star);
					var at = function (x, y) {
						var data = new Uint8Array(4);

						gl.readPixels(Math.round(x * renderer.Ratio), Math.round(renderer.Height - y * renderer.Ratio), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);

						return data[0] + data[1] + data[2];
					};

					instance.Engine().Frame(performance.now());

					return {Sun: at(spot.X, spot.Y), Sky: at(3, 3)};
				}, id || 'sun');
			};

			await expect.poll(async function () {
				return (await sun()).Sun;
			}).toBeGreaterThan(500);

			/* Without its backdrop of a seed the sky is dark. */
			await space.evaluate(function (node) {
				Elemenx.Instance(node).Cosmos = '';
			});

			await expect.poll(async function () {
				return (await sun()).Sky;
			}).toBeLessThan(60);

			/* Its name selects the Earth: the card of its numbers; then the view flies to it. */
			await space.locator('.elemenx-scene-label[data-id="earth"]').click();

			await expect(space.locator('.elemenx-scene-card')).toContainText('Earth-like planet');
			await expect(space.locator('.elemenx-scene-card')).toContainText('Habitable zone');
			await expect(bodies.locator('.scene-demo-status')).toContainText('Selected: Earth');

			await space.getByRole('button', {name: 'Fly to it'}).click();

			await expect(bodies.locator('.scene-demo-status')).toContainText('Flying to Earth');

			/* Down to its surface and back: its sky over its ground, then space again. */
			await space.getByRole('button', {name: 'Land'}).click();

			await expect(space.getByRole('button', {name: 'Take off'})).toBeVisible();

			await expect.poll(async function () {
				return space.evaluate(function (node) {
					return Object.keys(Elemenx.Instance(node).Scene().Surface.Nodes).length;
				});
			}).toBeGreaterThan(10);

			await space.getByRole('button', {name: 'Take off'}).click();

			await expect(space.getByRole('button', {name: 'Take off'})).toHaveCount(0, {timeout: 15000});

			await page.keyboard.press('Escape');

			/* The first fleet to Mars: it arrives a few days of the system later. */
			await bodies.getByRole('button', {name: 'Fleet to Mars'}).click();

			await expect(bodies.locator('.scene-demo-status')).toContainText('First fleet: to Mars');
			await expect(bodies.locator('.scene-demo-status')).toContainText('Arrived: First fleet at Mars', {timeout: 15000});

			/* A system of a seed: a star of its own, its planets and their moons. */
			await bodies.locator('.elemenx-check-label', {hasText: 'Of a seed'}).click();

			await expect(space.locator('.elemenx-scene-label[data-kind="star"]')).toHaveCount(1);
			await expect(space.locator('.elemenx-scene-label[data-id="planet-b"]')).toHaveCount(1);
			await expect(bodies.locator('.ui-kit-space-hud')).toContainText('Seed kepler-186');

			/* At its real size, the star is still drawn: a few pixels at least. */
			await bodies.locator('.elemenx-toggle', {hasText: 'Real scale'}).click();

			await expect.poll(async function () {
				return (await sun('star')).Sun;
			}).toBeGreaterThan(300);

			expect(errors).toEqual([]);
		});

		test('models stand in their shadows, play their clips, march and turn their shadows off', async function ({ page }) {
			var errors = captureErrors(page);
			var models;
			var scene;
			var note;

			await page.setViewportSize({width: 1280, height: 900});

			await demo(page, origin, 'graphics', 'Models');

			models = page.locator('.scene-demo');
			scene = models.locator('.elemenx-scene');
			note = models.locator('.scene-demo-status');

			await scene.scrollIntoViewIfNeeded();

			/* The units and the buildings that can be selected are named; the plants are not. */
			await expect.poll(async function () {
				return scene.locator('.elemenx-scene-label').count();
			}).toBeGreaterThan(20);

			await expect.poll(async function () {
				return scene.evaluate(function (node) {
					return Elemenx.Instance(node).Objects().length;
				});
			}).toBeGreaterThan(30);

			/* A model of a file comes by the same attribute, with the clips of the file. */
			await expect.poll(async function () {
				return scene.evaluate(function (node) {
					var object = Elemenx.Instance(node).Scene().Objects['from-file'];

					return object && object.Clip ? object.Clip.Name : '';
				});
			}).toBe('Bend');

			await models.getByRole('button', {name: 'Attack'}).click();

			await expect(note).toContainText(/\d+ playing attack/);

			await models.getByRole('button', {name: 'Fall'}).click();

			await expect(note).toContainText(/\d+ playing die/);

			await models.getByRole('button', {name: 'Stand'}).click();

			await expect(note).toContainText(/\d+ playing idle/);

			await models.getByRole('button', {name: 'March'}).click();

			await expect(note).toContainText(/\d+ marching/);

			expect(await scene.evaluate(function (node) {
				return Elemenx.Instance(node).Shadows;
			})).not.toBe(false);

			await models.locator('.elemenx-toggle', {hasText: 'Shadows'}).click();

			await expect.poll(async function () {
				return scene.evaluate(function (node) {
					return Elemenx.Instance(node).Shadows;
				});
			}).toBe(false);

			expect(errors).toEqual([]);
		});

		test('the quality and the biome of a scene are chosen in their menus, and the choice stays', async function ({ page }) {
			var errors = captureErrors(page);
			var menus;

			await demo(page, origin, 'graphics', 'Terrain');

			menus = page.locator('.scene-demo').locator('.elemenx-select-trigger');

			await menus.nth(2).click();
			await page.getByRole('option', {name: 'Medium'}).click();

			await expect(menus.nth(2)).toContainText('Medium');
			await expect.poll(function () {
				return page.locator('.scene-demo').locator('.elemenx-scene').evaluate(function (node) {
					return Elemenx.Instance(node).Graphics().Level;
				});
			}).toBe('medium');

			await menus.nth(0).click();
			await page.getByRole('option', {name: 'Taiga'}).click();

			await expect(menus.nth(0)).toContainText('Taiga');

			await page.reload();

			await ready(page);

			await expect(page.locator('.scene-demo').locator('.elemenx-select-trigger').nth(2)).toContainText('Medium');

			expect(errors).toEqual([]);
		});

		test('terrain draws a ground with its trees and houses, its units walk to the village round what blocks them, and the game saves', async function ({ page }) {
			var errors = captureErrors(page);
			var terrain;
			var scene;

			await page.setViewportSize({width: 1280, height: 900});

			await demo(page, origin, 'graphics', 'Terrain');

			terrain = page.locator('.scene-demo');
			scene = terrain.locator('.elemenx-scene');

			await scene.scrollIntoViewIfNeeded();

			/* The names of what can be selected: three units and three houses. */
			await expect.poll(async function () {
				return scene.locator('.elemenx-scene-label').count();
			}).toBeGreaterThanOrEqual(6);

			/* The ground is drawn: the middle of the view is no sky of the color of the page. */
			await expect.poll(async function () {
				return scene.evaluate(function (node) {
					var instance = Elemenx.Instance(node);
					var renderer = instance.Engine().Renderer;
					var gl = renderer.GL;
					var data = new Uint8Array(4);

					instance.Engine().Frame(performance.now());

					gl.readPixels(Math.round(renderer.Width / 2), Math.round(renderer.Height / 3), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);

					return data[1] > data[2] && data[1] > 40 ? 'ground' : 'sky';
				});
			}).toBe('ground');

			await terrain.getByRole('button', {name: 'All to the village'}).click();

			await expect(terrain.locator('.scene-demo-status')).toContainText('3 going to the village');
			await expect(terrain.locator('.scene-demo-status')).toContainText('arrived at', {timeout: 45000});

			/* All three have arrived: the note of one that comes later would take the place of the one of the save. */
			await expect.poll(async function () {
				return scene.evaluate(function (node) {
					return Object.keys(Elemenx.Instance(node).Scene().Ways).length;
				});
			}, {timeout: 30000}).toBe(0);

			await terrain.getByRole('button', {name: 'Save'}).click();

			await expect(terrain.locator('.scene-demo-status')).toContainText('Saved:');

			await terrain.getByRole('button', {name: 'Load'}).click();

			await expect(terrain.locator('.scene-demo-status')).toContainText('Loaded');

			await expect.poll(async function () {
				return scene.locator('.elemenx-scene-label').count();
			}).toBeGreaterThanOrEqual(6);

			expect(errors).toEqual([]);
		});
	});
}
