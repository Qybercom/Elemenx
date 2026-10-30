'use strict';

/*
 * The splash of an Application: what its page shows from its first paint, before the framework and the Application load,
 * until the first Application is ready (Elemenx.Splash in elemenx.js takes it away; the Application may hold it). The
 * Splash of elemenx.config.js says how it looks: true for the default look, or {Image (a path of the project, the logo),
 * Background and Color (CSS colors; the ones of the light or the dark theme of the system by default), Text, Spinner
 * (true by default, false with Progress), Progress (a bar and the percent of the page loaded: the build writes the bytes
 * of its scripts and styles in data-total, Elemenx.Splash counts them as they come), MinTime (milliseconds it stays at
 * least, from the start of the page; 0), Timeout (milliseconds it stays at most; 10000)}. splash.html in the project is its content instead (the image, the text and the spinner), as it
 * is. The markup goes at the top of the body of the page, its style inline, no script: a build writes it into the page,
 * the development server serves the page with it.
 */

var fs = require('fs');
var path = require('path');

/* The text of an attribute or of an element, escaped. */
function escape (value) {
	return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* A CSS color, or an error: names, #hex, rgb(), hsl(), var() are fine; nothing that closes a rule. */
function color (value, name) {
	if (!/^[#A-Za-z0-9(),.%\s-]+$/.test(String(value)))
		throw new Error('Splash.' + name + ' must be a CSS color: ' + value);

	return String(value);
}

/*
 * The splash of a project, checked: {Image, Background, Color, Text, Spinner, MinTime, Timeout, HTML}, or null when it
 * has none (no Splash, Splash false, and no splash.html).
 */
function settings (project, splash) {
	var file = path.join(project, 'splash.html');
	var html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/^﻿/, '').trim() : '';
	var value;

	if (splash === false || (splash === undefined && !html)) return null;

	value = splash === true || splash === undefined ? {} : splash;

	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Splash must be true, false or {Image, Background, Color, Text, Spinner, Progress, MinTime, Timeout}');

	if (value.Progress !== undefined && typeof value.Progress !== 'boolean')
		throw new Error('Splash.Progress must be true or false: ' + value.Progress);

	['MinTime', 'Timeout'].forEach(function (name) {
		if (value[name] !== undefined && !(Number(value[name]) >= 0))
			throw new Error('Splash.' + name + ' must be a number of milliseconds: ' + value[name]);
	});

	return {
		Image: value.Image ? String(value.Image) : '',
		Background: value.Background ? color(value.Background, 'Background') : '',
		Color: value.Color ? color(value.Color, 'Color') : '',
		Text: value.Text ? String(value.Text) : '',
		Spinner: value.Spinner === undefined ? value.Progress !== true : value.Spinner !== false,
		Progress: value.Progress === true,
		MinTime: Math.round(Number(value.MinTime) || 0),
		Timeout: value.Timeout === undefined ? 10000 : Math.round(Number(value.Timeout)),
		HTML: html
	};
}

/* The markup of a splash: its style, then the element, with its content. */
function markup (splash) {
	var content = splash.HTML || [
		splash.Image ? '<img class="elemenx-splash-image" src="' + escape(splash.Image) + '" alt="">' : '',
		splash.Text ? '<p class="elemenx-splash-text">' + escape(splash.Text) + '</p>' : '',
		splash.Spinner ? '<span class="elemenx-splash-spinner" aria-hidden="true"></span>' : '',
		splash.Progress ? '<span class="elemenx-splash-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"><span class="elemenx-splash-bar"></span></span><span class="elemenx-splash-percent" aria-hidden="true"></span>' : ''
	].join('');
	var style = [
		'#elemenx-splash{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;margin:0;',
		'background:' + (splash.Background || '#ffffff') + ';color:' + (splash.Color || '#1f2328') + ';font:16px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;transition:opacity .25s ease}',
		splash.Background || splash.Color ? '' : '@media (prefers-color-scheme:dark){#elemenx-splash{background:#1e1f22;color:#dfe1e5}}',
		'#elemenx-splash.elemenx-splash-out{opacity:0;pointer-events:none}',
		'.elemenx-splash-image{max-width:40vw;max-height:30vh}',
		'.elemenx-splash-text{margin:0}',
		'.elemenx-splash-spinner{width:28px;height:28px;box-sizing:border-box;border:3px solid currentColor;border-right-color:transparent;border-radius:50%;opacity:.6;animation:elemenx-splash .8s linear infinite}',
		'@keyframes elemenx-splash{to{transform:rotate(360deg)}}',
		splash.Progress ? [
			'.elemenx-splash-progress{display:block;width:min(240px,60vw);height:4px;overflow:hidden;border-radius:2px;background:rgba(127,127,127,.25)}',
			'.elemenx-splash-bar{display:block;width:calc(var(--elemenx-splash-progress,0)*1%);height:100%;background:currentColor;transition:width .2s ease}',
			'#elemenx-splash[data-progress=""] .elemenx-splash-bar{width:30%;animation:elemenx-splash-slide 1.2s ease-in-out infinite}',
			'@keyframes elemenx-splash-slide{from{transform:translateX(-100%)}to{transform:translateX(340%)}}',
			'.elemenx-splash-percent{min-height:1.2em;font-size:13px;opacity:.7;font-variant-numeric:tabular-nums}'
		].join('') : '',
		'@media (prefers-reduced-motion:reduce){.elemenx-splash-spinner{animation-duration:2.4s}}'
	].join('');

	return '<style id="elemenx-splash-style">' + style + '</style>\n<div id="elemenx-splash" role="status" aria-busy="true" data-min="' + splash.MinTime + '" data-timeout="' + splash.Timeout + '"' + (splash.Progress ? ' data-progress="" data-total="0"' : '') + '>' + content + '</div>\n';
}

/* A page with the splash at the top of its body; a page that has one already, or no body, stays as it is. */
function inject (page, splash) {
	var body;

	if (!splash || page.indexOf('id="elemenx-splash"') !== -1) return page;

	body = /<body\b[^>]*>/i.exec(page);

	if (!body)
		return page;

	return page.substring(0, body.index + body[0].length) + '\n' + markup(splash) + page.substring(body.index + body[0].length).replace(/^\r?\n/, '');
}

module.exports = {
	Settings: settings,
	Markup: markup,
	Inject: inject
};
