import {describe,expect,it} from 'vitest';
import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

var root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');

function packFiles () {
	var npm=process.env.npm_execpath;
	if (!npm) throw new Error('npm_execpath is not available; run this test through an npm script');

	var output=childProcess.execFileSync(process.execPath,[npm,'pack','--dry-run','--json'],{
		cwd:root,
		encoding:'utf8',
		stdio:['ignore','pipe','pipe']
	});
	var result=JSON.parse(output);
	return result[0].files.map(function (file) { return file.path; });
}

describe('Elemenx npm release surface',function () {
	it('ships runtime, CLI, tooling, documentation and official examples without generated dist',function () {
		var files=packFiles();

		expect(files).toContain('elemenx.js');
		expect(files).toContain('elemenx-cli.js');
		expect(files).toContain('tools/builder.js');
		expect(files).toContain('tools/generator.js');
		expect(files).toContain('tools/server.js');
		expect(files).toContain('docs/BUILDER.md');
		expect(files).toContain('docs/PUBLIC-API.md');
		expect(files).toContain('examples/Simple/index.html');
		expect(files).toContain('examples/Advanced/app.js');
		expect(files.some(function (file) { return /(^|\/)dist\//.test(file); })).toBe(false);
	});

	it('keeps package entry points valid',function () {
		var manifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

		expect(manifest.main).toBe('elemenx.js');
		expect(manifest.bin).toEqual({elemenx:'elemenx-cli.js'});
		expect(fs.existsSync(path.join(root,manifest.main))).toBe(true);
		expect(fs.existsSync(path.join(root,manifest.bin.elemenx))).toBe(true);
	});
});