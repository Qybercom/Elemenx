import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

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

describe('Regression: Storage contracts', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	it('Local and Session read a foreign or corrupted value as null, and Clear without a namespace clears everything', function () {
		var name = unique('foreign');

		sessionStorage.setItem(name + '-text', 'not json');
		sessionStorage.setItem(name + '-object', JSON.stringify({Other: 1}));
		sessionStorage.setItem(name + '-null', 'null');

		expect(Elemenx.Storage.Session.Get(name + '-text')).toBeNull();
		expect(Elemenx.Storage.Session.Get(name + '-object')).toBeNull();
		expect(Elemenx.Storage.Session.Get(name + '-null')).toBeNull();

		Elemenx.Storage.Session.Set(name, {kept: true});

		expect(Elemenx.Storage.Session.Get(name)).toEqual({kept: true});

		Elemenx.Storage.Session.Clear();

		expect(sessionStorage.length).toBe(0);
	});

	it('Cookie writes Path, Domain, Max-Age, Expires, SameSite and Secure attributes', function () {
		var written = [];
		var expires = new Date(Date.UTC(2030, 0, 2, 3, 4, 5));

		Object.defineProperty(document, 'cookie', {
			configurable: true,
			get: function () {
				return '';
			},
			set: function (value) {
				written.push(value);
			}
		});

		try {
			Elemenx.Storage.Cookie.Set('name', 'a b', {Path: '/', Domain: 'example.test', MaxAge: 60, Expires: expires, SameSite: 'Strict', Secure: true});
			Elemenx.Storage.Cookie.Set('plain', 'x', {Expires: 'Wed, 01 Jan 2031 00:00:00 GMT'});
		}
		finally {
			delete document.cookie;
		}

		expect(written).toEqual([
			'name=a%20b; Path=/; Domain=example.test; Max-Age=60; Expires=' + expires.toUTCString() + '; SameSite=Strict; Secure',
			'plain=x; Expires=Wed, 01 Jan 2031 00:00:00 GMT'
		]);
	});

	it('Storage Contexts merge their IndexedDB definitions along the dependency chain', async function () {
		var base = unique('StorageBase');
		var child = unique('StorageChild');
		var name = unique('elemenx-idb-context-');
		var upgrades = [];

		Elemenx.Storage.Context(base, {
			Namespace: 'base',
			IndexedDB: {
				Name: name,
				Version: 1,
				Stores: {items: {KeyPath: 'id', Indexes: {color: {KeyPath: 'color'}}}}
			}
		});
		Elemenx.Storage.Context(child, {
			Contexts: base,
			IndexedDB: {
				Version: 2,
				Upgrade: function (context) {
					upgrades.push(context.NewVersion);
				},
				Stores: {items: {AutoIncrement: true, Indexes: {size: {KeyPath: 'size'}}}, extra: {}}
			}
		});

		var db = Elemenx.Storage(child).IndexedDB();
		var items = db.Store('items');

		expect(await operation(items.Put(undefined, {color: 'red', size: 1}))).toBe(1);
		expect(await operation(items.Put(undefined, {color: 'red', size: 2}))).toBe(2);
		expect((await operation(items.Index('color').GetAll('red'))).length).toBe(2);
		expect((await operation(items.Index('size').Get(2))).id).toBe(2);
		expect(await operation(db.Store('extra').Count())).toBe(0);
		expect(upgrades).toEqual([2]);

		await operation(db.Delete());
	});

	it('Storage Context arguments and missing IndexedDB names are reported', function () {
		var empty = unique('StorageEmpty');

		Elemenx.Storage.Context(empty, {Namespace: 'empty'});

		expect(Elemenx.Storage.Context(unique('StorageNone'))).toBeNull();
		expect(function () {
			Elemenx.Storage.Context();
		}).toThrow('Elemenx.Storage.Context expects (name) or (name, definition)');
		expect(function () {
			Elemenx.Storage(empty).IndexedDB();
		}).toThrow('Elemenx Storage Context does not define IndexedDB.Name');
	});
});
