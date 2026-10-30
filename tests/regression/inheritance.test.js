import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var owned = [];

function mount (component) {
	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

describe('Contract: $Extends, $Traits, Elemenx.Trait and $Super', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('extends a Component: its props, template and methods, the own ones over them, every hook in turn, $Super under the one that runs', async function () {
		var base = unique('Base');
		var child = unique('Child');
		var grandchild = unique('Grandchild');
		var log = [];
		var instance;

		Elemenx.Component(base, {
			$Template: '<button class="base">{{Label}} {{Count}}</button>',
			$Meta: {Group: 'forms', Description: 'The base.', Props: {Label: 'Its label.'}, Events: {press: 'Pressed.'}, Methods: ['Press()']},
			Label: 'Base',
			Count: 0,
			Step: 1,

			$OnCreate: function () {
				log.push('base create');
			},

			$OnDestroy: function () {
				log.push('base destroy');
			},

			Press: function () {
				this.Count += this.Step;

				return 'base';
			},

			Name: function () {
				return 'base';
			}
		});

		Elemenx.Component(child, {
			$Extends: base,
			$Meta: {Description: 'The child.', Props: {Step: 'How much a press adds.'}, Events: ['hold']},
			Label: 'Child',
			Step: 2,

			$OnCreate: function () {
				log.push('child create');
			},

			$OnDestroy: function () {
				log.push('child destroy');
			},

			Press: function () {
				return 'child:' + this.$Super('Press');
			}
		});

		Elemenx.Component(grandchild, {
			$Extends: child,
			$Template: '<a class="own">{{Label}} {{Count}}</a>',

			Press: function () {
				return 'grandchild:' + this.$Super('Press');
			}
		});

		instance = mount(Elemenx.Component(child)({}));

		await tick();

		expect(instance.$Element().className).toBe('base');
		expect(instance.$Element().textContent).toBe('Child 0');
		expect(log).toEqual(['base create', 'child create']);
		expect(instance.Press()).toBe('child:base');
		expect(instance.Name()).toBe('base');

		await tick();

		expect(instance.$Element().textContent).toBe('Child 2');

		/* Three layers: the own template, each $Super one layer down. */
		var deep = mount(Elemenx.Component(grandchild)({}));

		await tick();

		expect(deep.$Element().className).toBe('own');
		expect(deep.Press()).toBe('grandchild:child:base');

		/* What it declares of itself: the texts of the last layer, the props and events of all of them. */
		expect(Elemenx.Meta(child).Description).toBe('The child.');
		expect(Elemenx.Meta(child).Group).toBe('forms');
		expect(Elemenx.Meta(child).Props.map(function (prop) {
			return prop.Name + '=' + prop.Default;
		})).toEqual(['Label=Child', 'Step=2']);
		expect(Elemenx.Meta(child).Events).toEqual(['press', 'hold']);
		expect(Elemenx.Meta(child).Methods).toEqual(['Press()']);

		log.length = 0;

		owned.splice(owned.indexOf(instance), 1);

		instance.$Destroy();

		expect(log).toEqual(['child destroy', 'base destroy']);
	});

	it('takes Traits in order, a Trait with Traits of its own, the definition over them, and the style of each', async function () {
		var selectable = unique('Selectable');
		var counted = unique('Counted');
		var card = unique('TraitCard');
		var log = [];
		var instance;

		Elemenx.Trait(counted, {
			Count: 0,

			$OnCreate: function () {
				log.push('counted');
			},

			Add: function () {
				this.Count++;
			}
		});

		Elemenx.Trait(selectable, {
			$Traits: [counted],
			$Style: '.' + selectable + ' { outline-width: 3px; }',
			Selected: false,

			$OnCreate: function () {
				log.push('selectable');
			},

			Toggle: function () {
				this.Selected = !this.Selected;

				this.Add();
			},

			Label: function () {
				return 'trait';
			}
		});

		expect(Elemenx.Trait(selectable).Selected).toBe(false);
		expect(Elemenx.Trait(unique('Nothing'))).toBe(null);

		Elemenx.Component(card, {
			$Traits: [selectable],
			$Template: '<div class="' + selectable + '" [class.on]="Selected">{{Count}}</div>',

			$OnCreate: function () {
				log.push('own');
			},

			Label: function () {
				return 'own';
			}
		});

		instance = mount(Elemenx.Component(card)({}));

		await tick();

		expect(log).toEqual(['counted', 'selectable', 'own']);
		expect(instance.Label()).toBe('own');

		instance.Toggle();

		await tick();

		expect(instance.$Element().className).toContain('on');
		expect(instance.$Element().textContent).toBe('1');
		expect(getComputedStyle(instance.$Element()).outlineWidth).toBe('3px');
	});

	it('waits for a base registered later, a template of its name, and makes again the Components of a base registered again', async function () {
		var base = unique('LateBase');
		var child = unique('LateChild');
		var placeholder;
		var instance;

		Elemenx.Component(child, {$Extends: base, Label: 'Late'});

		expect(Elemenx.Meta(child)).toBe(null);

		Elemenx.Template(base, '<p class="late">{{Label}}</p>');
		Elemenx.Component(base, {Label: 'Base'});

		instance = mount(Elemenx.Component(child)({}));

		await tick(20);

		expect(instance.$Element().textContent).toBe('Late');

		/* The base again (a reload in development): its Components follow it. */
		Elemenx.Template(base + 'Next', '<p class="next">{{Label}}!</p>');
		Elemenx.Component(base, {$TemplateID: base + 'Next', Label: 'Base'});

		placeholder = mount(Elemenx.Component(child)({}));

		await tick(20);

		expect(placeholder.$Element().className).toBe('next');
		expect(placeholder.$Element().textContent).toBe('Late!');
	});

	it('throws for a base, a Trait or a $Super it cannot have', function () {
		var name = unique('Wrong');
		var a = unique('CycleA');
		var b = unique('CycleB');
		var lonely = unique('Lonely');

		expect(function () {
			Elemenx.Component(name, {$Extends: 7, $Template: '<i></i>'});
		}).toThrow('Elemenx Component ' + name + ': $Extends expects the name of a Component');

		expect(function () {
			Elemenx.Component(name, {$Traits: 'Selectable', $Template: '<i></i>'});
		}).toThrow('Elemenx Component ' + name + ': $Traits expects the names of Traits');

		expect(function () {
			Elemenx.Component(name, {$Extends: name, $Template: '<i></i>'});
		}).toThrow('Elemenx Component ' + name + ': $Extends makes a cycle: ' + name + ', ' + name);

		Elemenx.Component(a, {$Extends: b});

		expect(function () {
			Elemenx.Component(b, {$Extends: a});
		}).toThrow('Elemenx Component ' + b + ': $Extends makes a cycle: ' + b + ', ' + a + ', ' + b);

		expect(function () {
			Elemenx.Trait(name, {$Template: '<i></i>'});
		}).toThrow('Elemenx.Trait ' + name + ' has a template: a Trait gives props, methods and hooks');

		expect(function () {
			Elemenx.Trait(name);
			Elemenx.Trait('', {});
		}).toThrow('Elemenx.Trait expects (name) or (name, definition)');

		Elemenx.Component(lonely, {
			$Template: '<i></i>',

			Press: function () {
				return this.$Super('Press');
			}
		});

		var instance = mount(Elemenx.Component(lonely)({}));

		expect(function () {
			instance.Press();
		}).toThrow('Elemenx $Super: ' + lonely + ' has no Press under the one that runs');
	});
});

describe('Contract: $Open, the props a tag gives that its Component does not declare', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('keeps the attributes and bindings of the tag it does not declare, in lower case and live; a Component not $Open throws', async function () {
		var open = unique('OpenThing');
		var closed = unique('ClosedThing');
		var made = null;
		var host;

		Elemenx.Component(open, {
			$Open: true,
			$Template: '<i></i>',
			ID: '',

			$OnReady: function () {
				made = this;
			}
		});

		Elemenx.Component(closed, {$Template: '<b></b>'});

		host = mount(Elemenx.Component(unique('OpenHost'), {
			$Template: '<div><' + open + ' ID="moon" Radius="1737" orbit-distance="384400 km" [mass]="Mass" /><' + closed + ' Radius="1" /></div>',
			Mass: 0.0123
		})());

		await tick();

		expect(made.$Open()).toEqual({radius: '1737', orbitDistance: '384400 km', mass: 0.0123});
		expect(made.ID).toBe('moon');

		host.Mass = 0.02;

		await tick();

		expect(made.$Open().mass).toBe(0.02);

		expect(function () {
			Elemenx.Instance(host.$Element().querySelector('b')).$Open();
		}).toThrow('Elemenx $Open: ' + closed + ' is not $Open');
	});
});
