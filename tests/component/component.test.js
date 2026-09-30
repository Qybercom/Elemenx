import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, mount, tick } from '../setup.js';

describe('Component / State / Lifecycle', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		mount();
	});

	it('renders reactive state and batches changes', async function () {
		Elemenx.Component('PackageCounter', {
			$Template: '<div><b id="value">{{Count}}</b><span id="label">{{Label}}</span></div>'
		});

		var component = Elemenx.Component('PackageCounter')({Count: 1, Label: 'one'}, null, {DirectState:true});
		document.getElementById('mount').appendChild(component.$Element());

		expect(document.getElementById('value').textContent).toBe('1');

		component.$Batch(function (state) {
			state.Count = 2;
			state.Label = 'two';
		});

		await tick();
		expect(document.getElementById('value').textContent).toBe('2');
		expect(document.getElementById('label').textContent).toBe('two');
	});

	it('calls create and destroy once', function () {
		var made = 0;
		var gone = 0;

		Elemenx.Component('PackageLifecycle', {
			$Template: '<div>life</div>',
			$OnCreate: function () { made++; },
			$OnDestroy: function () { gone++; }
		});

		var component = Elemenx.Component('PackageLifecycle')();
		document.getElementById('mount').appendChild(component.$Element());
		component.$Destroy();
		component.$Destroy();

		expect(made).toBe(1);
		expect(gone).toBe(1);
	});
});