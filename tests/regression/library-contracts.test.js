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
