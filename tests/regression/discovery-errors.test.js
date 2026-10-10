import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';

var applications = [];

/* Starts an Application whose root Component must come from Discovery, and resolves with the error it reports. */
function discoveryError (root, component) {
	return new Promise(function (resolve) {
		applications.push(Elemenx.Application(unique('DiscoveryErrors'), {
			$Component: component || unique('DiscoveryRoot'),
			$Mount: '#mount',
			$Root: root,
			$Error: '<p class="discovery-error">failed</p>',
			$OnError: function (args) {
				resolve(args.Error);
			}
		}));
	});
}

describe('Regression: Discovery errors', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (applications.length) applications.pop().$Destroy();
	});

	it('a missing index fails with the HTTP status', async function () {
		var error = await discoveryError('/discovery-errors/absent');

		expect(error.message).toBe('Elemenx Discovery failed: ' + location.origin + '/discovery-errors/absent/index.js [404]');
		expect(document.querySelector('#mount .discovery-error')).not.toBeNull();
	});

	it('an index that is not an expression, not an Array, or lists non-strings is rejected', async function () {
		var syntax = await discoveryError('/discovery-errors/bad-syntax');
		var notArray = await discoveryError('/discovery-errors/not-array');
		var nonString = await discoveryError('/discovery-errors/non-string');

		expect(syntax.message).toMatch(/^Elemenx Discovery index error in .*\/discovery-errors\/bad-syntax\/index\.js: /);
		expect(notArray.message).toMatch(/^Elemenx Discovery index must return an Array: .*\/not-array\/index\.js$/);
		expect(nonString.message).toMatch(/^Elemenx Discovery index entries must be strings: .*\/non-string\/index\.js$/);
	});

	it('two entities with the same name in different places are rejected', async function () {
		var error = await discoveryError('/discovery-errors/duplicate');

		expect(error.message).toMatch(/^Elemenx Discovery duplicate entity "Widget": .*\/one\/Widget\.js and .*\/two\/Widget\.js$/);
	});

	it('an indexed entity whose script cannot be loaded fails the Application through $OnError, not the console', async function () {
		var logged = [];
		var consoleError = console.error;
		var error;

		console.error = function (value) {
			logged.push(value.message);
		};

		try {
			error = await discoveryError('/discovery-errors/missing-entity', 'DiscoveryMissingEntity');
		}
		finally {
			console.error = consoleError;
		}

		expect(logged).toEqual([]);

		expect(error.message).toMatch(/^Elemenx Discovery entity failed: .*\/missing-entity\/DiscoveryMissingEntity\.js$/);
	});

	it('loading an entity that no index lists reports it as unknown', async function () {
		var component = unique('DiscoveryKnownRoot');
		var errors = [];

		Elemenx.Component(component, {$Template: '<main>known</main>'});

		var application = Elemenx.Application(unique('DiscoveryUnknown'), {$Component: component, $Mount: '#mount'});

		applications.push(application);

		application.$Reload('Service', unique('NeverIndexed'), function (error) {
			errors.push(error.message);
		});

		expect(await waitFor(function () {
			return errors.length === 1;
		})).toBe(true);
		expect(errors[0]).toMatch(/^Elemenx unknown Service: NeverIndexed/);
	});
});
