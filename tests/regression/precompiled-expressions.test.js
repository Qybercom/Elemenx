import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

/*
 * Elemenx.Expressions: functions a build wrote as code for the expressions of the templates. A page that forbids eval
 * (the Content-Security-Policy of a browser extension) renders its templates with them and compiles nothing.
 */
describe('Contract: precompiled expressions', function () {
	var BuiltIn = globalThis.Function;

	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () { resetDOM(); });

	afterEach(function () { globalThis.Function = BuiltIn; });

	it('renders an expression with its precompiled function, by its source, trimmed', async function () {
		var name = unique('Precompiled');
		var source = unique('Count') + ' * 2';
		var count = source.split(' ')[0];
		var calls = 0;
		var map = {};

		map['  ' + source + ' '] = function ($globals, $scope) {
			calls++;

			return 'pre:' + $scope[count] * 2;
		};

		expect(Elemenx.Expressions(map)).toBe(Elemenx);

		Elemenx.Component(name, {
			$Template: '<p class="pre">{{' + source + '}}</p>',
			$OnCreate: function () { this[count] = 21; }
		});

		var component = Elemenx.Component(name)({});

		document.getElementById('mount').appendChild(component.$Element());

		await tick();

		expect(document.querySelector('.pre').textContent).toBe('pre:42');
		expect(calls).toBeGreaterThan(0);

		component.$Destroy();
	});

	it('compiles nothing for a precompiled expression, even where eval is forbidden', async function () {
		var name = unique('Forbidden');
		var source = unique('Label') + '.toUpperCase()';
		var label = source.split('.')[0];
		var map = {};

		map[source] = new BuiltIn('$globals', '$scope', 'with ($globals) { with ($scope || {}) { return (' + source + '); } }');

		Elemenx.Expressions(map);

		globalThis.Function = function () {
			var error = new Error('Refused to evaluate a string as JavaScript');

			error.name = 'EvalError';

			throw error;
		};

		Elemenx.Component(name, {
			$Template: '<p class="safe">{{' + source + '}}</p>',
			$OnCreate: function () { this[label] = 'ok'; }
		});

		var component = Elemenx.Component(name)({});

		document.getElementById('mount').appendChild(component.$Element());

		await tick();

		expect(document.querySelector('.safe').textContent).toBe('OK');

		component.$Destroy();
	});

	it('names the expression a build did not precompile when the page forbids eval', function () {
		var source = unique('Missing') + ' + 1';

		globalThis.Function = function () {
			var error = new Error('Refused to evaluate a string as JavaScript');

			error.name = 'EvalError';

			throw error;
		};

		expect(function () {
			Elemenx.Expressions({});

			return Elemenx.Component(unique('Missing'), {$Template: '<p>{{' + source + '}}</p>'})({});
		}).toThrow('Elemenx expression is not precompiled and the page forbids eval: ' + source);
	});

	it('takes only functions', function () {
		expect(function () {
			Elemenx.Expressions({'a + b': 'a + b'});
		}).toThrow('Elemenx precompiled expression must be a function: a + b');
	});
});
