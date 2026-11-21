import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount (template) {
	var component = Elemenx.Component(unique('PanesHost'), {$Template: '<div style="width: 1000px; height: 600px">' + template + '</div>'})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await tick(50);

	return component;
}

/*
 * Regression: the panes of FloraEditor, of the palette of Blueprint, of the fields of CutsceneEditor and of the panel of
 * TextureLab were of a width of their own, none dragged as the panes of the other editors are (EditorPanes, then of
 * ElemenxGraphics alone; Blueprint is of ElemenxUI). Each now as wide as its edge is dragged, kept in the browser by its
 * PanesKey for the next time.
 */
describe('Regression: the panes of FloraEditor, Blueprint, CutsceneEditor and TextureLab as wide as their edges are dragged', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['FloraEditor', 'Blueprint', 'CutsceneEditor', 'TextureLab']);
	}, 60000);

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	[
		{Tag: '<FloraEditor />', Root: '.elemenx-flora-editor', Key: 'flora-editor', Panes: [['.elemenx-flora-editor-reference', 'reference', 'right'], ['.elemenx-flora-editor-panel', 'panel', 'left']]},
		{Tag: '<Blueprint Type="generator" />', Root: '.elemenx-blueprint', Key: 'blueprint', Panes: [['.elemenx-blueprint-side', 'palette', 'right']]},
		{Tag: '<TextureLab />', Root: '.elemenx-texture-lab', Key: 'texture-lab', Panes: [['.elemenx-texture-lab-panel', 'panel', 'left']]},
		{Tag: '<CutsceneEditor />', Root: '.elemenx-cutscene-editor', Key: 'cutscene-editor', Panes: []}
	].forEach(function (each) {
		it('drags the panes of ' + each.Tag + ' and keeps their widths', async function () {
			var widths = {};
			var host;
			var editor;

			each.Panes.forEach(function (pane) {
				widths[pane[1]] = 311;
			});

			window.localStorage.setItem('elemenx-panes:' + each.Key, JSON.stringify(widths));

			host = await mount(each.Tag);

			await waitFor(function () {
				return each.Panes.every(function (pane) {
					return host.$Element().querySelector(pane[0]);
				});
			}, 8000);

			editor = Elemenx.Instance(host.$Element().querySelector(each.Root));

			expect(editor.PanesKey).toBe(each.Key);

			each.Panes.forEach(function (pane) {
				var node = host.$Element().querySelector(pane[0]);

				expect(node.style.width).toBe('311px');
				expect(node.querySelector('.elemenx-resize-handle.' + pane[2])).not.toBe(null);
			});

			editor.PaneResized('fields', {detail: {Width: 260}});

			expect(JSON.parse(window.localStorage.getItem('elemenx-panes:' + each.Key)).fields).toBe(260);

			window.localStorage.removeItem('elemenx-panes:' + each.Key);
		}, 30000);
	});
});
