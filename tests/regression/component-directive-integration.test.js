import { describe, expect, test, beforeEach } from 'vitest';
import '../../elemenx.js';

var serial = 0;

function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

describe('Regression: Component / Binding / Directive integration', function () {
	beforeEach(function () {
		document.body.innerHTML = '';
	});

	test('Component bindings preserve definition key casing through the HTML parser', function () {
		var childName = unique('CaseBindingChild');
		var parentName = unique('CaseBindingParent');

		Elemenx.Component(childName, {
			$Template: '<strong class="case-binding-child">{{Value}}</strong>',
			Value: 'default'
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<main><' + childName + ' [Value]="Text"></' + childName + '></main>',
			Text: 'first'
		})();

		expect(parent.$Element().querySelector('.case-binding-child').textContent).toBe('first');

		parent.Text = 'second';

		expect(parent.$Element().querySelector('.case-binding-child').textContent).toBe('second');

		parent.$Destroy();
	});

	test('plain Component attributes preserve definition key casing through the HTML parser', function () {
		var childName = unique('CaseAttributeChild');
		var parentName = unique('CaseAttributeParent');

		Elemenx.Component(childName, {
			$Template: '<strong class="case-attribute-child">{{InitialValue}}</strong>',
			InitialValue: 'default'
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<main><' + childName + ' InitialValue="configured"></' + childName + '></main>'
		})();

		expect(parent.$Element().querySelector('.case-attribute-child').textContent).toBe('configured');

		parent.$Destroy();
	});

	test('nested Component binding paths recover definition object key casing', function () {
		var childName = unique('NestedCaseBindingChild');
		var parentName = unique('NestedCaseBindingParent');

		Elemenx.Component(childName, {
			$Template: '<strong class="nested-case-binding-child">{{Config.Items[0].Name}}</strong>',
			Config: {Items: [{Name: 'default'}]}
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<main><' + childName + ' [Config.Items[0].Name]="Text"></' + childName + '></main>',
			Text: 'nested'
		})();

		expect(parent.$Element().querySelector('.nested-case-binding-child').textContent).toBe('nested');

		parent.$Destroy();
	});

	test('structural Component recreation keeps case-correct props and child directives', function () {
		var directive = unique('casebehavior').toLowerCase();
		var childName = unique('StructuralCaseChild');
		var parentName = unique('StructuralCaseParent');
		var updates = [];

		Elemenx.Directive(directive, {
			$OnUpdate: function (context) {
				updates.push(context.Value);
			}
		});

		Elemenx.Component(childName, {
			$Template: '<article class="structural-case-child"><b *' + directive + '="Value">{{Value}}</b></article>',
			Value: 'default'
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<main><' + childName + ' *if="Show" [Value]="Text"></' + childName + '></main>',
			Show: true,
			Text: 'first'
		})();

		expect(parent.$Element().querySelector('.structural-case-child').textContent).toBe('first');

		parent.Text = 'second';

		expect(parent.$Element().querySelector('.structural-case-child').textContent).toBe('second');

		parent.Show = false;

		expect(parent.$Element().querySelector('.structural-case-child')).toBe(null);

		parent.Show = true;

		expect(parent.$Element().querySelector('.structural-case-child').textContent).toBe('second');
		expect(updates).toContain('first');
		expect(updates).toContain('second');

		parent.$Destroy();
	});

	test('nested structural recreation keeps keyed Components and behavioral directives lifecycle-safe', function () {
		var directive = unique('crosslifecycle').toLowerCase();
		var rowName = unique('CrossLifecycleRow');
		var parentName = unique('CrossLifecycleParent');
		var rowCreated = {};
		var rowDestroyed = {};
		var directiveCreated = {};
		var directiveDestroyed = {};
		var hits = [];

		function count (target, key) {
			target[key] = (target[key] || 0) + 1;
		}

		Elemenx.Directive(directive, {
			$OnUpdate: function (context) {
				if (context.Data.Key !== undefined) return;

				context.Data.Key = String(context.Value);

				count(directiveCreated, context.Data.Key);
			},
			$OnDestroy: function (context) {
				count(directiveDestroyed, context.Data.Key);
			}
		});

		Elemenx.Component(rowName, {
			$Template: '<button class="cross-row" *' + directive + '="ID" (click)="Select">{{ID}}:{{Label}}</button>',
			ID: '',
			Label: '',
			$OnCreate: function () {
				count(rowCreated, String(this.ID));
			},
			$OnDestroy: function () {
				count(rowDestroyed, String(this.ID));
			},
			Select: function () {
				this.$Emit('select', this.ID);
			}
		});

		var parent = Elemenx.Component(parentName, {
			$Template: '<main><section *if="Show"><' + rowName + ' *for="item of Items" *key="item.id" [ID]="item.id" [Label]="item.label" (select)="Select"></' + rowName + '></section></main>',
			Show: true,
			Items: [{id: 'a', label: 'A'}, {id: 'b', label: 'B'}],
			Select: function (id) {
				hits.push(id);
			}
		})();

		document.body.appendChild(parent.$Element());

		var initial = parent.$Element().querySelectorAll('.cross-row');
		var oldA = initial[0];
		var oldB = initial[1];

		expect(rowCreated).toEqual({a: 1, b: 1});
		expect(directiveCreated).toEqual({a: 1, b: 1});

		parent.Items = [{id: 'b', label: 'B2'}, {id: 'a', label: 'A2'}];

		var reordered = parent.$Element().querySelectorAll('.cross-row');

		expect(reordered[0]).toBe(oldB);
		expect(reordered[1]).toBe(oldA);
		expect(reordered[0].textContent).toBe('b:B2');
		expect(reordered[1].textContent).toBe('a:A2');
		expect(rowCreated).toEqual({a: 1, b: 1});
		expect(rowDestroyed).toEqual({});

		parent.Show = false;

		expect(parent.$Element().querySelector('.cross-row')).toBeNull();
		expect(rowDestroyed).toEqual({a: 1, b: 1});
		expect(directiveDestroyed).toEqual({a: 1, b: 1});

		oldA.click();
		oldB.click();

		expect(hits).toEqual([]);

		parent.Items = [{id: 'b', label: 'B3'}, {id: 'c', label: 'C3'}];
		parent.Show = true;

		var recreated = parent.$Element().querySelectorAll('.cross-row');

		expect(recreated.length).toBe(2);
		expect(recreated[0].textContent).toBe('b:B3');
		expect(recreated[1].textContent).toBe('c:C3');
		expect(recreated[0]).not.toBe(oldB);
		expect(rowCreated).toEqual({a: 1, b: 2, c: 1});
		expect(directiveCreated).toEqual({a: 1, b: 2, c: 1});

		recreated[0].click();
		recreated[1].click();

		expect(hits).toEqual(['b', 'c']);

		parent.$Destroy();

		expect(rowDestroyed).toEqual({a: 1, b: 2, c: 1});
		expect(directiveDestroyed).toEqual({a: 1, b: 2, c: 1});
	});

	/* Regression: a behavioral directive on the tag of a component stayed on the tag, which its instance took the place of. */
	test('a behavioral directive on the tag of a component acts on the element of its instance, and on the next one', function () {
		var directive = unique('tagmark').toLowerCase();
		var childName = unique('TagMarked');
		var parent;

		Elemenx.Directive(directive, {
			$OnUpdate: function (context) {
				context.Element.setAttribute('data-marked', String(context.Value));
			}
		});

		Elemenx.Component(childName, {$Template: '<section class="tag-marked">{{Title}}</section>', Title: 'inline'});

		parent = Elemenx.Component(unique('TagMarkedParent'), {
			$Template: '<main><' + childName + ' *' + directive + '="Mark"></' + childName + '><' + childName + ' *if="Second" *' + directive + '="Mark"></' + childName + '></main>',
			Mark: 'first',
			Second: false
		})();

		document.body.appendChild(parent.$Element());

		expect(parent.$Element().querySelector('.tag-marked').getAttribute('data-marked')).toBe('first');

		parent.Mark = 'second';

		parent.$Update();

		expect(parent.$Element().querySelector('.tag-marked').getAttribute('data-marked')).toBe('second');

		parent.$Destroy();
	});

	/* Regression: a behavioral directive on the tag of a deferred component stayed on its placeholder, gone from the page. */
	test('a behavioral directive on the tag of a component that loads later follows the element of the component', async function () {
		var directive = unique('marker').toLowerCase();
		var childName = unique('DeferredMarked');
		var seen = [];
		var parent;
		var panel;

		Elemenx.Directive(directive, {
			$OnUpdate: function (context) {
				context.Element.setAttribute('data-marked', String(context.Value));

				seen.push(context.Element.tagName + ':' + context.Element.isConnected);
			},
			$OnDestroy: function (context) {
				context.Element.removeAttribute('data-marked');
			}
		});

		Elemenx.Component(childName, {$TemplateURL: '/component-contracts/Panel.html', Title: 'deferred'});

		parent = Elemenx.Component(unique('DeferredMarkedParent'), {
			$Template: '<main><' + childName + ' *' + directive + '="Mark"></' + childName + '></main>',
			Mark: 'first'
		})();

		document.body.appendChild(parent.$Element());

		for (var i = 0; i < 100 && !parent.$Element().querySelector('.contract-panel'); i++)
			await new Promise(function (resolve) {
				setTimeout(resolve, 10);
			});

		panel = parent.$Element().querySelector('.contract-panel');

		expect(panel.getAttribute('data-marked')).toBe('first');
		expect(seen[seen.length - 1]).toBe('SECTION:true');

		parent.Mark = 'second';

		await Promise.resolve();
		await new Promise(function (resolve) {
			setTimeout(resolve, 0);
		});

		expect(panel.getAttribute('data-marked')).toBe('second');

		parent.$Destroy();

		expect(panel.hasAttribute('data-marked')).toBe(false);
	});
});