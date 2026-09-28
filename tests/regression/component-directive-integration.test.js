import {describe, expect, test, beforeEach} from 'vitest';
import '../../elemenx.js';

var serial=0;

function unique (prefix) {
	serial++;
	return prefix+Date.now()+serial;
}

describe('Regression: Component / Binding / Directive integration', function () {
	beforeEach(function () {
		document.body.innerHTML='';
	});

	test('Component bindings preserve definition key casing through the HTML parser', function () {
		var childName=unique('CaseBindingChild');
		var parentName=unique('CaseBindingParent');

		Elemenx.Component(childName,{
			Template:'<strong class="case-binding-child">{{Value}}</strong>',
			Value:'default'
		});

		var parent=Elemenx.Component(parentName,{
			Template:'<main><'+childName+' [Value]="Text"></'+childName+'></main>',
			Text:'first'
		})();

		expect(parent.Element().querySelector('.case-binding-child').textContent).toBe('first');
		parent.Text='second';
		expect(parent.Element().querySelector('.case-binding-child').textContent).toBe('second');
		parent.Destroy();
	});

	test('plain Component attributes preserve definition key casing through the HTML parser', function () {
		var childName=unique('CaseAttributeChild');
		var parentName=unique('CaseAttributeParent');

		Elemenx.Component(childName,{
			Template:'<strong class="case-attribute-child">{{InitialValue}}</strong>',
			InitialValue:'default'
		});

		var parent=Elemenx.Component(parentName,{
			Template:'<main><'+childName+' InitialValue="configured"></'+childName+'></main>'
		})();

		expect(parent.Element().querySelector('.case-attribute-child').textContent).toBe('configured');
		parent.Destroy();
	});

	test('nested Component binding paths recover definition object key casing', function () {
		var childName=unique('NestedCaseBindingChild');
		var parentName=unique('NestedCaseBindingParent');

		Elemenx.Component(childName,{
			Template:'<strong class="nested-case-binding-child">{{Config.Items[0].Name}}</strong>',
			Config:{Items:[{Name:'default'}]}
		});

		var parent=Elemenx.Component(parentName,{
			Template:'<main><'+childName+' [Config.Items[0].Name]="Text"></'+childName+'></main>',
			Text:'nested'
		})();

		expect(parent.Element().querySelector('.nested-case-binding-child').textContent).toBe('nested');
		parent.Destroy();
	});

	test('structural Component recreation keeps case-correct props and child directives', function () {
		var directive=unique('casebehavior').toLowerCase();
		var childName=unique('StructuralCaseChild');
		var parentName=unique('StructuralCaseParent');
		var updates=[];

		Elemenx.Directive(directive,{
			ElemenxOnUpdate:function (context) {
				updates.push(context.Value);
			}
		});

		Elemenx.Component(childName,{
			Template:'<article class="structural-case-child"><b *'+directive+'="Value">{{Value}}</b></article>',
			Value:'default'
		});

		var parent=Elemenx.Component(parentName,{
			Template:'<main><'+childName+' *if="Show" [Value]="Text"></'+childName+'></main>',
			Show:true,
			Text:'first'
		})();

		expect(parent.Element().querySelector('.structural-case-child').textContent).toBe('first');
		parent.Text='second';
		expect(parent.Element().querySelector('.structural-case-child').textContent).toBe('second');
		parent.Show=false;
		expect(parent.Element().querySelector('.structural-case-child')).toBe(null);
		parent.Show=true;
		expect(parent.Element().querySelector('.structural-case-child').textContent).toBe('second');
		expect(updates).toContain('first');
		expect(updates).toContain('second');
		parent.Destroy();
	});
});