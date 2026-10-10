import { beforeEach, describe, expect, it } from 'vitest';
import '../../elemenx.js';

var sequence = 0;
function unique (prefix) {
	sequence++;

	return prefix + Date.now() + sequence;
}

describe('Regression: structural collection lifecycle isolation', function () {
	beforeEach(function () { document.body.innerHTML = '<div id="mount"></div>'; });

	it('renders an array populated during $OnCreate', function () {
		var name = unique('ForCreate');

		Elemenx.Component(name, {
			$Template: '<div><span class="for-item" *for="item of Items">{{item}}</span></div>',
			Items: [],
			$OnCreate: function () { this.Items = ['A', 'B']; }
		});

		var component = Elemenx.Component(name)({});

		document.getElementById('mount').appendChild(component.$Element());

		expect(Array.from(document.querySelectorAll('.for-item')).map(function (node) { return node.textContent; })).toEqual(['A', 'B']);

		component.$Destroy();
	});

	it('updates the collection from owner $OnReady without running owner lifecycle on iteration children', function () {
		var name = unique('ForReady');
		var ready = 0;

		Elemenx.Component(name, {
			$Template: '<div><span class="for-item" *for="item of Items">{{item}}</span></div>',
			Items: [],
			$OnCreate: function () { this.Items = ['Create']; },
			$OnReady: function () {
				ready++;
				this.Items = this.Items.concat(['Ready']);
			}
		});

		var component = Elemenx.Component(name)({});

		document.getElementById('mount').appendChild(component.$Element());

		expect(ready).toBe(1);
		expect(Array.from(document.querySelectorAll('.for-item')).map(function (node) { return node.textContent; })).toEqual(['Create', 'Ready']);

		component.$Destroy();
	});
	it('keeps synthetic DirectState methods out of the owner reactive scope', function () {
		var name = unique('ForMethodIsolation');
		var component;

		Elemenx.Component(name, {
			$Template: '<div><span class="for-item" *for="item of Items">{{Describe(item)}}</span></div>',
			Items: ['A', 'B'],
			Describe: function (item) { return 'Item ' + item; }
		});

		component = Elemenx.Component(name)({});

		document.getElementById('mount').appendChild(component.$Element());

		expect(Array.from(document.querySelectorAll('.for-item')).map(function (node) { return node.textContent; })).toEqual(['Item A', 'Item B']);

		component.$Update({Describe: 'state value'});

		expect(typeof component.Describe).toBe('function');
		expect(component.Describe('C')).toBe('Item C');

		component.$Destroy();
	});

	it('does not let child bootstrap state subscribe the parent structural effect', function () {
		var childName = unique('NestedBootstrapChild');
		var parentName = unique('NestedBootstrapParent');

		Elemenx.Component(childName, {
			$Template: '<section><span *for="item of Items">{{item}}</span></section>',
			Items: ['A', 'B']
		});
		Elemenx.Component(parentName, {
			$Template: '<div><' + childName + ' *if="Visible"></' + childName + '></div>',
			Visible: true
		});

		var component = Elemenx.Component(parentName)({});

		document.getElementById('mount').appendChild(component.$Element());

		expect(document.getElementById('mount').textContent).toContain('AB');

		component.$Destroy();
	});

});