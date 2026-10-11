import { describe, expect, test, beforeEach } from 'vitest';
import { tick } from '../setup.js';
import '../../elemenx.js';

var serial = 0;

function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

describe('Regression: directive syntax', function () {
	beforeEach(function () {
		document.body.innerHTML = '';
	});

	test('*if, *for and *key compile and disappear from live DOM', function () {
		var name = unique('DirectiveSyntax');
		var factory = Elemenx.Component(name, {
			$Template: '<section><span *if="Visible">visible</span><b *for="item of Items" *key="item.id">{{item.name}}</b></section>'
		});
		var child = factory({Visible: true, Items: [{id: 1, name: 'one'}, {id: 2, name: 'two'}]});

		document.body.appendChild(child.$Element());

		expect(child.$Element().textContent).toContain('visible');
		expect(child.$Element().textContent).toContain('one');
		expect(child.$Element().textContent).toContain('two');
		expect(child.$Element().querySelector('[\\*if]')).toBe(null);
		expect(child.$Element().querySelector('[\\*for]')).toBe(null);
		expect(child.$Element().querySelector('[\\*key]')).toBe(null);

		child.$Destroy();
	});

	test('*outlet and #ref register then disappear from live DOM', function () {
		var name = unique('MetadataSyntax');
		var factory = Elemenx.Component(name, {
			$Template: '<section><main *outlet="Main"></main><input #search></section>'
		});
		var child = factory({});

		document.body.appendChild(child.$Element());

		expect(child.$Ref('search').tagName).toBe('INPUT');
		expect(child.$Element().querySelector('[\\*outlet]')).toBe(null);
		expect(child.$Element().querySelector('[\\#search]')).toBe(null);

		child.$Destroy();
	});

	test('bindings and events are consumed from live DOM', function () {
		var name = unique('ConsumedSyntax');
		var hits = 0;
		var factory = Elemenx.Component(name, {
			$Template: '<button [title]="Tooltip" (click)="Hit">hit</button>',
			Hit: function () { hits++; }
		});
		var child = factory({Tooltip: 'hello'});

		document.body.appendChild(child.$Element());

		expect(child.$Element().title).toBe('hello');
		expect(child.$Element().hasAttribute('[title]')).toBe(false);
		expect(child.$Element().hasAttribute('(click)')).toBe(false);

		child.$Element().click();

		expect(hits).toBe(1);

		child.$Destroy();
	});

	test('classic *for keeps raw less-than expression', function () {
		var name = unique('RawForSyntax');
		var factory = Elemenx.Component(name, {
			$Template: '<div><i *for="i = 0; i < 3; i++">{{i}}</i></div>'
		});
		var child = factory({});

		document.body.appendChild(child.$Element());

		expect(child.$Element().textContent).toBe('012');

		child.$Destroy();
	});
	test('[(value)], [(checked)] and [(selected)] are consumed and synchronize explicit targets', function () {
		var name = unique('TwoWaySyntax');
		var factory = Elemenx.Component(name, {
			$Template: '<div><input class="value" [(value)]="Text"><input class="checked" type="checkbox" [(checked)]="Enabled"><select class="selected" [(selected)]="Choice"><option value="one">One</option><option value="two">Two</option></select></div>'
		});
		var child = factory({Text: 'A', Enabled: true, Choice: 'two'});
		var root = child.$Element();
		var value = root.querySelector('.value');
		var checked = root.querySelector('.checked');
		var selected = root.querySelector('.selected');

		document.body.appendChild(root);

		expect(value.value).toBe('A');
		expect(checked.checked).toBe(true);
		expect(selected.value).toBe('two');
		expect(value.hasAttribute('[(value)]')).toBe(false);
		expect(checked.hasAttribute('[(checked)]')).toBe(false);
		expect(selected.hasAttribute('[(selected)]')).toBe(false);

		value.value = 'B';

		value.dispatchEvent(new Event('input', {bubbles: true}));

		checked.checked = false;

		checked.dispatchEvent(new Event('change', {bubbles: true}));

		selected.value = 'one';

		selected.dispatchEvent(new Event('change', {bubbles: true}));

		expect(child.Text).toBe('B');
		expect(child.Enabled).toBe(false);
		expect(child.Choice).toBe('one');

		child.Text = 'C';
		child.Enabled = true;
		child.Choice = 'two';

		expect(value.value).toBe('C');
		expect(checked.checked).toBe(true);
		expect(selected.value).toBe('two');

		child.$Destroy();
	});

	test('explicit two-way bindings use flat component definition values as their initial reactive source', function () {
		var name = unique('TwoWayDefinitionState');
		var factory = Elemenx.Component(name, {
			$Template: '<div><input class="value" [(value)]="Text"><input class="checked" type="checkbox" [(checked)]="Enabled"><select class="selected" [(selected)]="Choice"><option value="one">One</option><option value="two">Two</option></select><span class="state">{{Text}}|{{Enabled}}|{{Choice}}</span></div>',
			Text: 'Initial',
			Enabled: true,
			Choice: 'two'
		});
		var child = factory();
		var root = child.$Element();
		var value = root.querySelector('.value');
		var checked = root.querySelector('.checked');
		var selected = root.querySelector('.selected');

		document.body.appendChild(root);

		expect(value.value).toBe('Initial');
		expect(checked.checked).toBe(true);
		expect(selected.value).toBe('two');
		expect(root.querySelector('.state').textContent).toBe('Initial|true|two');

		value.value = 'Changed';

		value.dispatchEvent(new Event('input', {bubbles: true}));

		checked.checked = false;

		checked.dispatchEvent(new Event('change', {bubbles: true}));

		selected.value = 'one';

		selected.dispatchEvent(new Event('change', {bubbles: true}));

		expect(root.querySelector('.state').textContent).toBe('Changed|false|one');

		child.$Destroy();
	});

	test('runtime structural and projection hosts do not expose internal data-* metadata', function () {
		var childName = unique('ProjectionMetadataChild');
		var parentName = unique('ProjectionMetadataParent');

		Elemenx.Component(childName, {$Template: '<section><slot></slot></section>'});

		var factory = Elemenx.Component(parentName, {
			$Template: '<div><' + childName + '><span *if="Visible">Projected</span></' + childName + '></div>'
		});
		var component = factory({Visible: true});

		document.body.appendChild(component.$Element());

		expect(component.$Element().querySelector('[data-ui-slot-group]')).toBeNull();
		expect(component.$Element().querySelector('[data-ui-structural-root]')).toBeNull();

		component.$Destroy();
	});

	test('an empty slot keeps the structural hosts that follow it in place', function () {
		var badgeName = unique('SlotSiblingBadge');
		var childName = unique('SlotSiblingChild');

		Elemenx.Component(badgeName, {$Template: '<em>{{Text}}</em>', Text: ''});
		Elemenx.Component(childName, {
			$Template: '<div><slot></slot><b *if="Show">after</b><' + badgeName + ' *if="Show" [text]="Label"></' + badgeName + '></div>',
			Show: true,
			Label: 'badge'
		});

		var empty = Elemenx.Component(childName)({});
		var parent = Elemenx.Component(unique('SlotSiblingParent'), {
			$Template: '<section><' + childName + '><i>projected</i></' + childName + '></section>'
		})({});

		document.body.appendChild(empty.$Element());
		document.body.appendChild(parent.$Element());

		expect(empty.$Element().querySelector('slot')).toBeNull();
		expect(empty.$Element().querySelector('b').textContent).toBe('after');
		expect(empty.$Element().querySelector('em').textContent).toBe('badge');
		expect(parent.$Element().querySelector('i').textContent).toBe('projected');
		expect(parent.$Element().querySelector('b').textContent).toBe('after');

		empty.$Destroy();
		parent.$Destroy();
	});

	test('a component projected into a slot receives its [prop] bindings', function () {
		var leafName = unique('ProjectedLeaf');
		var frameName = unique('ProjectedFrame');

		Elemenx.Component(leafName, {$Template: '<em>{{Text}}:{{Fixed}}</em>', Text: '', Fixed: ''});
		Elemenx.Component(frameName, {$Template: '<section><slot></slot></section>'});

		var parent = Elemenx.Component(unique('ProjectedHost'), {
			$Template: '<div><' + frameName + '><' + leafName + ' [text]="Value" Fixed="static"></' + leafName + '></' + frameName + '></div>',
			Value: 'bound'
		})({});

		document.body.appendChild(parent.$Element());

		expect(parent.$Element().querySelector('em').textContent).toBe('bound:static');

		parent.$Update({Value: 'next'});

		expect(parent.$Element().querySelector('em').textContent).toBe('next:static');

		parent.$Destroy();
	});

	test('a component named like a native element receives [prop] inputs that the element would refuse', function () {
		var parentName = unique('NativeNamedParent');

		Elemenx.Component('Select', {$Template: '<ul><li *for="option of Options">{{option}}</li></ul>', Options: []});

		var parent = Elemenx.Component(parentName, {
			$Template: '<div><Select [options]="Items" /></div>',
			Items: ['a', 'b']
		})({});

		document.body.appendChild(parent.$Element());

		expect(parent.$Element().querySelectorAll('li').length).toBe(2);

		parent.$Destroy();
	});

	test('a keyed collection keeps its elements in place, so the focus survives an update', function () {
		var name = unique('KeyedFocus');
		var component = Elemenx.Component(name, {
			$Template: '<ul><li *for="item of Items" *key="item"><input [class.active]="item === Active" [value]="item" /></li></ul>',
			Items: ['a', 'b', 'c'],
			Active: 'a'
		})({});
		var inputs;

		document.body.appendChild(component.$Element());

		inputs = component.$Element().querySelectorAll('input');

		inputs[1].focus();

		component.$Update({Active: 'b'});

		expect(document.activeElement).toBe(inputs[1]);
		expect(inputs[1].classList.contains('active')).toBe(true);

		component.$Update({Items: ['c', 'a', 'b']});

		expect(Array.prototype.map.call(component.$Element().querySelectorAll('input'), function (input) {
			return input.value;
		})).toEqual(['c', 'a', 'b']);
		expect(component.$Element().querySelectorAll('input')[2]).toBe(inputs[1]);

		component.$Destroy();
	});

	test('root structural host does not expose internal data-* metadata', function () {
		var name = unique('StructuralRootMetadata');
		var factory = Elemenx.Component(name, {$Template: '<div *if="Visible">Visible</div>'});
		var component = factory({Visible: true});

		document.body.appendChild(component.$Element());

		expect(component.$Element().hasAttribute('data-ui-structural-root')).toBe(false);
		expect(component.$Element().querySelector('[data-ui-structural-root]')).toBeNull();

		component.$Destroy();
	});

	test('component definition values are reactive flat instance properties without public State', async function () {
		var name = unique('FlatComponentValues');
		var factory = Elemenx.Component(name, {
			$Template: '<button (click)="Increment">{{Count}} / {{Label}}</button>',
			Count: 1,
			Label: 'Ready',
			Increment: function () {
				this.Count++;
				this.Label = 'Changed';
			}
		});
		var component = factory();

		expect(component.State).toBeUndefined();
		expect(component.Count).toBe(1);
		expect(component.Label).toBe('Ready');

		component.$Element().click();

		await tick();

		expect(component.Count).toBe(2);
		expect(component.Label).toBe('Changed');
		expect(component.$Element().textContent).toBe('2 / Changed');

		component.$Destroy();
	});

	test('incoming component values override flat definition defaults and stay reactive', async function () {
		var name = unique('FlatComponentProps');
		var factory = Elemenx.Component(name, {
			$Template: '<span>{{Value}} / {{Extra}}</span>',
			Value: 'default'
		});
		var component = factory({Value: 'prop', Extra: 'extra'});

		expect(component.Value).toBe('prop');
		expect(component.Extra).toBe('extra');

		component.Extra = 'changed';

		await tick();

		expect(component.$Element().textContent).toBe('prop / changed');

		component.$Destroy();
	});

	test('component values cannot shadow the Component API', function () {
		var name = unique('FlatComponentCollision');
		var factory = Elemenx.Component(name, {$Template: '<div></div>'});

		expect(function () {
			factory({$Router: 'value'});
		}).toThrow(/reserved \$ namespace: \$Router/);
	});


	test('custom directive runs Create, reactive Update and Destroy with private Data', async function () {
		var directive = unique('custom').toLowerCase();
		var name = unique('CustomDirectiveLifecycle');
		var calls = [];

		Elemenx.Directive(directive, {
			$OnCreate: function (context) {
				context.Data.Created = true;

				calls.push('create:' + context.Expression);
			},
			$OnUpdate: function (context) {
				calls.push('update:' + context.Value + ':' + context.Data.Created);

				context.Element.textContent = String(context.Value);
			},
			$OnDestroy: function (context) {calls.push('destroy:' + context.Data.Created);}
		});

		var factory = Elemenx.Component(name, {$Template: '<div *' + directive + '="Label"></div>', Label: 'one'});
		var component = factory();

		document.body.appendChild(component.$Element());

		expect(component.$Element().hasAttribute('*' + directive)).toBe(false);
		expect(component.$Element().textContent).toBe('one');
		expect(calls).toEqual(['create:Label', 'update:one:true']);

		component.Label = 'two';

		await tick();

		expect(component.$Element().textContent).toBe('two');
		expect(calls).toEqual(['create:Label', 'update:one:true', 'update:two:true']);

		component.$Destroy();

		expect(calls[calls.length - 1]).toBe('destroy:true');
	});

	test('custom directive without expression follows structural recreation lifecycle', async function () {
		var directive = unique('presence').toLowerCase();
		var name = unique('CustomDirectiveStructural');
		var created = 0;
		var destroyed = 0;
		var updates = 0;

		Elemenx.Directive(directive, {
			$OnCreate: function (context) {
				created++;

				expect(context.Expression).toBe('');
			},
			$OnUpdate: function (context) {
				updates++;

				expect(context.Value).toBeUndefined();
			},
			$OnDestroy: function () {destroyed++;}
		});

		var factory = Elemenx.Component(name, {$Template: '<section><span *if="Visible" *' + directive + '>visible</span></section>', Visible: true});
		var component = factory();

		document.body.appendChild(component.$Element());

		expect(created).toBe(1);
		expect(updates).toBe(1);
		expect(component.$Element().querySelector('[\\*' + directive + ']')).toBeNull();

		component.Visible = false;

		await tick();

		expect(destroyed).toBe(1);

		component.Visible = true;

		await tick();

		expect(created).toBe(2);
		expect(updates).toBe(2);

		component.$Destroy();

		expect(destroyed).toBe(2);
	});

	test('custom directive expression preserves raw comparison operators', function () {
		var directive = unique('compare').toLowerCase();
		var name = unique('CustomDirectiveExpression');
		var seen;

		Elemenx.Directive(directive, {$OnUpdate: function (context) {seen = context.Value;}});

		var factory = Elemenx.Component(name, {$Template: '<div *' + directive + '="Count < Limit"></div>', Count: 1, Limit: 2});
		var component = factory();

		expect(seen).toBe(true);

		component.$Destroy();
	});


	test('built-in and custom directives share one registry without public name hardcoding', function () {
		var directive = unique('registry').toLowerCase();
		var definition = {$OnUpdate: function () {}};

		expect(Elemenx.Directive(directive, definition)).toBe(definition);
		expect(function () {
			Elemenx.Directive(directive, {});
		}).toThrow(/already registered/);
		expect(function () {
			Elemenx.Directive('if', {});
		}).toThrow(/already registered/);
	});

	test('custom directive registration defaults to behavioral lifecycle', function () {
		var directive = unique('behavioral').toLowerCase();
		var name = unique('DirectiveRegistryBehavior');
		var updated = 0;

		Elemenx.Directive(directive, {
			$OnUpdate: function () {
				updated++;
			}
		});

		var factory = Elemenx.Component(name, {
			$Template: '<div *' + directive + '="Enabled"></div>',
			Enabled: true
		});
		var component = factory();

		expect(updated).toBe(1);

		component.$Destroy();
	});


	test('custom Structural directive uses the same Mount/Unmount host as built-in if', function () {
		var directive = unique('visible').toLowerCase();
		var name = unique('CustomStructuralHost');
		var created = 0;
		var destroyed = 0;

		Elemenx.Directive(directive, {
			Structural: true,
			$OnCreate: function () { created++; },
			$OnUpdate: function (context) {
				if (context.Value) context.Mount();
				else context.Unmount();
			},
			$OnDestroy: function () { destroyed++; }
		});

		var component = Elemenx.Component(name, {
			$Template: '<div><button *' + directive + '="Visible" (click)="Hit">Visible</button></div>',
			Visible: false,
			Hits: 0,
			Hit: function () { this.Hits++; }
		})();

		expect(created).toBe(1);
		expect(component.$Element().querySelector('button')).toBe(null);

		component.Visible = true;

		var button = component.$Element().querySelector('button');

		expect(button).not.toBe(null);

		button.dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(component.Hits).toBe(1);

		component.Visible = false;

		expect(component.$Element().querySelector('button')).toBe(null);

		component.$Destroy();

		expect(destroyed).toBe(1);
	});

	test('built-in if remains compatible through Structural Host', function () {
		var component = Elemenx.Component(unique('BuiltInIfStructuralHost'), {
			$Template: '<div><span *if="Visible">Hello</span></div>',
			Visible: false
		})();

		expect(component.$Element().querySelector('span')).toBe(null);

		component.Visible = true;

		expect(component.$Element().querySelector('span').textContent).toBe('Hello');

		component.Visible = false;

		expect(component.$Element().querySelector('span')).toBe(null);

		component.$Destroy();
	});


	test('structural child component is recreated with current parent props', function () {
		var childName = unique('StructuralPropsChild');
		var parentName = unique('StructuralPropsParent');

		Elemenx.Component(childName, {$Template: '<span class="structural-props-child">{{value}}</span>', value: ''});

		var parent = Elemenx.Component(parentName, {
			$Template: '<div><' + childName + ' *if="Show" value="{{value}}"></' + childName + '></div>',
			Show: true,
			value: 'A'
		})();

		expect(parent.$Element().querySelector('.structural-props-child').textContent).toBe('A');

		parent.Show = false;
		parent.value = 'B';
		parent.Show = true;

		expect(parent.$Element().querySelector('.structural-props-child').textContent).toBe('B');

		parent.$Destroy();
	});

	test('structural child component keeps local state isolated across recreate', function () {
		var childName = unique('StructuralIsolationChild');
		var parentName = unique('StructuralIsolationParent');

		Elemenx.Component(childName, {
			$Template: '<input class="structural-isolation-child" [(value)]="Value">',
			Value: 'CHILD'
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<div><span class="structural-isolation-parent">{{Value}}</span><' + childName + ' *if="Show"></' + childName + '></div>',
			Show: true,
			Value: 'PARENT'
		})();
		var input = parent.$Element().querySelector('.structural-isolation-child');

		input.value = 'LOCAL';

		input.dispatchEvent(new Event('input', {bubbles: true}));

		expect(parent.Value).toBe('PARENT');

		parent.Show = false;
		parent.Show = true;

		expect(parent.Value).toBe('PARENT');
		expect(parent.$Element().querySelector('.structural-isolation-parent').textContent).toBe('PARENT');
		expect(parent.$Element().querySelector('.structural-isolation-child').value).toBe('CHILD');

		parent.$Destroy();
	});


	test('built-in for is registered as a collection structural capability', function () {
		var component = Elemenx.Component(unique('CollectionCapabilityFor'), {
			$Template: '<ul><li *for="item of Items" *key="item.id">{{item.name}}</li></ul>',
			Items: [
				{id: 1, name: 'One'},
				{id: 2, name: 'Two'}
			]
		})();

		var items = component.$Element().querySelectorAll('li');

		expect(items.length).toBe(2);
		expect(items[0].textContent).toBe('One');
		expect(items[1].textContent).toBe('Two');

		component.Items = [
			{id: 2, name: 'Two updated'},
			{id: 3, name: 'Three'}
		];

		items = component.$Element().querySelectorAll('li');

		expect(items.length).toBe(2);
		expect(items[0].textContent).toBe('Two updated');
		expect(items[1].textContent).toBe('Three');

		component.$Destroy();
	});


	test('custom collection structural directive uses context.Render keyed reconciliation', function () {
		var directive = unique('repeat').toLowerCase();
		var name = unique('CustomCollectionRender');

		Elemenx.Directive(directive, {
			Structural: true,
			Collection: true,
			$OnUpdate: function (context) {
				context.Render(context.Source(context.Expression), {
					Mode: 'of',
					Variable: 'row',
					Key: context.Argument('key')
				});
			}
		});

		var component = Elemenx.Component(name, {
			$Template: '<ul><li *' + directive + '="Rows" *key="row.id">{{row.name}}</li></ul>',
			Rows: [
				{id: 1, name: 'One'},
				{id: 2, name: 'Two'}
			]
		})();

		var first = component.$Element().querySelectorAll('li');
		var one = first[0];
		var two = first[1];

		expect(first.length).toBe(2);
		expect(first[0].textContent).toBe('One');
		expect(first[1].textContent).toBe('Two');

		component.Rows = [
			{id: 2, name: 'Two updated'},
			{id: 1, name: 'One updated'}
		];

		var second = component.$Element().querySelectorAll('li');

		expect(second.length).toBe(2);
		expect(second[0]).toBe(two);
		expect(second[1]).toBe(one);
		expect(second[0].textContent).toBe('Two updated');
		expect(second[1].textContent).toBe('One updated');

		component.$Destroy();
	});


	test('collection key remains an argument after directive hardcode audit', function () {
		var component = Elemenx.Component(unique('KeyArgumentAudit'), {
			$Template: '<div><span *for="item of Items" *key="item.id">{{item.name}}</span></div>',
			Items: [
				{id: 1, name: 'One'},
				{id: 2, name: 'Two'}
			]
		})();
		var first = component.$Element().querySelectorAll('span');
		var one = first[0];
		var two = first[1];

		component.Items = [
			{id: 2, name: 'Two updated'},
			{id: 1, name: 'One updated'}
		];

		var second = component.$Element().querySelectorAll('span');

		expect(second[0]).toBe(two);
		expect(second[1]).toBe(one);

		component.$Destroy();
	});


	test('component root accepts a custom Structural directive without built-in if knowledge', function () {
		var directive = unique('rootgate').toLowerCase();
		var name = unique('RootCustomStructural');

		Elemenx.Directive(directive, {
			Structural: true,
			$OnUpdate: function (context) {
				if (context.Value) context.Mount();
				else context.Unmount();
			}
		});

		var component = Elemenx.Component(name, {
			$Template: '<section *' + directive + '="Visible"><strong class="root-custom-structural">{{Label}}</strong></section>',
			Visible: true,
			Label: 'One'
		})();

		expect(component.$Element().querySelector('.root-custom-structural').textContent).toBe('One');

		component.Visible = false;

		expect(component.$Element().querySelector('.root-custom-structural')).toBe(null);

		component.Label = 'Two';
		component.Visible = true;

		expect(component.$Element().querySelector('.root-custom-structural').textContent).toBe('Two');

		component.$Destroy();
	});


	test('directive host selection is registry metadata rather than compiler collection special-case', function () {
		var directive = unique('hostrepeat').toLowerCase();
		var name = unique('DirectiveHostMetadata');

		Elemenx.Directive(directive, {
			Structural: true,
			Collection: true,
			$OnUpdate: function (context) {
				context.Render(context.Source(context.Expression), {
					Mode: 'of',
					Variable: 'entry',
					Key: context.Argument('key')
				});
			}
		});

		var component = Elemenx.Component(name, {
			$Template: '<div><i *' + directive + '="Entries" *key="entry.id">{{entry.value}}</i></div>',
			Entries: [
				{id: 'a', value: 'A'},
				{id: 'b', value: 'B'}
			]
		})();

		var first = component.$Element().querySelectorAll('i');
		var a = first[0];
		var b = first[1];

		component.Entries = [
			{id: 'b', value: 'B2'},
			{id: 'a', value: 'A2'}
		];

		var second = component.$Element().querySelectorAll('i');

		expect(second[0]).toBe(b);
		expect(second[1]).toBe(a);
		expect(second[0].textContent).toBe('B2');
		expect(second[1].textContent).toBe('A2');

		component.$Destroy();
	});


	test('custom Structural directive controls a child Component through its lifecycle', function () {
		var directive = unique('componentgate').toLowerCase();
		var childName = unique('StructuralLifecycleChild');
		var parentName = unique('StructuralLifecycleParent');
		var created = 0;
		var updated = 0;
		var destroyed = 0;

		Elemenx.Directive(directive, {
			Structural: true,
			$OnCreate: function () {
				created++;
			},
			$OnUpdate: function (context) {
				updated++;

				if (context.Value === 'open') context.Mount();
				else context.Unmount();
			},
			$OnDestroy: function () {
				destroyed++;
			}
		});

		Elemenx.Component(childName, {
			$Template: '<strong class="custom-component-host">{{value}}</strong>',
			value: ''
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<div><' + childName + ' *' + directive + '="Gate" value="{{Value}}"></' + childName + '></div>',
			Gate: 'closed',
			Value: 'A'
		})();

		expect(parent.$Element().querySelector('.custom-component-host')).toBe(null);
		expect(created).toBe(1);

		parent.Gate = 'open';

		expect(parent.$Element().querySelector('.custom-component-host').textContent).toBe('A');

		parent.Value = 'B';

		expect(parent.$Element().querySelector('.custom-component-host').textContent).toBe('B');

		parent.Gate = 'closed';

		expect(parent.$Element().querySelector('.custom-component-host')).toBe(null);
		expect(updated).toBeGreaterThan(1);

		parent.$Destroy();

		expect(destroyed).toBe(1);
	});


	test('directive host dispatch remains generic after ownership audit', function () {
		var directive = unique('hostregistry').toLowerCase();
		var name = unique('DirectiveHostRegistry');

		Elemenx.Directive(directive, {
			Structural: true,
			$OnUpdate: function (context) {
				if (context.Value) context.Mount();
				else context.Unmount();
			}
		});

		var component = Elemenx.Component(name, {
			$Template: '<div><span *' + directive + '="Visible" class="host-registry-proof">OK</span></div>',
			Visible: true
		})();

		expect(component.$Element().querySelector('.host-registry-proof').textContent).toBe('OK');

		component.Visible = false;

		expect(component.$Element().querySelector('.host-registry-proof')).toBe(null);

		component.Visible = true;

		expect(component.$Element().querySelector('.host-registry-proof').textContent).toBe('OK');

		component.$Destroy();
	});


	test('custom Structural host stops reactive updates after owner Destroy', function () {
		var directive = unique('cleanupgate').toLowerCase();
		var name = unique('StructuralCleanupOwner');
		var updates = 0;
		var destroys = 0;

		Elemenx.Directive(directive, {
			Structural: true,
			$OnUpdate: function (context) {
				updates++;

				if (context.Value) context.Mount();
				else context.Unmount();
			},
			$OnDestroy: function () {
				destroys++;
			}
		});

		var component = Elemenx.Component(name, {
			$Template: '<div><span *' + directive + '="Visible">Owned</span></div>',
			Visible: true
		})();

		expect(component.$Element().textContent).toContain('Owned');

		var beforeDestroy = updates;

		component.$Destroy();

		expect(destroys).toBe(1);
		expect(updates).toBe(beforeDestroy);
	});

	test('custom collection host destroys removed keyed child Components exactly once', function () {
		var directive = unique('cleanuprepeat').toLowerCase();
		var childName = unique('CollectionCleanupChild');
		var parentName = unique('CollectionCleanupParent');
		var destroyed = [];

		Elemenx.Directive(directive, {
			Structural: true,
			Collection: true,
			$OnUpdate: function (context) {
				context.Render(context.Source(context.Expression), {
					Mode: 'of',
					Variable: 'item',
					Key: context.Argument('key')
				});
			}
		});

		Elemenx.Component(childName, {
			$Template: '<b class="collection-cleanup-child">{{id}}</b>',
			id: '',
			$OnDestroy: function () {
				destroyed.push(this.id);
			}
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<div><' + childName + ' *' + directive + '="Items" *key="item.id" id="{{item.id}}"></' + childName + '></div>',
			Items: [
				{id: 'a'},
				{id: 'b'}
			]
		})();

		expect(parent.$Element().querySelectorAll('.collection-cleanup-child').length).toBe(2);

		parent.Items = [{id: 'b'}];

		expect(destroyed.filter(function (id) { return id === 'a'; }).length).toBe(1);
		expect(parent.$Element().querySelectorAll('.collection-cleanup-child').length).toBe(1);

		parent.$Destroy();

		expect(destroyed.filter(function (id) { return id === 'a'; }).length).toBe(1);
		expect(destroyed.filter(function (id) { return id === 'b'; }).length).toBe(1);
	});

	test('nested custom Structural hosts destroy inner directive once with their owner', function () {
		var outerDirective = unique('outercleanup').toLowerCase();
		var innerDirective = unique('innercleanup').toLowerCase();
		var name = unique('NestedStructuralCleanup');
		var outerDestroyed = 0;
		var innerDestroyed = 0;

		Elemenx.Directive(outerDirective, {
			Structural: true,
			$OnUpdate: function (context) {
				if (context.Value) context.Mount();
				else context.Unmount();
			},
			$OnDestroy: function () {
				outerDestroyed++;
			}
		});

		Elemenx.Directive(innerDirective, {
			Structural: true,
			$OnUpdate: function (context) {
				if (context.Value) context.Mount();
				else context.Unmount();
			},
			$OnDestroy: function () {
				innerDestroyed++;
			}
		});

		var component = Elemenx.Component(name, {
			$Template: '<div><section *' + outerDirective + '="Outer"><i *' + innerDirective + '="Inner">Nested</i></section></div>',
			Outer: true,
			Inner: true
		})();

		component.Outer = false;

		expect(innerDestroyed).toBe(1);

		component.Outer = true;

		expect(component.$Element().textContent).toContain('Nested');

		component.$Destroy();

		expect(outerDestroyed).toBe(1);
		expect(innerDestroyed).toBe(2);
	});




	test('Component [prop] uses the same full expression binding syntax as DOM bindings', function () {
		var childName = unique('ExpressionBindingChild');
		var parentName = unique('ExpressionBindingParent');

		Elemenx.Component(childName, {
			$Template: '<div class="component-expression-binding">{{foo}}|{{flag}}</div>',
			foo: '',
			flag: ''
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<main><' + childName + ' [foo]="Value" [flag]="Enabled ? \'a\' : false"></' + childName + '></main>',
			Value: 'first',
			Enabled: true
		})();

		expect(parent.$Element().querySelector('.component-expression-binding').textContent).toBe('first|a');

		parent.Value = 'second';
		parent.Enabled = false;

		expect(parent.$Element().querySelector('.component-expression-binding').textContent).toBe('second|false');

		parent.$Destroy();
	});

	test('DOM [property] evaluates literals and conditional expressions', function () {
		var name = unique('DOMExpressionBinding');
		var component = Elemenx.Component(name, {
			$Template: '<div><input [value]="\'myString\'"><input class="conditional-expression" [disabled]="Enabled ? true : false"></div>',
			Enabled: false
		})();
		var inputs = component.$Element().querySelectorAll('input');

		expect(inputs[0].value).toBe('myString');
		expect(inputs[1].disabled).toBe(false);

		component.Enabled = true;

		expect(inputs[1].disabled).toBe(true);

		component.$Destroy();
	});


	test('Component [prop] survives DOM binding collection before structural compilation', function () {
		var childName = unique('BoundaryExpressionChild');
		var parentName = unique('BoundaryExpressionParent');

		Elemenx.Component(childName, {
			$Template: '<div class="boundary-expression-child">{{value}}</div>',
			value: ''
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<section><' + childName + ' [value]="Source"></' + childName + '></section>',
			Source: 'preserved'
		})();

		expect(parent.$Element().querySelector('.boundary-expression-child').textContent).toBe('preserved');

		parent.$Destroy();
	});


	test('Component binding target supports nested property and array paths', function () {
		var childName = unique('NestedBindingTargetChild');
		var parentName = unique('NestedBindingTargetParent');

		Elemenx.Component(childName, {
			$Template: '<div class="nested-binding-target">{{prop.foo.bar[0].baz}}</div>',
			prop: {
				foo: {
					bar: [
						{baz: 'default'}
					]
				}
			}
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<main><' + childName + ' [prop.foo.bar[0].baz]="Value"></' + childName + '></main>',
			Value: 'first'
		})();

		expect(parent.$Element().querySelector('.nested-binding-target').textContent).toBe('first');

		parent.Value = 'second';

		expect(parent.$Element().querySelector('.nested-binding-target').textContent).toBe('second');

		parent.$Destroy();
	});

	test('Component binding target path may build its local prop patch graph', function () {
		var childName = unique('NestedBindingPatchChild');
		var parentName = unique('NestedBindingPatchParent');

		Elemenx.Component(childName, {
			$Template: '<div class="nested-binding-patch">{{config.items[0].name}}</div>',
			config: {
				items: [
					{name: 'default'}
				]
			}
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<main><' + childName + ' [config.items[0].name]="Name"></' + childName + '></main>',
			Name: 'created'
		})();

		expect(parent.$Element().querySelector('.nested-binding-patch').textContent).toBe('created');

		parent.$Destroy();
	});


	test('directive policy rejects multiple structural directives on one host', function () {
		var first = unique('PolicyStructuralA').toLowerCase();
		var second = unique('PolicyStructuralB').toLowerCase();

		Elemenx.Directive(first, {Structural: true});
		Elemenx.Directive(second, {Structural: true});

		expect(function () {
			Elemenx.Component(unique('PolicyStructuralOwner'), {
				$Template: '<main><span *' + first + '="true" *' + second + '="true">x</span></main>'
			})();
		}).toThrow(/one structural directive per host/);
	});

	test('directive policy composes structural directives explicitly through nesting', function () {
		var name = unique('PolicyNestedStructural');
		var component = Elemenx.Component(name, {
			$Template: '<main><section *if="Outer"><span *for="item of Items" *key="item.id">{{item.name}}</span></section></main>',
			Outer: true,
			Items: [{id: 1, name: 'one'}, {id: 2, name: 'two'}]
		})();

		expect(component.$Element().textContent).toContain('one');
		expect(component.$Element().textContent).toContain('two');

		component.Outer = false;

		expect(component.$Element().textContent).not.toContain('one');

		component.$Destroy();
	});

	test('directive policy rejects orphan or incompatible directive arguments', function () {
		expect(function () {
			Elemenx.Component(unique('PolicyOrphanArgument'), {
				$Template: '<main><span *key="ID">x</span></main>'
			})();
		}).toThrow(/has no compatible structural host/);

		expect(function () {
			Elemenx.Component(unique('PolicyWrongArgumentHost'), {
				$Template: '<main><span *if="Visible" *key="ID">x</span></main>',
				Visible: true,
				ID: 1
			})();
		}).toThrow(/has no compatible structural host/);
	});

	test('behavioral directives create and update in declaration order and destroy in reverse order', function () {
		var first = unique('PolicyBehaviorA').toLowerCase();
		var second = unique('PolicyBehaviorB').toLowerCase();
		var log = [];

		function behavior (name) {
			return {
				$OnCreate: function () {log.push('create:' + name);},
				$OnUpdate: function () {log.push('update:' + name);},
				$OnDestroy: function () {log.push('destroy:' + name);}
			};
		}

		Elemenx.Directive(first, behavior(first));
		Elemenx.Directive(second, behavior(second));

		var component = Elemenx.Component(unique('PolicyBehaviorOwner'), {
			$Template: '<main><span *' + first + '="Value" *' + second + '="Value"></span></main>',
			Value: 1
		})();

		expect(log.slice(0, 4)).toEqual([
			'create:' + first,
			'create:' + second,
			'update:' + first,
			'update:' + second
		]);

		component.$Destroy();

		expect(log.slice(-2)).toEqual(['destroy:' + second, 'destroy:' + first]);
	});

});