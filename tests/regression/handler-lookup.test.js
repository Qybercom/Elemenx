import { describe, expect, test, beforeEach } from 'vitest';
import '../../elemenx.js';

var serial = 0;

function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

/*
 * The handlers of (events) and the functions the expressions call: methods of the definition, and functions $OnCreate
 * sets, at the root of the template, in a *if and in the rows of a *for.
 */
describe('Regression: handlers and expression methods', function () {
	beforeEach(function () {
		document.body.innerHTML = '';
	});

	function emitter () {
		var name = unique('HandlerEmitter');

		Elemenx.Component(name, {
			$Template: '<b class="emitter">emitter</b>',
			$OnReady: function () {
				this.$Emit('join', 5);
			}
		});

		return name;
	}

	test('handlers set in $OnCreate run for native and Component events, on the owner of the state', function () {
		var child = emitter();
		var calls = [];
		var parent = Elemenx.Component(unique('HandlerOwner'), {
			$Template: '<main>'
				+ '<button class="root" (click)="Clicked">root</button><' + child + ' (join)="Joined"></' + child + '>'
				+ '<div *if="Show"><button class="branch" (click)="Clicked">branch</button><' + child + ' (join)="Joined"></' + child + '></div>'
				+ '<p *for="item of Items"><button class="row" (click)="Clicked">row</button><' + child + ' (join)="Joined"></' + child + '></p>'
				+ '</main>',
			Show: true,
			Items: [1],
			Label: 'owner',
			$OnCreate: function () {
				this.Clicked = function (event) {
					calls.push('click ' + event.target.className + ' ' + this.Label);
				};

				this.Joined = function (value) {
					calls.push('join ' + value + ' ' + this.Label);
				};
			}
		})();

		document.body.appendChild(parent.$Element());

		parent.$Element().querySelector('.root').click();
		parent.$Element().querySelector('.branch').click();
		parent.$Element().querySelector('.row').click();

		expect(calls.sort()).toEqual([
			'click branch owner',
			'click root owner',
			'click row owner',
			'join 5 owner',
			'join 5 owner',
			'join 5 owner'
		]);

		parent.$Destroy();
	});

	test('a handler is looked up when the event comes', function () {
		var calls = [];
		var parent = Elemenx.Component(unique('HandlerLate'), {
			$Template: '<button (click)="Later">later</button>'
		})();

		document.body.appendChild(parent.$Element());

		parent.$Element().click();

		parent.Later = function () {
			calls.push('later');
		};

		parent.$Element().click();

		expect(calls).toEqual(['later']);

		parent.$Destroy();
	});

	test('expressions call the methods of the definition, on the instance', function () {
		var child = unique('MethodProp');
		var directive = unique('methodvalue');
		var seen = [];

		Elemenx.Component(child, {
			$Template: '<em class="prop">{{Value}}</em>',
			Value: ''
		});

		Elemenx.Directive(directive, {
			$OnUpdate: function (context) {
				seen.push(context.Value);
			}
		});

		var parent = Elemenx.Component(unique('MethodExpressions'), {
			$Template: '<main>'
				+ '<i class="root" [title]="Twice(Count)">{{Twice(Count)}}</i>'
				+ '<i class="branch" *if="Twice(Count) > 2">{{Twice(Count)}}</i>'
				+ '<i class="row" *for="item of Items">{{Twice(item)}}</i>'
				+ '<' + child + ' [Value]="Twice(Count)"></' + child + '>'
				+ '<s *' + directive + '="Twice(Count)"></s>'
				+ '</main>',
			Count: 2,
			Factor: 2,
			Items: [5],
			Twice: function (value) {
				return value * this.Factor;
			}
		})();

		document.body.appendChild(parent.$Element());

		var element = parent.$Element();

		expect(element.querySelector('.root').textContent).toBe('4');
		expect(element.querySelector('.root').title).toBe('4');
		expect(element.querySelector('.branch').textContent).toBe('4');
		expect(element.querySelector('.row').textContent).toBe('10');
		expect(element.querySelector('.prop').textContent).toBe('4');
		expect(seen).toEqual([4]);

		parent.Count = 3;

		expect(element.querySelector('.root').textContent).toBe('6');
		expect(element.querySelector('.prop').textContent).toBe('6');
		expect(seen).toEqual([4, 6]);

		parent.$Destroy();
	});

	test('a value of the state comes before a method of the same name', function () {
		var parent = Elemenx.Component(unique('MethodShadow'), {
			$Template: '<i>{{Label()}}</i>',
			Label: function () {
				return 'method';
			},
			$OnCreate: function () {
				this.Label = function () {
					return 'state';
				};
			}
		})();

		expect(parent.$Element().textContent).toBe('state');

		parent.$Destroy();
	});
});
