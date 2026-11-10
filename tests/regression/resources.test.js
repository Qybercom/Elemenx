import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';

var applications = [];

describe('Contract: Elemenx.Resources and $Resources', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (applications.length) applications.pop().$Destroy();
	});

	it('defines a resource in code, gives its names sorted and a copy of its data at each read', function () {
		var group = unique('Group');
		var first;

		expect(Elemenx.Resources(group)).toEqual([]);
		expect(Elemenx.Resources(group, 'none')).toBe(null);
		expect(Elemenx.Resources(group, 'b', {Value: 1})).toBe('b');
		expect(Elemenx.Resources(group, 'a', '{"Value": 2}')).toBe('a');
		expect(Elemenx.Resources(group)).toEqual(['a', 'b']);

		first = Elemenx.Resources(group, 'b');
		first.Value = 9;

		expect(Elemenx.Resources(group, 'b')).toEqual({Value: 1});

		Elemenx.Resources(group, 'b', {Value: 3});

		expect(Elemenx.Resources(group, 'b')).toEqual({Value: 3});
		expect(function () {
			Elemenx.Resources(group, 'c', '{not json');
		}).toThrow();
		expect(function () {
			Elemenx.Resources();
		}).toThrow('Elemenx.Resources expects (group), (group, name) or (group, name, data)');
		expect(function () {
			Elemenx.Resources(group, '');
		}).toThrow('Elemenx.Resources expects (group), (group, name) or (group, name, data)');
	});

	it('loads the folder of a Library before its Services, by its name, and an Application takes the place of one of them', async function () {
		var library = unique('ResourceKit');
		var root = unique('ResourceRoot');
		var ready = false;

		Elemenx.Library(library, {$Root: '/library-resources', $Resources: {Blueprints: 'blueprints'}});
		Elemenx.Component(root, {$Template: '<main class="resource-root">ready</main>'});

		applications.push(Elemenx.Application(unique('ResourceApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Use: library,
			$Resources: {Blueprints: [{Name: library + '/water', URL: '/library-resources/override.json'}, '/library-resources/blueprints/deep/sea.json']},
			$OnReady: function () {
				ready = true;
			}
		}));

		expect(await waitFor(function () {
			return ready && document.querySelector('.resource-root');
		}, 4000)).toBeTruthy();

		/* Its Service saw them as it was defined. */
		expect(Elemenx.Service('ResourceReader').Seen).toEqual(expect.arrayContaining([library + '/deep/sea', library + '/water']));
		expect(Elemenx.Resources('Blueprints', library + '/deep/sea')).toEqual({name: 'Sea', depth: 40});

		/* The Application: its own one over the one of the Library, and one of its own by the name of its file. */
		expect(Elemenx.Resources('Blueprints', library + '/water')).toEqual({name: 'Mine', blocks: []});
		expect(Elemenx.Resources('Blueprints', 'sea')).toEqual({name: 'Sea', depth: 40});

		/* The Library loaded again for an Application that starts later leaves the one of the Application where it is. */
		applications.pop().$Destroy();

		ready = false;

		applications.push(Elemenx.Application(unique('ResourceLater'), {
			$Component: root,
			$Mount: '#mount',
			$Use: library,
			$OnReady: function () {
				ready = true;
			}
		}));

		expect(await waitFor(function () {
			return ready;
		}, 4000)).toBe(true);
		expect(Elemenx.Resources('Blueprints', library + '/water')).toEqual({name: 'Mine', blocks: []});
	});

	it('fails the startup on an item of $Resources that is neither a path nor {Name, URL}', async function () {
		var root = unique('WrongResourceRoot');
		var failed = null;

		Elemenx.Component(root, {$Template: '<main class="wrong-resource-root">ready</main>'});

		applications.push(Elemenx.Application(unique('WrongResourceApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Resources: {Data: [42]},
			$OnError: function (args) {
				failed = args.Error;
			}
		}));

		expect(await waitFor(function () {
			return failed;
		}, 4000)).toBeTruthy();
		expect(failed.message).toBe('Elemenx $Resources items must be paths or {Name, URL}: Data');
		expect(document.querySelector('.wrong-resource-root')).toBe(null);
	});
});
