import { describe, expect, test, beforeEach } from 'vitest';
import '../../elemenx.js';

var serial = 0;

function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

describe('Regression: binding and event syntax', function () {
	beforeEach(function () {
		document.body.innerHTML = '';
	});

	test('square brackets bind expressions and preserve raw expression text', function () {
		var name = unique('BindingSyntax');
		var factory = Elemenx.Component(name, {
			$Template: '<button [title]="Count < 2 ? \'low\' : \'high\'" [disabled]="Disabled">{{Count}}</button>'
		});

		var child = factory({Count: 1, Disabled: false});

		document.body.appendChild(child.$Element());

		expect(child.$Element().title).toBe('low');
		expect(child.$Element().disabled).toBe(false);

		child.$Update({Count: 3, Disabled: true});

		expect(child.$Element().title).toBe('high');
		expect(child.$Element().disabled).toBe(true);

		child.$Destroy();
	});

	test('round brackets bind native DOM events', function () {
		var name = unique('EventSyntax');
		var hits = 0;
		var factory = Elemenx.Component(name, {
			$Template: '<button (click)="Hit">hit</button>',
			Hit: function () {
				hits++;
			}
		});

		var child = factory({});

		document.body.appendChild(child.$Element());

		child.$Element().click();

		expect(hits).toBe(1);

		child.$Destroy();
	});

	test('round brackets bind component events and are not exposed as props', function () {
		var childName = unique('EventChild');
		var parentName = unique('EventParent');
		var received = null;

		Elemenx.Component(childName, {
			$Template: '<button (click)="Fire">fire</button>',
			Fire: function () {
				this.$Emit('remove', 'payload');
			}
		});

		var parentFactory = Elemenx.Component(parentName, {
			$Template: '<section><' + childName + ' (remove)="Removed"></' + childName + '></section>',
			Removed: function (value) {
				received = value;
			}
		});

		var parent = parentFactory({});

		document.body.appendChild(parent.$Element());

		parent.$Element().querySelector('button').click();

		expect(received).toBe('payload');

		parent.$Destroy();
	});

	test('binding target namespaces have explicit property and attribute semantics', function () {
		var name = unique('BindingTargets');
		var factory = Elemenx.Component(name, {
			$Template: '<button [disabled]="Disabled" [property.title]="PropertyTitle" [attribute.aria-hidden]="AriaHidden" [attribute.data-value]="DataValue">target</button>'
		});

		var child = factory({
			Disabled: true,
			PropertyTitle: 'property',
			AriaHidden: false,
			DataValue: 'one'
		});

		document.body.appendChild(child.$Element());

		expect(child.$Element().disabled).toBe(true);
		expect(child.$Element().title).toBe('property');
		expect(child.$Element().getAttribute('aria-hidden')).toBe('false');
		expect(child.$Element().getAttribute('data-value')).toBe('one');

		child.$Update({Disabled: false, AriaHidden: null, DataValue: undefined});

		expect(child.$Element().disabled).toBe(false);
		expect(child.$Element().hasAttribute('aria-hidden')).toBe(false);
		expect(child.$Element().hasAttribute('data-value')).toBe(false);

		child.$Destroy();
	});

	test('[class] owns an array while [class.name] owns one class and static classes survive', function () {
		var name = unique('ClassBindings');
		var factory = Elemenx.Component(name, {
			$Template: '<div class="static" [class]="Classes" [class.selected]="Selected"></div>'
		});

		var child = factory({Classes: ['card', 'selected'], Selected: false});

		document.body.appendChild(child.$Element());

		expect(child.$Element().classList.contains('static')).toBe(true);
		expect(child.$Element().classList.contains('card')).toBe(true);
		expect(child.$Element().classList.contains('selected')).toBe(false);

		child.$Update({Classes: ['large'], Selected: true});

		expect(child.$Element().classList.contains('static')).toBe(true);
		expect(child.$Element().classList.contains('card')).toBe(false);
		expect(child.$Element().classList.contains('large')).toBe(true);
		expect(child.$Element().classList.contains('selected')).toBe(true);

		child.$Destroy();
	});

	test('[style] owns an object while [style.name] owns one property and static styles survive', function () {
		var name = unique('StyleBindings');
		var factory = Elemenx.Component(name, {
			$Template: '<div style="position: relative; height: 10px" [style]="Styles" [style.height]="Height"></div>'
		});

		var child = factory({
			Styles: {width: '20px', height: '30px', '--accent': 'red'},
			Height: null
		});

		document.body.appendChild(child.$Element());

		expect(child.$Element().style.position).toBe('relative');
		expect(child.$Element().style.width).toBe('20px');
		expect(child.$Element().style.height).toBe('');
		expect(child.$Element().style.getPropertyValue('--accent')).toBe('red');

		child.$Update({
			Styles: {width: '40px', 'background-color': 'black'},
			Height: '50px'
		});

		expect(child.$Element().style.position).toBe('relative');
		expect(child.$Element().style.width).toBe('40px');
		expect(child.$Element().style.height).toBe('50px');
		expect(child.$Element().style.getPropertyValue('--accent')).toBe('');
		expect(child.$Element().style.backgroundColor).toBe('black');

		child.$Destroy();
	});

	test('[class] and [style] reject ambiguous value shapes', function () {
		var className = unique('StrictClass');
		var styleName = unique('StrictStyle');
		var classFactory = Elemenx.Component(className, {$Template: '<div [class]="Classes"></div>'});
		var styleFactory = Elemenx.Component(styleName, {$Template: '<div [style]="Styles"></div>'});

		expect(function () {
			classFactory({Classes: 'card'});
		}).toThrow();

		expect(function () {
			styleFactory({Styles: ['width: 10px']});
		}).toThrow();
	});
});