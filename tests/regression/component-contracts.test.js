import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';

var owned = [];

function mounted (component) {
	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

describe('Regression: Template and Component contracts', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('Elemenx.Template validates its arguments', function () {
		expect(function () {
			Elemenx.Template('', '<p></p>');
		}).toThrow('Elemenx.Template expects a non-empty name');
		expect(function () {
			Elemenx.Template('a', 'b', 'c');
		}).toThrow('Elemenx.Template expects (name) or (name, value)');
		expect(function () {
			Elemenx.Template.Loader('not a function');
		}).toThrow('Elemenx.Template.Loader expects a function');
	});

	it('an inline $Template "#name" uses a registered Template, then a <template> element, and fails when neither exists', function () {
		var registered = unique('InlineRegistered');
		var element = unique('InlineElement');

		Elemenx.Template(registered, '<p class="from-registry">registry</p>');

		document.body.insertAdjacentHTML('beforeend', '<template id="' + element + '"><p class="from-element">element</p></template>');

		var first = mounted(Elemenx.Component(unique('InlineA'), {$Template: '#' + registered})());
		var second = mounted(Elemenx.Component(unique('InlineB'), {$Template: '#' + element})());

		expect(first.$Element().className).toBe('from-registry');
		expect(second.$Element().className).toBe('from-element');
		expect(function () {
			Elemenx.Component(unique('InlineC'), {$Template: '#' + unique('Absent')})();
		}).toThrow('Elemenx template not found: #Absent');
	});

	it('a template with blank lines around its element (the final newline of a file) has that element as its root', function () {
		var spaced = mounted(Elemenx.Component(unique('Spaced'), {$Template: '\n\t<section class="spaced"><b>{{Text}}</b></section>\n\n', Text: 'root'})());
		var several = mounted(Elemenx.Component(unique('Several'), {$Template: '<i class="one"></i>\n<i class="two"></i>\n'})());

		expect(spaced.$Element().tagName).toBe('SECTION');
		expect(spaced.$Element().className).toBe('spaced');
		expect(spaced.$Element().textContent).toBe('root');
		expect(several.$Element().tagName).toBe('DIV');
		expect(several.$Element().children.length).toBe(2);
	});

	it('a deferred Component queues $Update before it is ready and resolves $Ref afterwards', async function () {
		var panel = mounted(Elemenx.Component(unique('DeferredPanel'), {$TemplateURL: '/component-contracts/Panel.html'})({Title: 'first'}));

		expect(panel.$Ref('title')).toBeNull();

		panel.$Update({Title: 'second'});

		expect(await waitFor(function () {
			return !!document.querySelector('#mount .contract-panel');
		}, 2000)).toBe(true);
		expect(panel.$Ref('title').textContent).toBe('second');
	});

	it('a deferred child whose resources fail shows *error from a Template or a <template> and calls $OnChildError', async function () {
		var registered = unique('ErrorRegistered');
		var element = unique('ErrorElement');
		var missingTemplate = unique('MissingTemplateChild');
		var missingStyle = unique('MissingStyleChild');
		var errors = [];
		var logged = [];
		var consoleError = console.error;

		/* the owner handles both failures, so neither reaches the console */
		console.error = function (value) {
			logged.push(value.message);
		};

		Elemenx.Template(registered, '<p class="error-registry">template failed</p>');

		document.body.insertAdjacentHTML('beforeend', '<template id="' + element + '"><p class="error-element">style failed</p></template>');

		Elemenx.Component(missingTemplate, {$TemplateURL: '/component-contracts/Missing.html'});
		Elemenx.Component(missingStyle, {$Template: '<p>styled</p>', $StyleURL: '/component-contracts/Missing.css'});

		var owner = mounted(Elemenx.Component(unique('ErrorOwner'), {
			$Template: '<div><' + missingTemplate + ' *error="#' + registered + '"></' + missingTemplate + '><' + missingStyle + ' *error="#' + element + '"></' + missingStyle + '></div>',
			$OnChildError: function (args) {
				errors.push(args.Error.message);
			}
		})({}));

		try {
			expect(await waitFor(function () {
				return errors.length === 2;
			}, 2000)).toBe(true);
		}
		finally {
			console.error = consoleError;
		}

		expect(logged).toEqual([]);
		expect(errors.sort()).toEqual([
			'Elemenx StyleURL failed: /component-contracts/Missing.css (404)',
			'Elemenx TemplateURL failed: /component-contracts/Missing.html (404)'
		]);
		expect(owner.$Element().querySelector('.error-registry')).not.toBeNull();
		expect(owner.$Element().querySelector('.error-element')).not.toBeNull();
	});

	it('a failed deferred child that no $OnChildError hook receives is logged to the console once', async function () {
		var child = unique('UnheardChild');
		var logged = [];
		var consoleError = console.error;

		Elemenx.Component(child, {$TemplateURL: '/component-contracts/Missing.html'});

		console.error = function (value) {
			logged.push(value.message);
		};

		try {
			mounted(Elemenx.Component(unique('DeafOwner'), {$Template: '<div><' + child + '></' + child + '></div>'})({}));

			await waitFor(function () {
				return logged.length > 0;
			}, 2000);
		}
		finally {
			console.error = consoleError;
		}

		expect(logged).toEqual(['Elemenx TemplateURL failed: /component-contracts/Missing.html (404)']);
	});
});
