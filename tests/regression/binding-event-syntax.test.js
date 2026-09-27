import {describe, expect, test, beforeEach} from 'vitest';
import '../../elemenx.js';

var serial=0;

function unique (prefix) {
	serial++;
	return prefix + Date.now() + serial;
}

describe('Regression: binding and event syntax', function () {
	beforeEach(function () {
		document.body.innerHTML='';
	});

	test('square brackets bind expressions and preserve raw expression text', function () {
		var name=unique('BindingSyntax');
		var factory=Elemenx.Component(name,{
			Template:'<button [title]="Count < 2 ? \'low\' : \'high\'" [disabled]="Disabled">{{Count}}</button>'
		});

		var child=factory({Count:1,Disabled:false});
		document.body.appendChild(child.Element());

		expect(child.Element().title).toBe('low');
		expect(child.Element().disabled).toBe(false);

		child.Update({Count:3,Disabled:true});

		expect(child.Element().title).toBe('high');
		expect(child.Element().disabled).toBe(true);
		child.Destroy();
	});

	test('round brackets bind native DOM events', function () {
		var name=unique('EventSyntax');
		var hits=0;
		var factory=Elemenx.Component(name,{
			Template:'<button (click)="Hit">hit</button>',
			Hit:function () {
				hits++;
			}
		});

		var child=factory({});
		document.body.appendChild(child.Element());
		child.Element().click();

		expect(hits).toBe(1);
		child.Destroy();
	});

	test('round brackets bind component events and are not exposed as props', function () {
		var childName=unique('EventChild');
		var parentName=unique('EventParent');
		var received=null;

		Elemenx.Component(childName,{
			Template:'<button (click)="Fire">fire</button>',
			Fire:function () {
				this.Emit('remove','payload');
			}
		});

		var parentFactory=Elemenx.Component(parentName,{
			Template:'<section><'+childName+' (remove)="Removed"></'+childName+'></section>',
			Removed:function (value) {
				received=value;
			}
		});

		var parent=parentFactory({});
		document.body.appendChild(parent.Element());
		parent.Element().querySelector('button').click();

		expect(received).toBe('payload');
		parent.Destroy();
	});
});