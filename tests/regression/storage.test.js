import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: Storage', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () {
		resetDOM();
		localStorage.clear();
		sessionStorage.clear();
	});

	it('Local namespaces isolate values and Clear only removes its namespace', function () {
		var a=Elemenx.Storage.Local.Namespace('a');
		var b=Elemenx.Storage.Local.Namespace('b');
		a.Set('value',{n:1});
		b.Set('value',{n:2});
		expect(a.Get('value')).toEqual({n:1});
		expect(b.Get('value')).toEqual({n:2});
		expect(a.Has('value')).toBe(true);
		a.Clear();
		expect(a.Has('value')).toBe(false);
		expect(b.Get('value')).toEqual({n:2});
	});

	it('Session Set / Get / Remove preserves JSON values', function () {
		var storage=Elemenx.Storage.Session.Namespace(unique('session'));
		storage.Set('zero',0).Set('false',false).Set('null',null);
		expect(storage.Get('zero')).toBe(0);
		expect(storage.Get('false')).toBe(false);
		expect(storage.Has('null')).toBe(true);
		expect(storage.Get('null')).toBeNull();
		storage.Remove('zero');
		expect(storage.Has('zero')).toBe(false);
	});

	it('Storage Context composes namespaces', function () {
		var base=unique('StorageBase'), child=unique('StorageChild');
		Elemenx.Storage.Context(base,{Namespace:'base'});
		Elemenx.Storage.Context(child,{Contexts:[base],Namespace:'child'});
		var storage=Elemenx.Storage(child).Local;
		storage.Set('value','ok');
		expect(localStorage.getItem('base.child.value')).not.toBeNull();
		expect(storage.Get('value')).toBe('ok');
		storage.Clear();
	});

	it('Storage Context accepts one named dependency without an array', function () {
		var base=unique('StorageSingleBase'), child=unique('StorageSingleChild');
		Elemenx.Storage.Context(base,{Namespace:'base'});
		Elemenx.Storage.Context(child,{Contexts:base,Namespace:'child'});
		var storage=Elemenx.Storage(child).Local;
		storage.Set('value','named');
		expect(localStorage.getItem('base.child.value')).not.toBeNull();
		expect(storage.Get('value')).toBe('named');
		storage.Clear();
	});

	it('Storage Context accepts one inline dependency without an array', function () {
		var child=unique('StorageInlineChild');
		Elemenx.Storage.Context(child,{
			Contexts:{Namespace:'inline'},
			Namespace:'child'
		});
		var storage=Elemenx.Storage(child).Session;
		storage.Set('value','inline');
		expect(sessionStorage.getItem('inline.child.value')).not.toBeNull();
		expect(storage.Get('value')).toBe('inline');
		storage.Clear();
	});
});