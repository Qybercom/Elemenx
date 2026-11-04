import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';
import packagerSource from '../../examples/GameEditor/application/services/GamePackager.js?raw';

var owned = [];

/* The GamePackager of the Game editor, as the example defines it: its methods, with the Services of the page. */
function packager () {
	var definition = null;

	new Function('Elemenx', packagerSource)({Service: function (name, value) {
		definition = value;
	}});

	definition.$Service = function (name) {
		return Elemenx.Service(name);
	};

	return definition;
}

/* A game: a model of shapes placed on a ground, and a walker marked Hero. */
function game () {
	return {
		Version: 1,
		Name: 'Little world',
		Scene: {Version: 1, Name: '', Setting: 'ground', Scene: {Version: 1, Seed: '', Cosmos: '', Weather: 'clear', Time: 0, Travels: [], Removed: [], Overrides: {}, Added: [
			{ID: 'ground', Kind: 'ground', Values: {}, Traits: {Terrain: {Size: 200, Height: 2, Water: 0, Seed: 'little'}}, Parts: []},
			{ID: 'sun', Kind: 'sun', Values: {}, Traits: {Sun: {Time: 11}}, Parts: []},
			{ID: 'hut', Kind: 'house', Values: {Model: 'game-hut', X: 0, Y: 0}, Traits: {Model: {Size: 4}}, Parts: []},
			{ID: 'hero', Kind: 'unit', Values: {Name: 'Hero', Hero: true, X: 5, Y: 2}, Traits: {}, Parts: []}
		]}},
		Models: [{ID: 'game-hut', Document: {Version: 1, Name: 'Hut', Recipe: {Type: 'building', Size: 4, Parts: [{ID: 'walls', Shape: 'box', At: [0, 0.3, 0], Size: [0.8, 0.6, 0.8]}, {ID: 'roof', Shape: 'wedge', Piece: 'roof', At: [0, 0.75, 0], Size: [0.9, 0.3, 0.9]}]}}}]
	};
}

describe('Contract: the Game editor packs a game to run alone: its models, its scene, its hero', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Archive', 'service:ModelFormats']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		delete Elemenx.Service('SceneModels').Recipes['game-hut'];
	});

	it('makes a Component of the game that defines its models, loads its scene and gives the keys to its hero', async function () {
		var made = packager();
		var name = unique('Game');
		var code = made.Code(game()).replace('Elemenx.Component(\'Game\'', 'Elemenx.Component(\'' + name + '\'');
		var host;
		var scene;

		expect(made.Data(game())).toEqual({Name: 'Little world', Models: [{ID: 'game-hut', Recipe: game().Models[0].Document.Recipe}], Scene: game().Scene.Scene});
		expect(made.App(game(), false)).toContain('Elemenx.Application("LittleWorld"');

		new Function(code)();

		host = Elemenx.Component(unique('GameHost'), {$Template: '<div style="width: 320px; height: 200px"><' + name + ' /></div>'})();

		owned.push(host);

		document.getElementById('mount').appendChild(host.$Element());

		await waitFor(function () {
			var node = host.$Element().querySelector('.elemenx-scene');

			scene = node ? Elemenx.Instance(node) : null;

			return scene && scene.Get('hut') && scene.Scene().Hero;
		}, 6000);

		expect(Elemenx.Service('SceneModels').Make('game-hut').Pieces.map(function (piece) {
			return piece.ID;
		})).toEqual(['body', 'roof']);
		expect(scene.Get('hut').Values.Model).toBe('game-hut');
		expect(scene.Scene().Hero).toBe('hero');
	});

	it('puts one HTML file together of the bundles and the game, its scripts kept from ending early', function () {
		var made = packager();
		var text = null;

		made.Fetch = function (url, callback) {
			callback(null, '/* ' + url + ' */ var end = "</script>";');
		};

		made.Html(Object.assign(game(), {Name: 'A <b>game</b>'}), function (error, result) {
			text = result;
		});

		expect(text).toContain('<title>A &lt;b>game&lt;/b></title>');
		expect(text).toContain('/* bundles/elemenx.min.js */ var end = "<\\/script>";');
		expect(text.indexOf('bundles/elemenx-ui.min.js')).toBeGreaterThan(text.indexOf('bundles/elemenx.min.js'));

		/* A game stands on every system Library: each bundle after the ones it stands on. */
		expect(['elemenx.min.js', 'elemenx-common.min.js', 'elemenx-ui.min.js', 'elemenx-graphics.min.js', 'elemenx-gaming.min.js'].map(function (name) {
			return text.indexOf('/* bundles/' + name + ' */');
		}).every(function (at, index, list) {
			return at !== -1 && (!index || at > list[index - 1]);
		})).toBe(true);
		expect(text).toContain('$Use: [\'ElemenxGaming\']');
		expect(text).toContain('Elemenx.Component(\'Game\'');
		expect(text).toContain('$Mount: \'body\'');
		expect(text).not.toContain('$Root');

		/* A bundle that is not there: the error, no file. */
		made.Fetch = function (url, callback) {
			callback(new Error('The bundle is not there: ' + url));
		};

		made.Html(game(), function (error, result) {
			text = error ? error.message : result;
		});

		expect(text).toBe('The bundle is not there: bundles/elemenx.min.js');
	});

	it('zips a project of Elemenx: the page, the Application of its root, the Component Game, and each model as a glb', function () {
		var made = packager();
		var zip = made.Project(game());
		var view = new DataView(zip.buffer);
		var files = {};
		var at = 0;

		while (view.getUint32(at, true) === 0x04034b50) {
			var length = view.getUint16(at + 26, true);
			var size = view.getUint32(at + 18, true);

			files[new TextDecoder().decode(zip.subarray(at + 30, at + 30 + length))] = zip.slice(at + 30 + length, at + 30 + length + size);

			at += 30 + length + size;
		}

		expect(Object.keys(files)).toEqual(['index.html', 'app.js', 'elemenx.config.js', 'application/index.js', 'application/components/index.js', 'application/components/Game/Game.js', 'models/game-hut.glb']);
		expect(new TextDecoder().decode(files['app.js'])).toContain('$Root: \'application\'');
		expect(new TextDecoder().decode(files['application/components/Game/Game.js'])).toBe(made.Code(game()) + '\n');
		expect(Elemenx.Service('ModelFormats').Read(files['models/game-hut.glb'], {Format: 'glb'}).Meshes.length).toBe(2);
		expect(Elemenx.Service('SceneModels').Has('game-packager-game-hut')).toBe(false);
	});
});
