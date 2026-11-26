import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

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

		/* Regression: under the load of a whole run (scenes beside it) the files of the folder came after 4 s; they are waited for as other loads of a Library are. */
		expect(await waitFor(function () {
			return ready && document.querySelector('.resource-root');
		}, 20000)).toBeTruthy();

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
		}, 20000)).toBe(true);
		expect(Elemenx.Resources('Blueprints', library + '/water')).toEqual({name: 'Mine', blocks: []});
	});

	it('names the lazy ones of a folder at once, loads them by Elemenx.Need and before a Component of $Needs is made', async function () {
		var library = unique('LazyKit');
		var root = unique('LazyRoot');
		var needing = unique('LazyNeeding');
		var trait = unique('LazyTrait');
		var ready = false;
		var calls = [];
		var seen = null;
		var called = false;
		var answer;
		var made;

		Elemenx.Library(library, {$Root: '/library-resources', $Resources: {Blueprints: {Folder: 'blueprints', Lazy: ['deep/']}}});
		Elemenx.Component(root, {$Template: '<main class="lazy-root">ready</main>'});

		applications.push(Elemenx.Application(unique('LazyApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Use: library,
			$OnReady: function () {
				ready = true;
			}
		}));

		expect(await waitFor(function () {
			return ready;
		}, 20000)).toBe(true);

		/* Named, not loaded: null as one not known; the others of the folder as before. */
		expect(Elemenx.Resources('Blueprints')).toEqual(expect.arrayContaining([library + '/deep/sea', library + '/water']));
		expect(Elemenx.Resources('Blueprints', library + '/deep/sea')).toBe(null);
		expect(Elemenx.Resources('Blueprints', library + '/water')).toEqual({name: 'Water', blocks: [{id: 'a', type: 'Output'}]});

		/* A Component whose Trait needs it waits for it: its $OnCreate reads it. */
		Elemenx.Trait(trait, {$Needs: {Blueprints: [library + '/deep/*']}});
		Elemenx.Component(needing, {
			$Traits: [trait],
			$Template: '<p class="lazy-needing">made</p>',
			$OnCreate: function () {
				seen = Elemenx.Resources('Blueprints', library + '/deep/sea');
			}
		});

		made = Elemenx.Component(needing)({});

		document.getElementById('mount').appendChild(made.$Element());

		expect(await waitFor(function () {
			return document.querySelector('.lazy-needing');
		}, 20000)).toBeTruthy();
		expect(seen).toEqual({name: 'Sea', depth: 40});

		made.$Destroy();

		/* Elemenx.Need: always after it returns, what is here not loaded again; one not known an error. */
		answer = Elemenx.Need({Blueprints: [library + '/deep/sea', library + '/water']}, function (error) {
			calls.push(error);
		});
		called = calls.length > 0;

		expect(answer).toBe(undefined);
		expect(called).toBe(false);
		expect(await waitFor(function () {
			return calls.length === 1;
		}, 4000)).toBe(true);
		expect(calls[0]).toBe(null);

		Elemenx.Need({Blueprints: [library + '/deep/none']}, function (error) {
			calls.push(error);
		});

		expect(await waitFor(function () {
			return calls.length === 2;
		}, 4000)).toBe(true);
		expect(calls[1].message).toBe('Elemenx.Need: unknown resource Blueprints ' + library + '/deep/none');
		expect(function () {
			Elemenx.Need({Blueprints: 'water'}, function () {});
		}).toThrow('Elemenx.Need expects {Group: [names]}');
		expect(function () {
			Elemenx.Need({Blueprints: ['water']});
		}).toThrow('Elemenx.Need expects ({Group: [names]}, callback)');
		expect(function () {
			Elemenx.Component(unique('WrongNeeds'), {$Needs: ['water'], $Template: '<p></p>'});
		}).toThrow('Elemenx $Needs expects {Group: [names]}');
	});

	it('makes a Component of $Needs whose Trait is defined again while they load', async function () {
		var library = unique('LazyLate');
		var root = unique('LazyLateRoot');
		var trait = unique('LateNeedsTrait');
		var needing = unique('LateNeeding');
		var ready = false;
		var failed = null;
		var seen = null;
		var made;

		Elemenx.Library(library, {$Root: '/library-resources', $Resources: {Blueprints: {Folder: 'blueprints', Lazy: ['deep/']}}});
		Elemenx.Component(root, {$Template: '<main>ready</main>'});

		applications.push(Elemenx.Application(unique('LazyLateApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Use: library,
			$OnReady: function () {
				ready = true;
			}
		}));

		expect(await waitFor(function () {
			return ready;
		}, 20000)).toBe(true);

		Elemenx.Trait(trait, {Kind: 'early'});
		Elemenx.Component(needing, {
			$Traits: [trait],
			$Needs: {Blueprints: [library + '/deep/sea']},
			$Template: '<p class="late-needing">{{Kind}}</p>',
			$OnCreate: function () {
				seen = Elemenx.Resources('Blueprints', library + '/deep/sea');
			}
		});

		made = Elemenx.Component(needing)({}, null, {OnError: function (error) {
			failed = error;
		}});

		document.getElementById('mount').appendChild(made.$Element());

		/* The Trait again while its $Needs load: the Component made again, a placeholder of its own. */
		Elemenx.Trait(trait, {Kind: 'late'});

		/* Regression: the first placeholder called back with no Component (Scene unknown) when it was made again so. */
		expect(await waitFor(function () {
			return document.querySelector('.late-needing') || failed;
		}, 20000)).toBeTruthy();
		expect(failed).toBe(null);
		expect(document.querySelector('.late-needing').textContent).toBe('late');
		expect(seen).toEqual({name: 'Sea', depth: 40});

		made.$Destroy();
	});

	it('loads by Blueprints.Need a lazy graph and the lazy graphs it calls, passing over names of no resource', async function () {
		var root = unique('LazyCallsRoot');
		var ready = false;
		var result = 'none';
		var blueprints;

		Use(['service:Blueprints']);

		blueprints = Elemenx.Service('Blueprints');

		/* Its graphs call LazyCalls/deep/callee by that name: the Library is named so once in the run. */
		Elemenx.Library('LazyCalls', {$Root: '/library-resources', $Resources: {Blueprints: {Folder: 'blueprints', Lazy: ['deep/']}}});
		Elemenx.Component(root, {$Template: '<main>ready</main>'});

		applications.push(Elemenx.Application(unique('LazyCallsApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Use: 'LazyCalls',
			$OnReady: function () {
				ready = true;
			}
		}));

		expect(await waitFor(function () {
			return ready;
		}, 20000)).toBe(true);
		expect(Elemenx.Resources('Blueprints', 'LazyCalls/deep/caller')).toBe(null);
		expect(Elemenx.Resources('Blueprints', 'LazyCalls/deep/callee')).toBe(null);

		blueprints.Need('LazyCalls/deep/caller', function (error) {
			result = error;
		});

		expect(result).toBe('none');
		expect(await waitFor(function () {
			return result !== 'none';
		}, 4000)).toBe(true);
		expect(result).toBe(null);
		expect(Elemenx.Resources('Blueprints', 'LazyCalls/deep/caller').name).toBe('Caller');
		expect(Elemenx.Resources('Blueprints', 'LazyCalls/deep/callee')).toEqual({name: 'Callee', blocks: []});
		/* What it did not ask for stays as it was. */
		expect(Elemenx.Resources('Blueprints', 'LazyCalls/deep/sea')).toBe(null);
	});

	it('loads a lazy one once for all that need it at the same time', async function () {
		var group = unique('LazyGroup');
		var library = unique('LazyOnce');
		var root = unique('LazyOnceRoot');
		var ready = false;
		var left = 3;
		var fetched = 0;
		var open = XMLHttpRequest.prototype.open;

		Elemenx.Library(library, {$Root: '/library-resources', $Resources: (function () {
			var spec = {};

			spec[group] = {Folder: 'blueprints', Lazy: true};

			return spec;
		})()});
		Elemenx.Component(root, {$Template: '<main>ready</main>'});

		applications.push(Elemenx.Application(unique('LazyOnceApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Use: library,
			$OnReady: function () {
				ready = true;
			}
		}));

		expect(await waitFor(function () {
			return ready;
		}, 20000)).toBe(true);
		expect(Elemenx.Resources(group, library + '/water')).toBe(null);

		XMLHttpRequest.prototype.open = function (method, url) {
			if (String(url).indexOf('/library-resources/blueprints/water.json') !== -1)
				fetched++;

			return open.apply(this, arguments);
		};

		try {
			[1, 2, 3].forEach(function () {
				Elemenx.Need((function () {
					var spec = {};

					spec[group] = [library + '/water'];

					return spec;
				})(), function () {
					left--;
				});
			});

			expect(await waitFor(function () {
				return left === 0;
			}, 4000)).toBe(true);
		}
		finally {
			XMLHttpRequest.prototype.open = open;
		}

		expect(fetched).toBe(1);
		expect(Elemenx.Resources(group, library + '/water')).toEqual({name: 'Water', blocks: [{id: 'a', type: 'Output'}]});
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
