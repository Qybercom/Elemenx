import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

describe('Contract: Vitals, the health of what a game can hurt, with one way in', function () {
	var vitals;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Vitals']);

		vitals = Elemenx.Service('Vitals');
	});

	/*
	 * Contract: UnitOf(object), what a unit is of its model (Units, resources/vitals/units); its health over the one of its
	 * kind. Regression: each demo gave each unit its numbers itself.
	 */
	it('knows what a unit is of its model: its health, damage, range and sight', function () {
		var archer = {ID: 'a', Kind: 'unit', Traits: {}, Values: {Model: 'archer'}};

		expect(vitals.UnitOf(archer)).toEqual({Max: 40, Damage: 8, Range: 12});
		expect(vitals.UnitOf({Values: {Model: 'nothing-such'}})).toEqual({});
		expect(vitals.UnitOf({Values: {Model: 'constructor'}})).toEqual({});
		expect(vitals.Settings(archer).Max).toBe(40);
		expect(vitals.Settings({ID: 'b', Kind: 'unit', Traits: {Health: {Max: 70}}, Values: {Model: 'archer'}}).Max).toBe(70);
		expect(vitals.Settings({ID: 'c', Kind: 'unit', Traits: {}, Values: {Model: 'robot', MaxHealth: 50}}).Max).toBe(50);
		expect(vitals.Settings({ID: 'd', Kind: 'unit', Traits: {}, Values: {}}).Max).toBe(100);
	});

	it('takes damage by the type and the part hit, less the armour, and tells damage, health and death once', function () {
		var written = {};
		var ledger = vitals.Make({Write: function (id, value) {
			written[id] = value;
		}});
		var told = [];
		var result;

		ledger.Track('crate', {Max: 50, Armor: 2, Resist: {fire: 2}, Parts: {lid: 0.5}});
		ledger.On('damage', function (event) {
			told.push(['damage', event.ID, event.Amount, event.Value]);
		}).On('death', function (event) {
			told.push(['death', event.ID, event.By]);
		});

		result = ledger.Damage('crate', {Amount: 10, Source: 'hero'});

		expect(result.Amount).toBe(8);
		expect(result.Value).toBe(42);
		expect(written.crate).toBe(42);

		expect(ledger.Damage('crate', {Amount: 10, Type: 'fire', Part: 'lid'}).Amount).toBe(8);
		expect(ledger.Get('crate')).toMatchObject({Value: 34, Max: 50, Alive: true});

		expect(ledger.Damage('crate', {Amount: 100, Source: 'hero'}).Killed).toBe(true);
		expect(ledger.Alive('crate')).toBe(false);
		expect(ledger.Damage('crate', {Amount: 5})).toBe(null);

		expect(told).toEqual([['damage', 'crate', 8, 42], ['damage', 'crate', 8, 34], ['damage', 'crate', 34, 0], ['death', 'crate', 'hero']]);
	});

	it('lets handlers change or cancel a change before it is applied; spares its own team; applies one change ID once', function () {
		var ledger = vitals.Make();
		var stop;

		ledger.Track('scout', {Max: 100, Team: 'blue'});

		stop = ledger.Before(function (change) {
			if (change.Hit.Weapon === 'water') return false;

			change.Amount = change.Amount / 2;
		});

		expect(ledger.Damage('scout', {Amount: 20, Weapon: 'water'})).toBe(null);
		expect(ledger.Damage('scout', {Amount: 20}).Value).toBe(90);
		expect(ledger.Damage('scout', {Amount: 20, Team: 'blue', Source: 'other'})).toBe(null);

		stop();

		expect(ledger.Damage('scout', {Amount: 10, ID: 'shot-1'}).Value).toBe(80);
		expect(ledger.Damage('scout', {Amount: 10, ID: 'shot-1'})).toBe(null);

		expect(ledger.Heal('scout', 50, 'medic').Amount).toBe(20);
		expect(ledger.Get('scout').Value).toBe(100);
	});

	it('keeps a host and its clients the same: a client asks, the host applies and sends the state, in order', function () {
		var clientSent = [];
		var hostSent = [];
		var host = vitals.Make({Mode: 'host', Send: function (message) {
			hostSent.push(message);
		}});
		var client = vitals.Make({Mode: 'client', Send: function (message) {
			clientSent.push(message);
		}});
		var deaths = [];

		host.Track('tank', {Max: 30});
		client.Track('tank', {Max: 30});
		client.On('death', function (event) {
			deaths.push(event.ID);
		});

		expect(client.Damage('tank', {Amount: 20, Source: 'p2'}).Pending).toBe(true);
		expect(client.Get('tank').Value).toBe(30);

		host.Receive(clientSent[0]);

		expect(host.Get('tank').Value).toBe(10);

		host.Damage('tank', {Amount: 15, Source: 'p1'});

		/* Out of order and twice: the older is passed by, the same once. */
		expect(client.Receive(hostSent[1]).Killed).toBe(true);
		expect(client.Receive(hostSent[0])).toBe(null);
		expect(client.Receive(hostSent[1])).toBe(null);

		expect(client.Get('tank')).toMatchObject({Value: 0, Alive: false, By: 'p1'});
		expect(deaths).toEqual(['tank']);
	});

	it('regenerates, saves and loads, and reads what it does not know yet', function () {
		var ledger = vitals.Make({Read: function (id) {
			return id === 'wall' ? {Max: 500, Regen: 10} : null;
		}});
		var other = vitals.Make();

		expect(ledger.Get('nothing')).toBe(null);

		ledger.Damage('wall', {Amount: 100});
		ledger.Step(2);

		expect(ledger.Get('wall').Value).toBe(420);

		other.Load(ledger.Save());

		expect(other.Get('wall')).toMatchObject({Value: 420, Max: 500});
	});

	/* Contract: the ledger of a scene (Of): one hurt and alive plays its clip hit, once in half a second; one killed does not. */
	it('makes one hurt in a scene flinch (its clip hit), not again while it does, and not once it is dead', function () {
		var inner = {Seconds: 10, Objects: {man: {ID: 'man', Kind: 'unit', Traits: {Health: {Max: 100, Death: 'keep'}}, Values: {Health: 100}}, crate: {ID: 'crate', Kind: 'thing', Traits: {Health: {Max: 10, Death: 'keep'}}, Values: {Health: 10}}}};
		var played = [];
		var scene = {VitalsLedger: null, Scene: function () {
			return inner;
		}, Play: function (id, name) {
			played.push(id + ':' + name);

			return id === 'man';
		}, Remove: function () {}, AddBehaviour: function () {
			return function () {};
		}};
		var ledger = vitals.Of(scene);

		ledger.Damage('man', {Amount: 10});
		ledger.Damage('man', {Amount: 10});

		expect(played).toEqual(['man:hit']);

		inner.Seconds = 10.6;

		ledger.Damage('man', {Amount: 10});
		ledger.Damage('crate', {Amount: 2});
		ledger.Damage('crate', {Amount: 2});

		/* A thing of no clip hit is asked each time: it never flinched. */
		expect(played).toEqual(['man:hit', 'man:hit', 'crate:hit', 'crate:hit']);

		inner.Seconds = 12;

		ledger.Damage('man', {Amount: 500});

		expect(played.length).toBe(4);
	});
});
