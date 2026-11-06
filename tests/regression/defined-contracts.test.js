import { describe, expect, it } from 'vitest';
import '../../elemenx.js';

var serial = 0;

function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

function later (ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}

describe('Contract: Elemenx.Defined, what a name is defined as and waiting for its definition', function () {
	it('tells what a name is defined as now: a Component, a Service, a Directive, or nothing', function () {
		var component = unique('DefinedCard');
		var service = unique('DefinedStore');
		var directive = unique('definedmark').toLowerCase();

		expect(Elemenx.Defined(component)).toBe(null);

		Elemenx.Component(component, {$Template: '<div></div>'});
		Elemenx.Service(service, {});
		Elemenx.Directive(directive, {});

		expect(Elemenx.Defined(component)).toBe('Component');
		expect(Elemenx.Defined(service)).toBe('Service');
		expect(Elemenx.Defined(directive)).toBe('Directive');
	});

	it('calls back once a definition comes, after it returns even for one there already; a list waits for all of them', async function () {
		var first = unique('DefinedLater');
		var second = unique('DefinedLaterToo');
		var told = [];
		var both = null;
		var at = null;

		Elemenx.Defined(first, function (error, result) {
			told.push([error, result]);
		});
		Elemenx.Defined([first, second], function (error, result) {
			both = result;
		});

		await later(20);

		expect(told).toEqual([]);

		Elemenx.Component(first, {$Template: '<div></div>'});

		await later(20);

		expect(told).toEqual([[null, {Name: first, Kind: 'Component'}]]);
		expect(both).toBe(null);

		Elemenx.Service(second, {});

		await later(20);

		expect(both).toEqual([{Name: first, Kind: 'Component'}, {Name: second, Kind: 'Service'}]);

		Elemenx.Defined(first, function (error, result) {
			at = result;
		});

		/* Never at once: the code after the call runs first. */
		expect(at).toBe(null);

		await later(20);

		expect(at).toEqual({Name: first, Kind: 'Component'});
	});

	it('waits only for its Kind, gives up after its Timeout, and stops when told', async function () {
		var name = unique('DefinedKind');
		var errors = [];
		var called = false;
		var stop;

		Elemenx.Service(name, {});

		Elemenx.Defined(name, function (error) {
			errors.push(error);
		}, {Kind: 'Component', Timeout: 40});

		stop = Elemenx.Defined(unique('DefinedNever'), function () {
			called = true;
		});

		stop();

		await later(80);

		expect(errors).toHaveLength(1);
		expect(errors[0].message).toBe('Elemenx.Defined waited 40 ms for ' + name);
		expect(called).toBe(false);

		expect(function () {
			Elemenx.Defined(name, null);
		}).toThrow('Elemenx.Defined expects (name) or (name, callback, {Kind, Timeout})');
		expect(function () {
			Elemenx.Defined(name, function () {}, {Kind: 'Widget'});
		}).toThrow('Elemenx.Defined expects (name) or (name, callback, {Kind, Timeout})');
	});
});
