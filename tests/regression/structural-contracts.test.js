import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

function texts (component, selector) {
	return Array.prototype.map.call(component.$Element().querySelectorAll(selector), function (node) {
		return node.textContent;
	});
}

describe('Regression: Structural collections and Component props', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	it('*for in iterates own keys only, and a null or undefined source renders nothing', function () {
		var map = Object.create({inherited: 1});

		map.a = 1;
		map.b = 2;

		var component = Elemenx.Component(unique('ForIn'), {
			$Template: '<div><i *for="key in Map">{{key}}</i><b *for="item of Items">{{item}}</b></div>',
			Map: map,
			Items: ['x']
		})();

		expect(texts(component, 'i')).toEqual(['a', 'b']);
		expect(texts(component, 'b')).toEqual(['x']);

		component.Map = null;
		component.Items = undefined;

		expect(texts(component, 'i')).toEqual([]);
		expect(texts(component, 'b')).toEqual([]);

		component.$Destroy();
	});

	it('a classic *for that never ends stops at the iteration limit with an explicit error', function () {
		var factory = Elemenx.Component(unique('ForEndless'), {
			$Template: '<div><i *for="i = 0; i >= 0; i++">{{i}}</i></div>'
		});

		expect(function () {
			factory();
		}).toThrow('Elemenx structural collection exceeded the iteration limit (10000)');
	});

	it('*key must resolve to a value and be unique within the collection', function () {
		var empty = Elemenx.Component(unique('KeyEmpty'), {
			$Template: '<div><i *for="item of Items" *key="item.id">{{item.name}}</i></div>',
			Items: [{name: 'no id'}]
		});
		var duplicate = Elemenx.Component(unique('KeyDuplicate'), {
			$Template: '<div><i *for="item of Items" *key="item.id">{{item.name}}</i></div>',
			Items: [{id: 1, name: 'one'}, {id: 1, name: 'again'}]
		});

		expect(function () {
			empty();
		}).toThrow('Elemenx *key resolved to null/undefined: item.id');
		expect(function () {
			duplicate();
		}).toThrow('Elemenx duplicate collection key: 1');
	});

	it('plain attributes of a child Component become props: literals, kebab-case names and {{expressions}}', function () {
		var child = unique('PropChild');
		var received = null;

		Elemenx.Component(child, {
			$Template: '<span>child</span>',
			$OnCreate: function (data) {
				received = data;
			}
		});

		var parent = Elemenx.Component(unique('PropParent'), {
			$Template: '<div><' + child + ' enabled flag="false" on="true" none="null" user-name="Ann" count="{{Count + 1}}"></' + child + '></div>',
			Count: 1
		})();

		expect(received).toEqual({enabled: true, flag: false, on: true, none: null, userName: 'Ann', count: 2});

		parent.$Destroy();
	});

	it('a path binding sets a nested prop, and an invalid binding target is rejected', function () {
		var child = unique('PathChild');
		var received = null;

		Elemenx.Component(child, {
			$Template: '<span>child</span>',
			$OnCreate: function (data) {
				received = data;
			}
		});

		var parent = Elemenx.Component(unique('PathParent'), {
			$Template: '<div><' + child + ' [user.name]="Name" [list[1]]="Name"></' + child + '></div>',
			Name: 'Ann'
		})();

		expect(received.user).toEqual({name: 'Ann'});
		expect(Array.isArray(received.list)).toBe(true);
		expect(received.list[1]).toBe('Ann');

		parent.$Destroy();

		['[user.]', '[list[x]]', '[1user]'].forEach(function (target) {
			var invalid = Elemenx.Component(unique('InvalidTarget'), {
				$Template: '<div><' + child + ' ' + target + '="Name"></' + child + '></div>',
				Name: 'Ann'
			});

			expect(function () {
				invalid();
			}).toThrow('Elemenx invalid Component binding target');
		});
	});

	it('a kebab-case binding target is read as camelCase in every segment, like a plain attribute name', function () {
		var child = unique('KebabChild');
		var received = null;

		Elemenx.Component(child, {
			$Template: '<span>child</span>',
			$OnCreate: function (data) {
				received = data;
			}
		});

		var parent = Elemenx.Component(unique('KebabParent'), {
			$Template: '<div><' + child + ' [user-name]="Name" [user-info.first-name]="Name" [items[0].item-id]="Count"></' + child + '></div>',
			Name: 'Ann',
			Count: 7
		})();

		expect(received).toEqual({userName: 'Ann', userInfo: {firstName: 'Ann'}, items: [{itemId: 7}]});

		parent.$Destroy();

		['[user-]', '[user--name]', '[-user]'].forEach(function (target) {
			var invalid = Elemenx.Component(unique('KebabInvalid'), {
				$Template: '<div><' + child + ' ' + target + '="Name"></' + child + '></div>',
				Name: 'Ann'
			});

			expect(function () {
				invalid();
			}).toThrow('Elemenx invalid Component binding target');
		});
	});

	it('*for renders its iterations again only for the values its template and expressions name', function () {
		var calls = 0;
		var component = Elemenx.Component(unique('ForNamed'), {
			$Template: '<div><i *for="item of Items" *key="Key(item)">{{item}}{{Label}}{{Format(item)}}</i></div>',
			Items: ['a', 'b'],
			Label: '!',
			Unit: 'px',
			Other: 0,
			$OnCreate: function () {
				var self = this;

				/* *key runs on every render of the collection. */
				this.Key = function (item) {
					calls++;

					return item;
				};

				/* A function reads the values of the Component itself, so its own reads keep it current. */
				this.Format = function () {
					return self.Unit;
				};
			}
		})();
		var first = component.$Element().querySelector('i');
		var before;

		expect(texts(component, 'i')).toEqual(['a!px', 'b!px']);

		before = calls;
		component.Other = 1;
		component.Other = 2;

		expect(calls).toBe(before);
		expect(component.$Element().querySelector('i')).toBe(first);

		component.Label = '?';

		expect(texts(component, 'i')).toEqual(['a?px', 'b?px']);

		component.Unit = 'em';

		expect(texts(component, 'i')).toEqual(['a?em', 'b?em']);

		component.Items = ['b', 'a', 'c'];

		expect(texts(component, 'i')).toEqual(['b?em', 'a?em', 'c?em']);
		expect(component.$Element().querySelectorAll('i')[1]).toBe(first);

		component.$Destroy();
	});
});
