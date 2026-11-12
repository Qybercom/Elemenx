import { describe, expect, test, beforeEach } from 'vitest';
import '../../elemenx.js';

var serial = 0;

function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

describe('Contract: Elemenx.EventSource, the givers of the events of templates no element gives by itself', function () {
	beforeEach(function () {
		document.body.innerHTML = '';
	});

	test('starts its source on an element once for all its names, gives its events to the handlers, stops with the last one', function () {
		var name = unique('EventSourceHost');
		var started = [];
		var stopped = 0;
		var source = Elemenx.EventSource(['testpinch', 'testturn'], {
			Attach: function (element) {
				started.push(element);

				return function () {
					stopped++;
				};
			}
		});
		var host;
		var area;

		expect(Elemenx.EventSource('testpinch')).toBe(source);
		expect(Elemenx.EventSource('testturn')).toBe(source);
		expect(Elemenx.EventSource('nosuchevent')).toBe(null);

		host = Elemenx.Component(name, {
			$Template: '<main><div class="area" (testpinch)="Pinched" (testturn)="Turned"></div><span class="plain" (click)="Clicked"></span></main>',
			Scales: [],
			Turns: 0,
			Pinched: function (event) {
				this.Scales.push(event.detail.Scale);
			},
			Turned: function () {
				this.Turns++;
			},
			Clicked: function () {}
		})();

		document.body.appendChild(host.$Element());

		area = host.$Element().querySelector('.area');

		/* Once for the element, whatever of its names it listens to; none for an event of no source. */
		expect(started).toEqual([area]);

		area.dispatchEvent(new CustomEvent('testpinch', {detail: {Scale: 1.5}}));
		area.dispatchEvent(new CustomEvent('testturn', {detail: {Angle: 0.2}}));

		expect(host.Scales).toEqual([1.5]);
		expect(host.Turns).toBe(1);
		expect(stopped).toBe(0);

		host.$Destroy();

		expect(stopped).toBe(1);
		expect(area.__ElemenxEventSources).toEqual([]);
	});

	test('takes no source without Attach', function () {
		expect(function () {
			Elemenx.EventSource('broken', {});
		}).toThrow('Elemenx.EventSource needs names and a source with Attach(element).');
	});
});
