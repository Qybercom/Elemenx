import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

/*
 * The registries of the system Libraries (formats of data and of fields, languages of code, kinds, lands, what is made
 * of a seed) take what a Service declares to them in $Provides: the Service is made only when one of its names is
 * wanted, or the list of them.
 */
describe('Contract: the registries of the Libraries take what Services declare in $Provides, when it is wanted', function () {
	var made = [];

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:DataFormats', 'service:FieldFormats', 'service:Syntax', 'service:SceneKinds', 'service:SceneBiomes', 'service:Seeded']);

		Elemenx.Service('ProvidedVox', {
			$Provides: {
				DataFormats: {Formats: ['vox']},
				FieldFormats: {Formats: ['voxel']},
				Syntax: {Languages: ['voxscript']},
				SceneKinds: {Kinds: ['vox-crate']},
				SceneBiomes: {Biomes: ['voxland']},
				Seeded: {Kinds: ['vox']}
			},

			$OnCreate: function () {
				made.push(this.$Application() ? 'application' : 'page');

				this.$Service('DataFormats').Register('vox', {Extensions: ['.vox'], Parse: function (text) {
					return {Voxels: text.length};
				}, Stringify: function (value) {
					return 'x'.repeat(value.Voxels);
				}});
				this.$Service('FieldFormats').Register('voxel', {Pattern: /^\d+$/});
				this.$Service('Syntax').Register('voxscript', {Rules: [['number', /\d+/]]});
				this.$Service('SceneKinds').Define('vox-crate', {Traits: {Health: {Max: 3}}});
				this.$Service('SceneBiomes').Define('voxland', {Ground: {}, Scatter: [], Grass: {Density: 0}});
				this.$Service('Seeded').Define('vox', {Make: function (params) {
					return params.Seed + '!';
				}});
			}
		});
	});

	it('makes the provider only as a name of it is wanted, in the Application that wants it', function () {
		var application = Elemenx.Application('ProvidedRegistries', {});

		expect(made).toEqual([]);
		expect(application.$Service('DataFormats').Parse('vox', 'xxxx')).toEqual({Voxels: 4});
		expect(made).toEqual(['application']);
		expect(application.$Service('DataFormats').For('crate.vox')).toBe('vox');
		expect(application.$Service('FieldFormats').Find('voxel')).not.toBe(null);
		expect(application.$Service('Syntax').Find('voxscript')).not.toBe(null);
		expect(application.$Service('SceneKinds').Has('vox-crate')).toBe(true);
		expect(application.$Service('SceneBiomes').Has('voxland')).toBe(true);
		expect(application.$Service('Seeded').Load({Kind: 'vox', Version: 1, Seed: 'a', Params: {}})).toBe('a!');
		expect(made).toEqual(['application']);
	});

	it('makes the providers for a list, and none for a name no one declares', function () {
		var application = Elemenx.Application('ProvidedLists', {});

		expect(application.$Service('SceneKinds').Get('nothing-of-this')).toBe(null);
		expect(made.length).toBe(1);
		expect(application.$Service('Syntax').Languages()).toContain('voxscript');
		expect(made.length).toBe(2);
		expect(application.$Service('DataFormats').Names()).toContain('vox');
		expect(application.$Service('SceneBiomes').Names()).toContain('voxland');
		expect(made.length).toBe(2);
	});
});
