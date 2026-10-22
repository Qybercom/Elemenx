import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import index from '../../libraries/ElemenxUI/index.css?raw';
import blockStyle from '../../libraries/ElemenxUI/components/Block/Block.css?raw';
import windowStyle from '../../libraries/ElemenxUI/components/Window/Window.css?raw';
import fantasy from '../../libraries/ElemenxUI/themes/fantasy.css?raw';
import scifi from '../../libraries/ElemenxUI/themes/scifi.css?raw';

/*
 * The folders of HeaderShape="trapezoid" (Block and Window) in the default theme, in a part of the page with a scheme
 * of its own and in the game themes: the stylesheets of the Library, as the page loads them.
 */
var host;

beforeAll(function () {
	[index, blockStyle, windowStyle, fantasy, scifi].forEach(function (text) {
		var style = document.createElement('style');

		style.textContent = text;

		document.head.appendChild(style);
	});

	document.body.setAttribute('data-theme', 'light');
	document.body.setAttribute('data-scheme', 'light');
});

afterEach(function () {
	if (host)
		host.remove();

	host = null;
});

function mount (html) {
	host = document.createElement('div');
	host.innerHTML = html;

	document.body.appendChild(host);

	return host;
}

function block () {
	return '<section class="elemenx-block framed trapezoid"><header class="elemenx-block-header"><span class="elemenx-block-tab"><span class="elemenx-block-title">Shields</span></span><span class="elemenx-block-actions"><button>A</button></span></header><div class="elemenx-block-body">Body</div></section>';
}

function folder (level) {
	return '<section class="elemenx-window game trapezoid ' + level + '" style="width: 300px; height: 200px;"><header class="elemenx-window-header"><span class="elemenx-window-tab"><span class="elemenx-window-titles"><span class="elemenx-window-title">Bag</span></span></span></header></section>';
}

describe('Regression: the folders of HeaderShape trapezoid', function () {
	it('computes the tokens made of other tokens from the colors of a part of the page with a dark scheme of its own', function () {
		var root = mount('<div data-theme="dark" data-scheme="dark"><i class="band" style="background: var(--elemenx-block-title-band);"></i><i class="raised" style="background: var(--elemenx-surface-raised);"></i>' + block() + '</div>');
		var band = getComputedStyle(root.querySelector('.band')).backgroundColor;

		expect(band).toBe(getComputedStyle(root.querySelector('.raised')).backgroundColor);
		expect(band).toBe('rgb(36, 40, 46)');
		expect(getComputedStyle(root.querySelector('.elemenx-block-tab')).backgroundColor).toBe('rgb(36, 40, 46)');
	});

	it('puts the actions of a folder Block at the end of its header, without a padding after them', function () {
		var root = mount(block());

		expect(getComputedStyle(root.querySelector('.elemenx-block-actions')).paddingInlineEnd).toBe('0px');
	});

	it('draws the slope of a folder Block in a game panel whose band is a gradient', function () {
		var root = mount('<div data-theme="scifi" data-scheme="dark"><div class="elemenx-game-panel">' + block() + '</div></div>');
		var slope = getComputedStyle(root.querySelector('.elemenx-block-tab'), '::after');

		expect(slope.backgroundImage).toContain('linear-gradient');
		expect(slope.backgroundImage.match(/linear-gradient/g).length).toBe(2);
		expect(slope.maskImage).toContain('linear-gradient');
	});

	it('begins the body of a game folder under its header when the theme makes the header taller', function () {
		var root = mount('<div data-theme="scifi" data-scheme="dark" style="position: relative;">' + folder('primary') + '</div>');
		var element = root.querySelector('.elemenx-window');

		expect(getComputedStyle(element, '::before').top).toBe(root.querySelector('.elemenx-window-header').offsetHeight + 'px');
	});

	it('gives a game folder a decor without the figures that would stand on its tab, and its body a square first corner', function () {
		var root = mount('<div data-theme="fantasy" data-scheme="dark" style="position: relative;">' + folder('primary') + folder('secondary') + folder('plain') + '<section class="elemenx-window game primary"></section></div>');
		var windows = root.querySelectorAll('.elemenx-window');
		var whole = getComputedStyle(windows[3], '::after').backgroundImage;
		var primary = getComputedStyle(windows[0], '::after').backgroundImage;

		expect(primary).not.toBe('none');
		expect(primary).not.toBe(whole);
		expect(primary).not.toContain('translate(-88 0)');
		expect(getComputedStyle(windows[1], '::after').backgroundImage).not.toContain('translate(-60 0)');
		expect(getComputedStyle(windows[2], '::after').backgroundImage).toBe('none');
		expect(getComputedStyle(windows[0], '::before').borderStartStartRadius).toBe('0px');
	});
});
