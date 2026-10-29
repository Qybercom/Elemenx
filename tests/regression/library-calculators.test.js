import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('CalculatorsHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* Presses the keys of a calculator by their IDs. */
async function press (root, keys) {
	keys.forEach(function (key) {
		root.querySelector('[data-key="' + key + '"]').click();
	});

	await tick(10);
}

describe('Contract: the Calculations Service, Calculator and BusinessCalculator', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Calculator', 'BusinessCalculator', 'CalculatorField', 'CalculatorResult']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('reads formulas without eval: precedence, powers, conditions, functions, names, and tells a mistake by its place', function () {
		var calculations = Elemenx.Service('Calculations');
		var mistake = null;

		expect(calculations.Evaluate('1 + 2 * 3 - -2^2')).toBe(11);
		expect(calculations.Evaluate('2^3^2')).toBe(512);
		expect(calculations.Evaluate('Price * Count * (1 - Discount / 100)', {Price: 10, Count: 3, Discount: 20})).toBe(24);
		expect(calculations.Evaluate('if(Area > 100, 0.9, 1) * Rate', {Area: 120, Rate: 10})).toBe(9);
		expect(calculations.Evaluate('Area > 100 ? 1 : 2', {Area: 5})).toBe(2);
		expect(calculations.Evaluate('round(10 / 3, 2) + max(1, 5) + sum(1, 2, 3)')).toBe(14.33);
		expect(calculations.Evaluate('sin(90)', {}, {Angle: 'degrees'})).toBeCloseTo(1, 12);
		expect(calculations.Evaluate('double(4)', {}, {Functions: {double: function (x) {
			return x * 2;
		}}})).toBe(8);
		expect(calculations.Names('Price * Count + pi + round(Tax)')).toEqual(['Price', 'Count', 'Tax']);

		try {
			calculations.Evaluate('2 * (3 +');
		}
		catch (error) {
			mistake = error;
		}

		expect(mistake).toBeInstanceOf(SyntaxError);
		expect(mistake.Index).toBe(8);
		expect(function () {
			calculations.Evaluate('Missing + 1');
		}).toThrow('Elemenx Calculations: unknown name Missing');
	});

	it('counts on its keys and on the keyboard, a percent as a shop does, and keeps its history', async function () {
		var results = [];
		var host = mount('<div><Calculator Mode="scientific" (result)="Counted" /></div>', {
			Counted: function (result) {
				results.push(result.Value);
			}
		});
		var root;

		await tick(20);

		root = host.$Element().querySelector('.elemenx-calculator');

		await press(root, ['2', '0', '0', 'plus', '1', '0', 'percent']);

		expect(root.querySelector('.elemenx-calculator-line').textContent).toBe('200+10%');
		expect(root.querySelector('.elemenx-calculator-result').textContent).toBe('220');

		await press(root, ['equals']);

		expect(results).toEqual([220]);

		/* After =, a digit starts again; the keyboard types as the keys do. */
		['9', '*', '(', '1', '+', '2', ')', 'Enter'].forEach(function (key) {
			root.dispatchEvent(new KeyboardEvent('keydown', {key: key, bubbles: true}));
		});

		await tick(10);

		expect(results).toEqual([220, 27]);

		/* sin 30 in degrees, then radians by its key. */
		await press(root, ['clear', 'sin', '3', '0', 'close']);

		expect(root.querySelector('.elemenx-calculator-result').textContent).toBe('0.5');

		await press(root, ['angle']);

		expect(root.querySelector('[data-key="angle"]').textContent).toBe('rad');
		expect(root.querySelector('.elemenx-calculator-result').textContent).toBe('−0.988031624093');

		/* The history: the last first, a press brings it back. */
		expect(root.querySelectorAll('.elemenx-calculator-record').length).toBe(2);

		root.querySelector('.elemenx-calculator-record[data-index="1"]').click();

		await tick(10);

		expect(root.querySelector('.elemenx-calculator-line').textContent).toBe('200+10%');
	});

	it('computes its results from its fields, given and declared, each after the results it reads, and tells a cycle', async function () {
		var changes = [];
		var host = mount('<div style="width: 760px"><BusinessCalculator Title="Renovation" Currency="EUR" Locale="en" [fields]="Fields" [results]="Results" [breakdown]="[\'Work\', \'Materials\']" (change)="Changed"><CalculatorField ID="Rooms" Label="Rooms" Type="select" [options]="Rooms" /><CalculatorResult ID="Total" Label="Total" Formula="Work + Materials" Format="money" Primary="true" /></BusinessCalculator></div>', {
			Fields: [{ID: 'Area', Label: 'Area', Value: 50, Unit: 'm²'}, {ID: 'Rate', Label: 'Work for 1 m²', Type: 'money', Value: 30}, {ID: 'Premium', Label: 'Premium materials', Type: 'toggle', Value: false}],
			Results: [{ID: 'Materials', Label: 'Materials', Formula: 'Area * if(Premium, 25, 12)', Format: 'money'}, {ID: 'Work', Label: 'Work', Formula: 'Area * Rate * (1 + Rooms / 10)', Format: 'money'}, {ID: 'Loop', Label: 'Loop', Formula: 'Loop2 + 1'}, {ID: 'Loop2', Label: 'Loop 2', Formula: 'Loop * 2'}],
			Rooms: [{Value: 1, Label: 'One'}, {Value: 3, Label: 'Three'}],
			Changed: function (event) {
				changes.push(event.Results.Total);
			}
		});
		var root;
		var value = function (id) {
			return root.querySelector('[data-result="' + id + '"] ' + (id === 'Total' ? '.elemenx-business-calculator-value' : 'dd')).textContent;
		};

		expect(await waitFor(function () {
			return !!host.$Element().querySelector('[data-result="Total"]');
		}, 3000)).toBe(true);

		root = host.$Element();

		/* 50 m² of materials at 12, work 50 × 30 × 1.1 (one room). */
		expect(value('Materials')).toBe('€600.00');
		expect(value('Work')).toBe('€1,650.00');
		expect(value('Total')).toBe('€2,250.00');
		expect(value('Loop')).toBe('—');
		expect(root.querySelector('[data-result="Loop"]').getAttribute('title')).toContain('needs itself');
		expect(root.querySelectorAll('.elemenx-business-calculator-part').length).toBe(2);

		/* The toggle on: the premium materials. */
		Elemenx.Instance(root.querySelector('.elemenx-business-calculator')).Entered('Premium', true);

		await tick(20);

		expect(value('Materials')).toBe('€1,250.00');
		expect(changes).toEqual([2900]);
		expect(Elemenx.Instance(root.querySelector('.elemenx-business-calculator')).Numbers().Total).toBe(2900);
	});
});
