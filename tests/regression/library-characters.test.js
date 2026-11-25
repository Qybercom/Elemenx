import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

/*
 * SceneCharacters: the walkers of a game as data, each a file of its own or many in a catalogue: their models made units
 * of SceneModels (their bones, their clips of other files, a set of clips by its name), what they hold, the unit a Scene
 * takes. Regression: the characters of the demos, their clips and the grip of a rifle were written in a demo, each a copy.
 */
describe('Contract: SceneCharacters, the walkers of a game as data', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneCharacters', 'service:SceneModels']);
	});

	function load (url) {
		return new Promise(function (resolve, reject) {
			Elemenx.Service('SceneCharacters').Load(url, function (error, names) {
				if (error) reject(error);
				else resolve(names);
			});
		});
	}

	it('reads a catalogue: its sets of clips, its characters in their order, their files from its folder', async function () {
		var characters = Elemenx.Service('SceneCharacters');
		var models = Elemenx.Service('SceneModels');
		var names = await load('/characters/catalogue.json');
		var runner = characters.Get('runner');
		var guard = characters.Get('guard');

		expect(names).toEqual(['runner', 'guard', 'dummy']);
		expect(characters.Names().slice(-3)).toEqual(['runner', 'guard', 'dummy']);

		/* A model of a file: a unit of its clips (of the set it names) and its bones, its files from the folder of the catalogue. */
		expect(runner).toMatchObject({Label: 'Runner', Model: 'character-runner', Size: 1.8, File: '/characters/../models/runner.glb'});
		expect(models.Recipes['character-runner']).toMatchObject({URL: '/characters/../models/runner.glb', Type: 'unit', Bones: {Hips: 'centre_09'}, Motions: {idle: '/characters/../clips/idle.fbx', walk: {URL: '/characters/../clips/walk.fbx', Stride: 0.85}}});
		expect(characters.Sets('steps').walk.Stride).toBe(0.85);

		/* An absolute path as it is; clips of its own; what it holds a model of a file of its own. */
		expect(guard).toMatchObject({Model: 'character-guard', Size: 1.9, File: '/assets/guard.glb', Hold: {Model: 'character-guard-hold', Bone: 'HandR', Aim: 'HandL', Size: 0.15}});
		expect(models.Recipes['character-guard'].Motions).toEqual({idle: {URL: '/characters/aim.fbx', Held: true}});
		expect(models.Recipes['character-guard-hold']).toMatchObject({URL: '/characters/rifle.glb', Type: 'prop'});

		/* A model of code is the one it names. */
		expect(characters.Get('dummy')).toMatchObject({Model: 'mannequin', File: ''});

		/* What a Scene takes: its model, what it holds, its size, over what is given. */
		expect(characters.Unit('guard', {ID: 'hero', X: 3, Y: 4})).toEqual({ID: 'hero', X: 3, Y: 4, Model: 'character-guard', Hold: guard.Hold, Size: 1.9});
		expect(characters.Unit('guard', {Size: 2.1}).Size).toBe(2.1);
		expect(characters.Unit('nobody')).toBe(null);
	});

	it('reads one character, named after its file, and tells what it cannot read', async function () {
		var characters = Elemenx.Service('SceneCharacters');

		expect(await load('/characters/scout.json')).toEqual(['scout']);
		expect(characters.Get('scout')).toMatchObject({Label: 'Scout', Model: 'character-scout', File: '/characters/scout.glb'});

		await expect(load('/characters/none.json')).rejects.toThrow(/none\.json gave 404/);

		expect(function () {
			characters.Define('empty', {});
		}).toThrow('Elemenx SceneCharacters: Define expects (name, {Model})');
	});
});
