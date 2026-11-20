import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

/* The next frame and the one after it: what the Ether tells, it tells once a frame. */
function frames () {
	return new Promise(function (resolve) {
		requestAnimationFrame(function () {
			requestAnimationFrame(resolve);
		});
	});
}

describe('Contract: Elemenx.Ether, data of the whole page by slices', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	afterEach(function () {
		resetDOM();
	});

	/* A slice is a plain object of its own, the same always: read straight, written where it lies, told once. */
	it('keeps a slice as one plain object, read straight, its version counting what was told', function () {
		var name = unique('slice');
		var ether = Elemenx.Ether(name);

		expect(ether).toEqual({});
		expect(Elemenx.Ether(name)).toBe(ether);
		expect(Elemenx.Ether.Version(name)).toBe(0);

		ether.ship = {Depth: 12};

		expect(Elemenx.Ether.Touch(name, 'ship.Depth')).toBe(Elemenx.Ether);
		expect(Elemenx.Ether.Version(name)).toBe(1);
		expect(Elemenx.Ether.Set(name, 'probe.Layer.Name', 'clouds')).toBe(Elemenx.Ether);
		expect(Elemenx.Ether(name).probe.Layer.Name).toBe('clouds');
		expect(Elemenx.Ether(name).ship.Depth).toBe(12);
		expect(Elemenx.Ether.Version(name)).toBe(2);
	});

	/*
	 * What hears a slice hears it once a frame however often it is told, and only for a path that meets its own: the one
	 * told, inside it or round it; an empty path hears all; a callback that throws leaves the others hearing.
	 */
	it('tells each listener once a frame, only of the paths that meet its own', async function () {
		var name = unique('slice');
		var heard = {ship: [], depth: [], layer: [], all: [], late: []};
		var reported = [];
		var report = window.reportError;
		var depth = function (data, paths) {
			heard.depth.push([data.ship.Depth, paths]);
		};

		window.reportError = function (error) {
			reported.push(error.message);
		};

		Elemenx.Ether.On(name, 'ship', function (data, paths) {
			heard.ship.push(paths);
		});
		Elemenx.Ether.On(name, 'ship.Depth', depth);
		Elemenx.Ether.On(name, ['ship', 'Layer'], function (data, paths) {
			heard.layer.push(paths);
		});

		var broken = function () {
			throw new Error('a listener broke');
		};

		Elemenx.Ether.On(name, 'probe', broken);
		Elemenx.Ether.On(name, '', function (data, paths) {
			heard.all.push(paths);
		});

		for (var i = 1; i <= 60; i++)
			Elemenx.Ether.Set(name, 'ship.Depth', i);

		Elemenx.Ether.Touch(name, 'probe');

		expect(heard.depth).toEqual([]);

		await frames();

		window.reportError = report;

		expect(heard.depth).toEqual([[60, ['ship.Depth']]]);
		expect(heard.ship).toEqual([['ship.Depth']]);
		expect(heard.layer).toEqual([]);
		expect(heard.all).toEqual([['ship.Depth', 'probe']]);
		expect(reported).toEqual(['a listener broke']);

		/* All of the slice told: every listener of it hears; taken away, one hears no more. */
		Elemenx.Ether.Off(name, 'ship.Depth', depth);
		Elemenx.Ether.Off(name, 'probe', broken);
		Elemenx.Ether.Touch(name);

		await frames();

		expect(heard.depth.length).toBe(1);
		expect(heard.layer).toEqual([['']]);
	});

	/* $Ether of an owner: Mirror puts a value in its field and its template follows; destroyed, it hears no more. */
	it('mirrors a value into a field of a component, its template following, and forgets it when it is destroyed', async function () {
		var name = unique('slice');
		var heard = [];
		var component = Elemenx.Component(unique('EtherOwner'), {$Template: '<p>{{Depth}}</p>', Depth: 0})();

		document.getElementById('mount').appendChild(component.$Element());

		Elemenx.Ether.Set(name, 'ship.Depth', 7);

		expect(component.$Ether.Mirror(name, 'ship.Depth', 'Depth')).toBe(component.$Ether);
		expect(component.Depth).toBe(7);

		component.$Ether.On(name, 'ship', function () {
			heard.push('heard');
		});

		Elemenx.Ether.Set(name, 'ship.Depth', 3200);

		await frames();

		expect(component.Depth).toBe(3200);
		expect(component.$Element().textContent).toBe('3200');
		expect(heard).toEqual(['heard']);

		component.$Destroy();

		Elemenx.Ether.Set(name, 'ship.Depth', 5);

		await frames();

		expect(heard).toEqual(['heard']);
		expect(component.$Ether.On(name, 'ship', function () {
			heard.push('after');
		})).toBe(component.$Ether);

		Elemenx.Ether.Touch(name);

		await frames();

		expect(heard).toEqual(['heard']);
	});

	it('tells what it expects', function () {
		expect(function () {
			Elemenx.Ether('');
		}).toThrow('Elemenx.Ether expects a name');
		expect(function () {
			Elemenx.Ether.Touch(unique('slice'), 12);
		}).toThrow('Elemenx.Ether expects a path of names: ship.Depth');
		expect(function () {
			Elemenx.Ether.On(unique('slice'), 'ship', null);
		}).toThrow('Elemenx.Ether expects a callback');
		expect(function () {
			Elemenx.Ether.Set(unique('slice'), '', 1);
		}).toThrow('Elemenx.Ether expects a path of names: ship.Depth');
	});
});
