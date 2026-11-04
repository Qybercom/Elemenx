import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';

var applications = [];

/* A Library of the tests, tests/public/library-contracts: a directive, a Service, a Component with its template and a dictionary. */
describe('Contract: Elemenx.Library and $Use', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (applications.length) applications.pop().$Destroy();
	});

	it('an Application that uses a Library (by a name alone) loads its directives and Services, finds its Components and reads its dictionary', async function () {
		var library = unique('TestKit');
		var root = unique('LibraryRoot');
		var ready = false;
		var application;

		Elemenx.Library(library, {$Root: '/library-contracts', $Locales: {URL: 'locales/{language}.json', Languages: ['en']}});
		Elemenx.Component(root, {$Template: '<main class="library-root"><LibraryBadge Name="Ada" /></main>'});

		application = Elemenx.Application(unique('LibraryApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Use: library,
			$OnReady: function () {
				ready = true;
			}
		});

		applications.push(application);

		expect(await waitFor(function () {
			return ready && document.querySelector('.library-badge .library-label') && document.querySelector('.library-label').textContent === 'from the Library';
		}, 4000)).toBe(true);

		expect(document.querySelector('.library-greeting').textContent).toBe('Hello, Ada');
		expect(document.querySelector('.library-shout').textContent).toBe('QUIET');
		expect(application.$Libraries()).toEqual([library]);
	});

	it('a Library that uses another one ($Use) brings it in first: its Components and Services are there for the Components of the first', async function () {
		var base = unique('BaseKit');
		var top = unique('TopKit');
		var root = unique('ChainRoot');
		var ready = false;
		var application;

		Elemenx.Library(base, {$Root: '/library-contracts', $Locales: {URL: 'locales/{language}.json', Languages: ['en']}});
		Elemenx.Library(top, {$Root: '/library-chain', $Use: [base]});
		Elemenx.Component(root, {$Template: '<main class="chain-root"><ChainCard /></main>'});

		application = Elemenx.Application(unique('ChainApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Use: top,
			$OnReady: function () {
				ready = true;
			}
		});

		applications.push(application);

		expect(await waitFor(function () {
			return ready && document.querySelector('.chain-card .library-greeting');
		}, 4000)).toBeTruthy();

		expect(document.querySelector('.chain-greeting').textContent).toBe('Hello, Chain');
		expect(document.querySelector('.chain-card .library-greeting').textContent).toBe('Hello, Bo');

		/* What it names, as it named it. */
		expect(application.$Libraries()).toEqual([top]);
	});

	it('the system Libraries stand each on the ones before it: Common, UI, Graphics, Gaming', function () {
		expect(Elemenx.Library('ElemenxCommon').$Use).toEqual([]);
		expect(Elemenx.Library('ElemenxUI').$Use).toEqual(['ElemenxCommon']);
		expect(Elemenx.Library('ElemenxGraphics').$Use).toEqual(['ElemenxUI']);
		expect(Elemenx.Library('ElemenxGaming').$Use).toEqual(['ElemenxGraphics']);
	});

	it('refuses a Library that uses itself, by others or not', function () {
		var one = unique('One');
		var two = unique('Two');
		var root = unique('CycleRoot');

		Elemenx.Library(one, {$Root: '/library-contracts', $Use: [two]});
		Elemenx.Library(two, {$Root: '/library-chain', $Use: [one]});
		Elemenx.Component(root, {$Template: '<main class="cycle-root">ready</main>'});

		expect(function () {
			applications.push(Elemenx.Application(unique('CycleApplication'), {
				$Component: root,
				$Mount: '#mount',
				$Use: one
			}));
		}).toThrow('Elemenx Library uses itself: ' + one + ' > ' + two + ' > ' + one);
		expect(document.querySelector('.cycle-root')).toBe(null);
	});

	it('refuses two Libraries that define the same name: which one is found would depend on their order', async function () {
		var one = unique('Same');
		var two = unique('Again');
		var root = unique('SameRoot');
		var errors = [];
		var application;

		Elemenx.Library(one, {$Root: '/library-contracts'});
		Elemenx.Library(two, {$Root: '/library-contracts', $Use: [one]});
		Elemenx.Component(root, {$Template: '<main class="same-root">ready</main>'});

		application = Elemenx.Application(unique('SameApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Use: two,
			$OnError: function (args) {
				errors.push(args.Error);
			}
		});

		applications.push(application);

		expect(await waitFor(function () {
			return errors.length;
		}, 4000)).toBeTruthy();

		expect(errors[0].message).toContain('Elemenx Library ' + two + ' defines ');
		expect(errors[0].message).toContain(', which ' + one + ' defines too');
	});

	it('Elemenx.Library gives a definition back by its name, null for none, and refuses the wrong arguments', function () {
		var name = unique('Defined');
		var definition = {$Root: '/somewhere'};

		expect(Elemenx.Library(name, definition)).toBe(definition);
		expect(Elemenx.Library(name)).toBe(definition);
		expect(Elemenx.Library(unique('Unknown'))).toBe(null);
		expect(function () {
			Elemenx.Library(name, 'not an object');
		}).toThrow('Elemenx.Library expects (name, definition)');
		expect(function () {
			Elemenx.Library();
		}).toThrow('Elemenx.Library expects (name) or (name, definition)');
	});

	it('$Use takes a name or a list of names, and refuses anything else as the Application starts', function () {
		var root = unique('BadUseRoot');

		Elemenx.Component(root, {$Template: '<main class="bad-use-root">ready</main>'});

		expect(function () {
			applications.push(Elemenx.Application(unique('BadUseApplication'), {
				$Component: root,
				$Mount: '#mount',
				$Use: 42
			}));
		}).toThrow('Elemenx Library Use must be a string or Array');
		expect(document.querySelector('.bad-use-root')).toBe(null);
	});
});
