import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import childProcess from 'child_process';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Icons = require('../../tools/icons.js');
var temporary = [];

function directory (files) {
	var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-icons-'));
	var name;

	temporary.push(root);

	for (name in files) {
		fs.writeFileSync(path.join(root, name), files[name]);
	}

	return root;
}

afterEach(function () {
	var i = 0;

	while (i < temporary.length) {
		fs.rmSync(temporary[i], {recursive: true, force: true});

		i++;
	}

	temporary = [];
});

describe('Elemenx icon sets', function () {
	it('builds one symbol per SVG file, named after the file and in the order of the names', function () {
		var root = directory({
			'Arrow Left.svg': '<?xml version="1.0"?>\n<!-- exported -->\n<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">\n\t<path d="M19 12H5"/>\n\t<path d="m12 19-7-7 7-7"/>\n</svg>\n',
			'badge.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="#e33"/></svg>',
			'notes.txt': 'not an icon'
		});
		var result = Icons.Build(root, path.join(root, 'out', 'set.svg'));
		var sprite = fs.readFileSync(result.Output, 'utf8');

		expect(result.Names).toEqual(['arrow-left', 'badge']);
		expect(sprite).toBe('<svg xmlns="http://www.w3.org/2000/svg">\n' +
			'\t<symbol id="arrow-left" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></symbol>\n' +
			'\t<symbol id="badge" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#e33"/></symbol>\n' +
			'</svg>\n');
	});

	it('turns colors into currentColor on request and keeps the inner ids of each icon apart', function () {
		var root = directory({
			'glow.svg': '<svg viewBox="0 0 24 24" fill="#111"><defs><linearGradient id="a"><stop stop-color="#fff"/></linearGradient></defs><rect width="24" height="24" fill="url(#a)" stroke="none"/><use href="#a"/></svg>'
		});
		var sprite = fs.readFileSync(Icons.Build(root, path.join(root, 'set.svg'), {CurrentColor: true}).Output, 'utf8');

		expect(sprite).toContain('<symbol id="glow" viewBox="0 0 24 24" fill="currentColor">');
		expect(sprite).toContain('<linearGradient id="glow-a"><stop stop-color="currentColor"/>');
		expect(sprite).toContain('fill="url(#glow-a)" stroke="none"');
		expect(sprite).toContain('<use href="#glow-a"/>');
	});

	it('refuses a directory without icons, two files with one name and a file that is not an SVG', function () {
		expect(function () {
			Icons.Build(directory({'a.txt': ''}), path.join(os.tmpdir(), 'elemenx-none.svg'));
		}).toThrow('No SVG files in: ');

		expect(function () {
			Icons.Build(directory({'Add.svg': '<svg></svg>', 'add .svg': '<svg></svg>'}), path.join(os.tmpdir(), 'elemenx-twice.svg'));
		}).toThrow(/Two icons are named add/);

		expect(function () {
			Icons.Build(directory({'broken.svg': '<path d="M0 0"/>'}), path.join(os.tmpdir(), 'elemenx-broken.svg'));
		}).toThrow('Icon is not an SVG: broken');
	});

	it('is the icons command of the CLI', function () {
		var root = directory({'a.svg': '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>', 'b.svg': '<svg viewBox="0 0 24 24"><path d="M2 2"/></svg>'});
		var cli = path.resolve(process.cwd(), 'elemenx-cli.js');
		var output = childProcess.execFileSync(process.execPath, [cli, 'icons', root, path.join(root, 'set.svg'), '--current-color'], {encoding: 'utf8'});

		expect(output).toBe('Elemenx icons: 2 icons in ' + path.join(root, 'set.svg') + '\n');
		expect(fs.readFileSync(path.join(root, 'set.svg'), 'utf8')).toContain('<symbol id="b" viewBox="0 0 24 24"><path d="M2 2"/></symbol>');
		expect(childProcess.spawnSync(process.execPath, [cli, 'icons', root], {encoding: 'utf8'}).stderr).toBe('Elemenx CLI: usage: elemenx icons <directory> <output.svg> [--current-color]\n');
	});
});
