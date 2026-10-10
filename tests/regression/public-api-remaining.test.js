import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

/* Public methods that no other contract test reaches. */

var owned = [];

function operation (value) {
	return new Promise(function (resolve, reject) {
		value.On('Success', function (event) {
			resolve(event.Data);
		});
		value.On('Error', function (event) {
			reject(event.Data);
		});
		value.Execute();
	});
}

describe('Regression: remaining public methods', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) {
			var value = owned.pop();

			if (value.$Destroy) value.$Destroy();
			else value.Destroy();
		}
	});

	it('Events: Off removes one listener or a whole channel, and Channels lists the subscribed channels', function () {
		var sender = Elemenx.Events();
		var receiver = Elemenx.Events();
		var received = [];
		var first = function (event) {
			received.push(['first', event.Data]);
		};
		var second = function (event) {
			received.push(['second', event.Data]);
		};
		var channel = unique('EventsOff');
		var other = unique('EventsOther');

		owned.push(sender, receiver);

		receiver.On(channel, first);
		receiver.On(channel, second);
		receiver.On(other, first);

		expect(receiver.Channels().sort()).toEqual([channel, other].sort());

		expect(receiver.Off(channel, first)).toBe(receiver);

		sender.Emit(channel, 1);

		expect(received).toEqual([['second', 1]]);

		expect(receiver.Off(other)).toBe(receiver);
		expect(receiver.Off(unique('EventsUnknown'), first)).toBe(receiver);
		expect(receiver.Channels()).toEqual([channel]);

		receiver.Off(channel, second);

		expect(receiver.Channels()).toEqual([]);

		sender.Emit(channel, 2);
		sender.Emit(other, 3);

		expect(received).toEqual([['second', 1]]);
	});

	it('Application $Libraries returns a copy of the declared libraries', function () {
		var library = unique('LibrariesUI');

		var second = unique('LibrariesSecond');

		Elemenx.Library(library, {$Root: '/libraries-' + library});
		Elemenx.Library(second, {$Root: '/libraries-' + second});

		var single = Elemenx.Application(unique('LibrariesSingle'), {$Use: library});
		var several = Elemenx.Application(unique('LibrariesSeveral'), {$Use: [library, second]});
		var none = Elemenx.Application(unique('LibrariesNone'), {});

		owned.push(single, several, none);

		expect(single.$Libraries()).toEqual([library]);
		expect(several.$Libraries()).toEqual([library, second]);
		expect(none.$Libraries()).toEqual([]);

		var list = several.$Libraries();

		list.push('changed');

		expect(several.$Libraries()).toEqual([library, second]);
	});

	it('a Service instance resolves other Services of its Application through $Service', function () {
		var counter = unique('CounterService');
		var user = unique('UserService');
		var component = unique('ServiceRoot');

		Elemenx.Component(component, {$Template: '<main>services</main>'});
		Elemenx.Service(counter, {
			Value: 0,
			Next: function () {
				this.Value++;

				return this.Value;
			}
		});
		Elemenx.Service(user, {
			Count: function () {
				return this.$Service(counter).Next();
			}
		});

		var application = Elemenx.Application(unique('ServiceApplication'), {$Component: component, $Mount: '#mount'});

		owned.push(application);

		expect(application.$Service(user).Count()).toBe(1);
		expect(application.$Service(counter).Next()).toBe(2);
	});

	it('an IndexedDB transaction store reads through its indexes', async function () {
		var db = Elemenx.Storage.IndexedDB(unique('elemenx-idb-tx-index-'), {
			Stores: {people: {KeyPath: 'id', Indexes: {city: {KeyPath: 'city'}}}}
		});
		var people = db.Store('people');
		var seen = [];

		await operation(people.Put(undefined, {id: 1, city: 'Riga'}));
		await operation(people.Put(undefined, {id: 2, city: 'Riga'}));
		await operation(people.Put(undefined, {id: 3, city: 'Oslo'}));

		await operation(db.Transaction('people', function (tx) {
			var index = tx.Store('people').Index('city');

			index.Get('Oslo').On('Success', function (event) {
				seen.push(['get', event.Data.id]);
			});
			index.GetAll('Riga').On('Success', function (event) {
				seen.push(['riga', event.Data.length]);
			});
			index.GetAll().On('Success', function (event) {
				seen.push(['all', event.Data.length]);
			});
		}));

		expect(seen).toEqual([['get', 3], ['riga', 2], ['all', 3]]);

		await operation(db.Delete());
	});

	it('WebWorker and ServiceWorker Off return the handle and stop the removed listener', function () {
		var worker = Elemenx.WebWorker(unique('OffWorker'), {Script: '/workers/webworker-bridge.js', StartMode: 'manual'});
		var serviceWorker = Elemenx.ServiceWorker(unique('OffServiceWorker'), {Script: '/sw-application.js', Scope: '/sw-scope/', StartMode: 'manual'});
		var listener = function () {};

		owned.push(worker, serviceWorker);

		expect(worker.On('Error', listener).Off('Error', listener)).toBe(worker);
		expect(serviceWorker.On('Error', listener).Off('Error', listener)).toBe(serviceWorker);
		expect(serviceWorker.Off('Unknown', listener)).toBe(serviceWorker);
	});
});
