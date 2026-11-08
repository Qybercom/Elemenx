import { afterEach, describe, expect, it } from 'vitest';
import index from '../../libraries/ElemenxUI/index.css?raw';
import windowStyle from '../../libraries/ElemenxUI/components/Window/Window.css?raw';
import fantasy from '../../libraries/ElemenxUI/themes/fantasy.css?raw';
import scifi from '../../libraries/ElemenxUI/themes/scifi.css?raw';
import gaming from '../../libraries/ElemenxGaming/index.css?raw';
import gameFantasy from '../../libraries/ElemenxGaming/themes/fantasy.css?raw';
import gameScifi from '../../libraries/ElemenxGaming/themes/scifi.css?raw';

/*
 * Regression: the game variant of Window moved from Window.css to the index.css of ElemenxGaming, and the stylesheet of
 * Window comes into the page with the first window, after the stylesheets of the Libraries: its rules as strong as those
 * of the game variant won over them (the body of a folder in the theme fantasy lost its glass and its frame). A game
 * window looks the same whichever of the two comes first.
 */
var frames = [];

function page (styles, theme, html) {
	var frame = document.createElement('iframe');

	frame.style.width = '600px';
	frame.style.height = '400px';

	frames.push(frame);

	document.body.appendChild(frame);

	var inner = frame.contentDocument;

	inner.open();
	inner.write('<!doctype html><html><head>' + styles.map(function (text) {
		return '<style>' + text + '</style>';
	}).join('') + '</head><body data-theme="' + theme + '" data-scheme="dark">' + html + '</body></html>');
	inner.close();

	return frame;
}

function folder (level) {
	return '<section class="elemenx-window game trapezoid ' + level + '" style="position: absolute; width: 300px; height: 200px;"><header class="elemenx-window-header"><span class="elemenx-window-tab"><span class="elemenx-window-titles"><span class="elemenx-window-title">Bag</span></span></span><span class="elemenx-window-actions"><button>x</button></span></header><div class="elemenx-window-body">Body</div><footer class="elemenx-window-footer">Footer</footer></section>';
}

/* The look of each part of the windows of a page: every property of each part and of its ::before and ::after. */
function look (frame) {
	var view = frame.contentWindow;
	var result = [];

	frame.contentDocument.querySelectorAll('.elemenx-window, .elemenx-window *').forEach(function (element, at) {
		[null, '::before', '::after'].forEach(function (pseudo) {
			var style = view.getComputedStyle(element, pseudo);

			Array.from(style).filter(function (name) {
				return name.indexOf('--') !== 0 && !/^(transition|animation)/.test(name);
			}).forEach(function (name) {
				result.push(at + ' ' + element.className + (pseudo || '') + ' ' + name + ': ' + style.getPropertyValue(name));
			});
		});
	});

	return result;
}

afterEach(function () {
	while (frames.length)
		frames.pop().remove();
});

describe('Regression: the game variant of Window in ElemenxGaming', function () {
	['fantasy', 'scifi', 'dark'].forEach(function (theme) {
		it('looks the same in the theme ' + theme + ' when the stylesheet of Window comes after those of the Libraries', function () {
			var html = folder('primary') + folder('secondary') + folder('plain') + '<section class="elemenx-window game primary active" style="position: absolute; top: 210px; width: 300px; height: 150px;"><header class="elemenx-window-header"><span class="elemenx-window-title">Status</span></header><div class="elemenx-window-body">Body</div></section>';
			var libraries = [index, fantasy, scifi, gaming, gameFantasy, gameScifi];
			var first = page([index, windowStyle, fantasy, scifi, gaming, gameFantasy, gameScifi], theme, html);
			var last = page(libraries.concat([windowStyle]), theme, html);
			var before = look(first);
			var after = look(last);

			expect(before.length).toBeGreaterThan(1000);

			expect(after.filter(function (line, at) {
				return line !== before[at];
			}).slice(0, 10)).toEqual([]);
		});
	});
});
