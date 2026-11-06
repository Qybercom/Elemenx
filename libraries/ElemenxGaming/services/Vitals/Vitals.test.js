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
});
