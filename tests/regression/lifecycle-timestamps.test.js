import {beforeAll, describe, expect, it} from 'vitest';
import {loadElemenx} from '../setup.js';

describe('lifecycle timestamps', function () {
	beforeAll(async function () { await loadElemenx(); });
	it('keeps runtime StartedAt immutable from callers', function () {
		var started=Elemenx.StartedAt();
		var value=started.getTime();
		started.setTime(0);
		expect(Elemenx.StartedAt()).toBeInstanceOf(Date);
		expect(Elemenx.StartedAt().getTime()).toBe(value);
	});

	it('initializes network transport lifecycle timestamps', function () {
		var xhr=Elemenx.Network.XHR({URL:'/lifecycle-timestamps'});
		var started=xhr.$StartedAt();
		expect(started).toBeInstanceOf(Date);
		expect(xhr.$ConnectedAt()).toBe(null);
		expect(xhr.$ClosedAt()).toBe(null);
		started.setTime(0);
		expect(xhr.$StartedAt().getTime()).toBeGreaterThan(0);
	});
});