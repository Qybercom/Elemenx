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

	it('a <template> of the page finds its Components in any case (the parser writes their names in lower case)', function () {
		var child = unique('CaseChild');
		var element = unique('CaseTemplate');

		Elemenx.Component(child, {$Template: '<b class="case-child">{{Text}}</b>', Text: ''});

		document.body.insertAdjacentHTML('beforeend', '<template id="' + element + '"><section class="case-owner"><' + child + ' [Text]="\'found\'"></' + child + '><button class="native">native</button></section></template>');

		var owner = mounted(Elemenx.Component(unique('CaseOwner'), {$Template: '#' + element})());

		expect(owner.$Element().querySelector('.case-child').textContent).toBe('found');
		expect(owner.$Element().querySelector('.native').tagName).toBe('BUTTON');
	});

	it('a <template> of the page with a Component at its root takes it in any case', function () {
		var child = unique('CaseRoot');
		var element = unique('CaseRootTemplate');

		Elemenx.Component(child, {$Template: '<b class="case-root">{{Text}}</b>', Text: ''});

		document.body.insertAdjacentHTML('beforeend', '<template id="' + element + '"><' + child + ' [Text]="\'root\'"></' + child + '></template>');

		var owner = mounted(Elemenx.Component(unique('CaseRootOwner'), {$Template: '#' + element})());

		expect(owner.$Element().querySelector('.case-root').textContent).toBe('root');
	});

	it('a <script type="text/html" id> of the page is a template that keeps the case of its names', function () {
		var name = unique('Cased');
		var element = unique('ScriptTemplate');

		Elemenx.Component(name, {$Template: '<b class="mixed">mixed</b>'});
		Elemenx.Component(name.toUpperCase(), {$Template: '<b class="upper">upper</b>'});

		document.body.insertAdjacentHTML('beforeend', '<script type="text/html" id="' + element + '"><p class="from-script">{{Text}} <' + name + '></' + name + '></p></script>');

		var owner = mounted(Elemenx.Component(unique('ScriptOwner'), {$Template: '#' + element, Text: 'script'})());

		expect(owner.$Element().className).toBe('from-script');
		expect(owner.$Element().textContent).toBe('script mixed');
	});

	it('a template of one element and comments has that element as its root, not a wrapper', function () {
		var child = unique('CommentedChild');
		var commented = mounted(Elemenx.Component(unique('Commented'), {$Template: '<!-- the card -->\n<section class="commented">{{Text}}</section>\n<!-- end -->', Text: 'one'})());

		Elemenx.Component(child, {$Template: '<b class="commented-child">child</b>'});

		var owner = mounted(Elemenx.Component(unique('CommentedOwner'), {$Template: '<!-- a component at the root -->\n<' + child + '></' + child + '>'})());

		expect(commented.$Element().tagName).toBe('SECTION');
		expect(commented.$Element().textContent).toBe('one');
		expect(owner.$Element().tagName).not.toBe('DIV');
		expect(document.querySelectorAll('#mount .commented-child').length).toBe(1);
	});

	it('a change a component emits also goes up the DOM as elemenx-change with the value, after its listeners', function () {
		var heard = [];
		var picker = mounted(Elemenx.Component(unique('ChangePicker'), {$Template: '<span class="change-picker"></span>'})());

		picker.$On('change', function (value) {
			heard.push('listener ' + value);
		});

		document.getElementById('mount').addEventListener('elemenx-change', function (event) {
			heard.push('dom ' + event.detail + ' ' + event.target.className);
		});

		picker.$Emit('change', 7);
		picker.$Emit('input', 8);

		expect(heard).toEqual(['listener 7', 'dom 7 change-picker']);
	});

	/* Regression: a row whose hooks wrote into its item made the effect of the list depend on it, and the rows came twice. */
	it('the hooks of a row of a *for that write into its item do not render the list again: each row comes once', async function () {
		var row = unique('HookRow');
		var holder = {Items: [{Name: 'a', Listeners: []}]};
		var listener = function () {};

		Elemenx.Component(row, {
			$Template: '<b>{{Item.Name}}</b>',
			Item: null,
			$OnReady: function () {
				this.Item.Listeners.push(listener);
			},
			$OnDestroy: function () {
				this.Item.Listeners.splice(this.Item.Listeners.indexOf(listener), 1);
			}
		});

		var owner = mounted(Elemenx.Component(unique('HookList'), {$Template: '<main><p class="hook-row" *for="item of Model.Items"><' + row + ' [Item]="item"></' + row + '></p></main>', Model: holder})());

		owner.Model.Items.push({Name: 'b', Listeners: []});

		await waitFor(function () {
			return owner.$Element().textContent === 'ab';
		}, 1000);

		expect(owner.$Element().querySelectorAll('.hook-row').length).toBe(2);
		expect(owner.$Element().textContent).toBe('ab');
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
	it('an event that $OnCreate or $OnReady emits reaches the listener of its tag, and $Parent() is its owner there', function () {
		var child = unique('EarlyChild');
		var parents = [];
		var owner;

		Elemenx.Component(child, {
			$Template: '<i>child</i>',
			$OnCreate: function () {
				parents.push(this.$Parent());

				this.$Emit('life', 'create');
			},
			$OnReady: function () {
				this.$Emit('life', 'ready');
			}
		});

		owner = mounted(Elemenx.Component(unique('EarlyOwner'), {
			$Template: '<div><' + child + ' (life)="Heard"></' + child + '><b class="early-log">{{Log.join(",")}}</b></div>',
			Log: [],
			Heard: function (value) {
				this.Log = this.Log.concat([value]);
			}
		})({}));

		expect(owner.$Element().querySelector('.early-log').textContent).toBe('create,ready');
		expect(parents.length).toBe(1);
		expect(parents[0]).toBe(owner);
	});
});
