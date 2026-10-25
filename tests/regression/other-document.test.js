import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import keyboardSource from '../../libraries/ElemenxUI/components/Keyboard/Keyboard.js?raw';
import keyboardTemplate from '../../libraries/ElemenxUI/components/Keyboard/Keyboard.html?raw';

var owned = [];
var frames = [];
var open;

/* Another document of the same origin, as the window the Application opens (Native.OpenWindow), with the styles of the Library. */
function other () {
	var frame = document.createElement('iframe');

	document.body.appendChild(frame);

	frames.push(frame);

	Array.prototype.forEach.call(document.querySelectorAll('style, link[rel="stylesheet"]'), function (node) {
		frame.contentDocument.head.appendChild(node.cloneNode(true));
	});

	return frame.contentWindow;
}

function pointer (element, type) {
	var view = element.ownerDocument.defaultView;

	element.dispatchEvent(new view.PointerEvent(type, {pointerType: 'mouse', bubbles: type !== 'pointerenter' && type !== 'pointerleave'}));
}

describe('Regression: ElemenxUI in another document (a window the Application opened)', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/directives/Tip.js');
		await import('../../libraries/ElemenxUI/services/Find.js');
		await import('../../libraries/ElemenxUI/services/Hotkeys.js');
		await import('../../libraries/ElemenxUI/services/Native.js');

		/* The Keyboard with its template inline: the page of the tests serves no Library. */
		new Function(keyboardSource.replace("$StyleURL: 'Keyboard.css',", '').replace("$TemplateURL: 'Keyboard.html'", function () {
			return '$Template: ' + JSON.stringify(keyboardTemplate);
		}))();
		await import('../../libraries/ElemenxUI/index.css');
	});

	beforeEach(function () {
		resetDOM();

		open = window.open;
	});

	afterEach(function () {
		window.open = open;

		while (owned.length) owned.pop().$Destroy();

		while (frames.length) frames.pop().remove();
	});

	it('shows a *tip in the document of its element, not in the page', async function () {
		var view = other();
		var component = Elemenx.Component(unique('Tipped'), {
			$Template: '<button type="button" *tip="{Text: \'Away\', Delay: 10}">Button</button>'
		})();
		var tip;

		owned.push(component);

		view.document.body.appendChild(component.$Element());

		pointer(component.$Element(), 'pointerenter');

		await tick(40);

		tip = view.document.getElementById('elemenx-tip');

		expect(tip).not.toBe(null);
		expect(tip.hidden).toBe(false);
		expect(tip.textContent).toContain('Away');
		expect(document.getElementById('elemenx-tip') === null || document.getElementById('elemenx-tip').hidden).toBe(true);

		pointer(component.$Element(), 'pointerleave');

		expect(tip.hidden).toBe(true);
	});

	it('shows the keys held in the page when made in a template, and in another document once it is put there', async function () {
		var view = other();
		var component = Elemenx.Component(unique('Keys'), {
			$Template: '<div><Keyboard Layout="compact" [Live]="true"></Keyboard></div>'
		})();
		var key;

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await tick(0);

		key = component.$Element().querySelector('[data-code="KeyQ"]');

		document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'q', code: 'KeyQ', bubbles: true}));

		expect(key.classList.contains('held')).toBe(true);

		document.body.dispatchEvent(new KeyboardEvent('keyup', {key: 'q', code: 'KeyQ', bubbles: true}));

		expect(key.classList.contains('held')).toBe(false);

		view.document.body.appendChild(component.$Element());

		pointer(key, 'pointerover');

		view.document.body.dispatchEvent(new view.KeyboardEvent('keydown', {key: 'q', code: 'KeyQ', bubbles: true}));

		expect(key.classList.contains('held')).toBe(true);
	});

	it('finds the text of another document and paints its highlights in that window', function () {
		var view = other();
		var find = Elemenx.Service('Find');
		var root = view.document.createElement('div');
		var ranges;

		root.textContent = 'one two one';

		view.document.body.appendChild(root);

		ranges = find.Ranges(root, 'one');

		expect(ranges.length).toBe(2);
		expect(ranges[0].startContainer.ownerDocument).toBe(view.document);

		find.Show('other-document', ranges, 1);

		expect(view.CSS.highlights.get('elemenx-find').size).toBe(2);
		expect(view.CSS.highlights.get('elemenx-find-current').size).toBe(1);

		find.Clear('other-document');

		expect(view.CSS.highlights.get('elemenx-find').size).toBe(0);
	});

	it('opens a window with the element in it and hears the hotkeys pressed there until it closes', async function () {
		var view = other();
		var native = Elemenx.Service('Native');
		var hotkeys = Elemenx.Service('Hotkeys');
		var element = document.createElement('p');
		var pressed = 0;
		var opened = null;
		var closed = [];
		var bound;

		element.textContent = 'In the window';

		window.open = function (url, name) {
			expect(name).toBe('elemenx-window-notes');

			return view;
		};

		bound = hotkeys.Bind('ctrl+k', function () {
			pressed++;
		});

		native.On('closed', function (event) {
			closed.push(event.ID);
		});

		native.OpenWindow({ID: 'notes', Element: element, Title: 'Notes'}, function (error, result) {
			expect(error).toBe(null);

			opened = result;
		});

		expect(opened.Window).toBe(view);
		expect(view.document.title).toBe('Notes');
		expect(view.document.body.classList.contains('elemenx-native-window')).toBe(true);
		expect(view.document.body.contains(element)).toBe(true);
		expect(native.Windows()).toEqual(['notes']);

		view.document.body.dispatchEvent(new view.KeyboardEvent('keydown', {key: 'k', code: 'KeyK', ctrlKey: true, bubbles: true}));

		expect(pressed).toBe(1);

		view.dispatchEvent(new view.Event('pagehide'));

		await tick(0);

		expect(closed).toEqual(['notes']);

		view.document.body.dispatchEvent(new view.KeyboardEvent('keydown', {key: 'k', code: 'KeyK', ctrlKey: true, bubbles: true}));

		expect(pressed).toBe(1);

		hotkeys.Unbind(bound);
	});
});
