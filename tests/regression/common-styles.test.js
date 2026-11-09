import { afterEach, describe, expect, it } from 'vitest';
import common from '../../libraries/ElemenxCommon/index.css?raw';

/*
 * The directives of ElemenxCommon (*draggable, *droppable, *resizable) are styled by its own index.css, and stand alone: in
 * a page with no ElemenxUI an element held for a drag keeps the page from scrolling under the finger, the marker of a drop
 * and the handles are drawn, each token read with its default as a fallback. Regression: those rules were in ElemenxUI.
 */
describe('Contract: the stylesheet of ElemenxCommon, on its own', function () {
	var added = [];

	function page (html) {
		var frame = document.createElement('iframe');

		frame.style.width = '400px';
		frame.style.height = '300px';

		document.body.appendChild(frame);

		added.push(frame);

		frame.contentDocument.open();
		frame.contentDocument.write('<!doctype html><html><head><style>' + common + '</style></head><body>' + html + '</body></html>');
		frame.contentDocument.close();

		return frame.contentWindow;
	}

	afterEach(function () {
		while (added.length)
			added.pop().remove();
	});

	it('styles what its directives put on elements with no ElemenxUI in the page, its tokens falling back to their defaults', function () {
		var view = page('<div class="elemenx-draggable">a</div><div class="elemenx-drop-marker" style="width: 10px; height: 2px"></div><div class="elemenx-resizable" style="position: relative; width: 100px; height: 60px"><span class="elemenx-resize-handle right"></span></div>');
		var doc = view.document;
		var marker = view.getComputedStyle(doc.querySelector('.elemenx-drop-marker'));

		expect(view.getComputedStyle(doc.querySelector('.elemenx-draggable')).touchAction).toBe('none');
		expect(marker.position).toBe('fixed');
		expect(marker.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
		expect(view.getComputedStyle(doc.querySelector('.elemenx-resize-handle')).position).toBe('absolute');
		expect(common).not.toMatch(/var\(--elemenx-[a-z0-9-]+\)/);
	});
});
