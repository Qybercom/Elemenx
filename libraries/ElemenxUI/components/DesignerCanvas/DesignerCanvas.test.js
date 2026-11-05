import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];
var designer;

function nodes (canvas) {
	return Array.prototype.map.call(canvas.$Element().querySelectorAll('.elemenx-designer-page-host [data-designer-id]'), function (element) {
		return element.getAttribute('data-designer-id');
	});
}

describe('Contract: a DesignerCanvas shows a document of its own (Document)', function () {
	beforeAll(async function () {
		localStorage.removeItem('elemenx-designer:document');
		localStorage.removeItem('elemenx-designer:projects');
		localStorage.removeItem('elemenx-designer:project');

		await loadElemenx();

		Use(['DesignerCanvas', 'service:Designer']);

		designer = Elemenx.Service('Designer');

		designer.Use({Components: [], Classes: {}});
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('sleeps on another document (its page, no selection) and edits it when pressed, telling its owner (wake)', async function () {
		var woken = [];
		var home;
		var other;
		var title;
		var paragraph;
		var host;
		var canvas;

		designer.Create('application', unique('Panes'));

		home = designer.Opened();
		title = designer.Insert('heading', 'root');
		other = designer.AddDocument('page', 'Other');

		designer.Open(other);

		paragraph = designer.Insert('paragraph', 'root');

		designer.Open(home);
		designer.Select(title);

		host = Elemenx.Component(unique('PaneHost'), {
			$Template: '<div style="width: 600px; height: 400px"><DesignerCanvas [document]="Shown" (wake)="Woken" /></div>',
			Shown: other,
			Woken: function (id, canvas) {
				woken.push([id, canvas.Document]);
			}
		})();

		owned.push(host);

		document.getElementById('mount').appendChild(host.$Element());

		await waitFor(function () {
			return host.$Element().querySelector('.elemenx-designer-canvas') && nodes(Elemenx.Instance(host.$Element().querySelector('.elemenx-designer-canvas'))).length > 0;
		}, 4000);

		canvas = Elemenx.Instance(host.$Element().querySelector('.elemenx-designer-canvas'));

		/* Its own document on the page, not the one being edited; the selection of that one is not its own. */
		expect(nodes(canvas)).toEqual([paragraph]);
		expect(canvas.Awake(false)).toBe(false);
		expect(canvas.Selected(canvas.Version)).toBe(null);
		expect(designer.Opened()).toBe(home);

		/* A press: the owner hears of it, and the document is the one being edited. */
		canvas.Pressed({clientX: -1000, clientY: -1000});

		expect(woken).toEqual([[other, other]]);
		expect(designer.Opened()).toBe(other);
		expect(canvas.Awake(false)).toBe(true);

		/* The document edited changes on it, as on any canvas. */
		designer.Insert('heading', 'root');

		await tick(50);

		expect(nodes(canvas).length).toBe(2);

		/* Another document given: it sleeps again, on that one. */
		host.Shown = home;

		await waitFor(function () {
			return nodes(canvas)[0] === title;
		}, 2000);

		expect(canvas.Awake(false)).toBe(false);
	});
});
