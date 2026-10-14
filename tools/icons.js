'use strict';

var fs = require('fs');
var path = require('path');
var fail = require('./common.js').fail;

/* The attributes of the root <svg> of an icon that its <symbol> keeps: the way the icon is painted. */
var Painted = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'];

function attribute (tag, name) {
	var match = new RegExp('\\s' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i').exec(tag);

	return match ? (match[2] !== undefined ? match[2] : match[3]) : null;
}

/* The name of an icon file: 'Arrow Left.svg' -> 'arrow-left'. */
function iconName (file) {
	return path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/*
 * The <symbol> of one icon file. The ids inside it (gradients, masks, clip paths) get the name of the icon before
 * them, so the icons of a set do not collide once they are copied into one page. With currentColor, every color but
 * none becomes currentColor, so the icon takes the color of the text.
 */
function symbol (name, source, currentColor) {
	var text = String(source).replace(/<\?xml[\s\S]*?\?>/g, '').replace(/<!DOCTYPE[\s\S]*?>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
	var open = /<svg\b[^>]*>/i.exec(text);
	var close = text.lastIndexOf('</svg>');
	var tag;
	var body;
	var viewBox;
	var width;
	var height;
	var attributes = '';
	var i = 0;

	if (!open || close === -1 || close < open.index)
		fail('Icon is not an SVG: ' + name);

	tag = open[0];
	body = text.substring(open.index + tag.length, close).replace(/^\s+|\s+$/g, '');
	viewBox = attribute(tag, 'viewBox');
	width = parseFloat(attribute(tag, 'width'));
	height = parseFloat(attribute(tag, 'height'));

	if (!viewBox)
		viewBox = '0 0 ' + (isFinite(width) ? width : 24) + ' ' + (isFinite(height) ? height : 24);

	while (i < Painted.length) {
		if (attribute(tag, Painted[i]) !== null)
			attributes += ' ' + Painted[i] + '="' + attribute(tag, Painted[i]) + '"';

		i++;
	}

	body = body.replace(/\sid\s*=\s*"([^"]+)"/g, function (all, id) {
		return ' id="' + name + '-' + id + '"';
	});

	body = body.replace(/url\(\s*#([^)\s]+)\s*\)/g, function (all, id) {
		return 'url(#' + name + '-' + id + ')';
	});

	body = body.replace(/(\s(?:xlink:)?href\s*=\s*")#([^"]+)"/g, function (all, start, id) {
		return start + '#' + name + '-' + id + '"';
	});

	if (currentColor) {
		body = body.replace(/(\s(?:fill|stroke|stop-color)\s*=\s*")(?!none|currentColor|url)[^"]*"/gi, '$1currentColor"');
		attributes = attributes.replace(/(\s(?:fill|stroke)=")(?!none|currentColor|url)[^"]*"/gi, '$1currentColor"');
	}

	return '<symbol id="' + name + '" viewBox="' + viewBox + '"' + attributes + '>' + body.replace(/\s*\n\s*/g, '') + '</symbol>';
}

/*
 * Builds an icon set for the Icons Service of ElemenxUI from a directory of SVG files: one <symbol> per file, named
 * after the file, in the order of the names. Options: CurrentColor. Returns {Output, Names}.
 */
function Build (directory, output, options) {
	var source = path.resolve(directory);
	var target = path.resolve(output);
	var files;
	var names = [];
	var seen = {};
	var symbols = [];
	var name;
	var i = 0;

	options = options || {};

	if (!fs.existsSync(source) || !fs.statSync(source).isDirectory())
		fail('Icon directory not found: ' + source);

	files = fs.readdirSync(source).filter(function (file) {
		return /\.svg$/i.test(file) && path.resolve(source, file) !== target;
	}).sort();

	if (!files.length)
		fail('No SVG files in: ' + source);

	while (i < files.length) {
		name = iconName(files[i]);

		if (!name)
			fail('Icon file has no name: ' + files[i]);

		if (seen[name])
			fail('Two icons are named ' + name + ': ' + seen[name] + ' and ' + files[i]);

		seen[name] = files[i];

		names.push(name);
		symbols.push('\t' + symbol(name, fs.readFileSync(path.join(source, files[i]), 'utf8'), !!options.CurrentColor));

		i++;
	}

	fs.mkdirSync(path.dirname(target), {recursive: true});
	fs.writeFileSync(target, '<svg xmlns="http://www.w3.org/2000/svg">\n' + symbols.join('\n') + '\n</svg>\n');

	return {Output: target, Names: names};
}

module.exports = {
	Build: Build
};
