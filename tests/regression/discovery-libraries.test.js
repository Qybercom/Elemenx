import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';

var applications = [];

/*
 * The Libraries of an Application found by $Discovery, from tests/public: discovery-folder by its folder (its
 * index.js), discovery-kit by a graph file of its own name (kit.js), with a folder in its graph, a Service and the
 * dictionaries its graph lists.
 */
describe('Contract: $Discovery of Elemenx.Application', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (applications.length) applications.pop().$Destroy();
	});

	it('finds the Components and Services of Libraries by their folders and by graph files of any name, and reads their dictionaries', async function () {
		var root = unique('DiscoveryRoot');
		var ready = false;

		Elemenx.Component(root, {$Template: '<main class="discovery-root"><DiscoveredCard /><FolderBadge /></main>'});

		applications.push(Elemenx.Application(unique('DiscoveryApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Discovery: ['/discovery-folder/', {Path: '/discovery-kit/kit.js', Name: 'Kit'}],
			$OnReady: function () {
				ready = true;
			}
		}));

		expect(await waitFor(function () {
			return ready && document.querySelector('.discovered-card') && document.querySelector('.folder-badge');
		}, 4000)).toBeTruthy();

		expect(document.querySelector('.discovered-card').textContent).toBe('From the kit 1');
		expect(document.querySelector('.folder-badge').textContent).toBe('from the folder');

		/* The languages of the dictionaries are the ones its graph lists. */
		await new Promise(function (resolve) {
			Elemenx.Locale.Language('ru', resolve);
		});

		try {
			expect(await waitFor(function () {
				return document.querySelector('.discovered-card').textContent === 'Из набора 1';
			}, 4000)).toBe(true);
		}
		finally {
			await new Promise(function (resolve) {
				Elemenx.Locale.Language('en', resolve);
			});
		}
	});

	it('refuses a $Discovery that is not a list of paths or of {Path, Name} as the Application is made', function () {
		var root = unique('BadDiscoveryRoot');

		Elemenx.Component(root, {$Template: '<main class="bad-discovery-root">ready</main>'});

		[
			'/discovery-folder',
			[42],
			[{Name: 'NoPath'}],
			[{Path: '/discovery-folder', Name: 7}]
		].forEach(function (value) {
			expect(function () {
				applications.push(Elemenx.Application(unique('BadDiscoveryApplication'), {
					$Component: root,
					$Mount: '#mount',
					$Discovery: value
				}));
			}).toThrow('Elemenx.Application $Discovery expects an Array of paths or {Path, Name}');
		});

		expect(document.querySelector('.bad-discovery-root')).toBe(null);
	});
});
