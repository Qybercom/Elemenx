import {afterEach,describe,expect,it} from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import childProcess from 'child_process';
import {createRequire} from 'module';

var require=createRequire(import.meta.url);
var Generator=require('../../tools/generator.js');
var temporary=[];

function project () {
	var root=fs.mkdtempSync(path.join(os.tmpdir(),'elemenx-generator-'));
	temporary.push(root);
	fs.mkdirSync(path.join(root,'application'),{recursive:true});
	fs.writeFileSync(path.join(root,'application','index.js'),'[]');
	return root;
}

afterEach(function () {
	var i=0;
	while (i < temporary.length) {
		fs.rmSync(temporary[i],{recursive:true,force:true});
		i++;
	}
	temporary=[];
});

describe('Elemenx graph-aware generator',function () {
	it('registers a root Component directly in application/index.js',function () {
		var root=project();

		Generator.Generate(root,'component','TestComponent',{});

		expect(fs.existsSync(path.join(root,'application','TestComponent','TestComponent.js'))).toBe(true);
		expect(fs.existsSync(path.join(root,'application','TestComponent','TestComponent.html'))).toBe(true);
		expect(fs.readFileSync(path.join(root,'application','index.js'),'utf8')).toContain("'TestComponent/TestComponent.js'");
	});

	it('uses the nearest existing index.js as graph owner',function () {
		var root=project();
		var nested=path.join(root,'application','foo','bar','nested');
		fs.mkdirSync(nested,{recursive:true});
		fs.writeFileSync(path.join(nested,'index.js'),'[]');

		var result=Generator.Generate(root,'component','foo/bar/nested/TestComponent',{});

		expect(result.Index).toBe(path.join(nested,'index.js'));
		expect(fs.readFileSync(path.join(nested,'index.js'),'utf8')).toContain("'TestComponent/TestComponent.js'");
		expect(fs.readFileSync(path.join(root,'application','index.js'),'utf8')).toBe('[]');
	});

	it('walks upward and registers relative to the nearest ancestor index.js',function () {
		var root=project();
		var owner=path.join(root,'application','foo');
		fs.mkdirSync(path.join(owner,'bar','nested'),{recursive:true});
		fs.writeFileSync(path.join(owner,'index.js'),'[]');

		Generator.Generate(root,'service','foo/bar/nested/Session',{});

		expect(fs.existsSync(path.join(owner,'bar','nested','Session.js'))).toBe(true);
		expect(fs.readFileSync(path.join(owner,'index.js'),'utf8')).toContain("'bar/nested/Session.js'");
	});

	it('supports all entity types without type directories',function () {
		var root=project();

		Generator.Generate(root,'service','Session',{});
		Generator.Generate(root,'guard','Authorized',{});
		Generator.Generate(root,'directive','Tooltip',{});

		var index=fs.readFileSync(path.join(root,'application','index.js'),'utf8');
		expect(index).toContain("'Session.js'");
		expect(index).toContain("'Authorized.js'");
		expect(index).toContain("'Tooltip.js'");
	});

	it('refuses destinations outside the application root',function () {
		var root=project();

		expect(function () {
			Generator.Generate(root,'service','../Outside',{});
		}).toThrow(/outside application root/);
	});

	it('chooses the closest owner when several index.js files exist',function () {
		var root=project();
		var foo=path.join(root,'application','foo');
		var nested=path.join(foo,'bar','nested');
		fs.mkdirSync(nested,{recursive:true});
		fs.writeFileSync(path.join(foo,'index.js'),'[]');
		fs.writeFileSync(path.join(nested,'index.js'),'[]');
		var result=Generator.Generate(root,'guard','foo/bar/nested/Authorized',{});
		expect(result.Index).toBe(path.join(nested,'index.js'));
		expect(fs.readFileSync(path.join(foo,'index.js'),'utf8')).toBe('[]');
	});

	it('normalizes dot paths and Windows separators',function () {
		var root=project();
		Generator.Generate(root,'service','./foo/bar/Session',{});
		Generator.Generate(root,'guard','foo\\bar\\Authorized',{});
		expect(fs.existsSync(path.join(root,'application','foo','bar','Session.js'))).toBe(true);
		expect(fs.existsSync(path.join(root,'application','foo','bar','Authorized.js'))).toBe(true);
	});

	it('does not duplicate an existing graph entry',function () {
		var root=project();
		var index=path.join(root,'application','index.js');
		fs.writeFileSync(index,"[\n\t'Tooltip.js'\n]");
		fs.writeFileSync(path.join(root,'application','Tooltip.js'),'old');
		Generator.Generate(root,'directive','Tooltip',{force:true});
		expect(fs.readFileSync(index,'utf8').match(/Tooltip\.js/g).length).toBe(1);
	});

	it('respects a custom application root',function () {
		var root=project();
		fs.mkdirSync(path.join(root,'source'),{recursive:true});
		fs.writeFileSync(path.join(root,'source','index.js'),'[]');
		Generator.Generate(root,'service','domain/Session',{application:'source'});
		expect(fs.existsSync(path.join(root,'source','domain','Session.js'))).toBe(true);
	});

	it('works through the real CLI and configured application root',function () {
		var root=project();
		var cli=path.resolve(process.cwd(),'elemenx-cli.js');
		fs.mkdirSync(path.join(root,'source'),{recursive:true});
		fs.writeFileSync(path.join(root,'source','index.js'),'[]');
		fs.writeFileSync(path.join(root,'elemenx.config.js'),"module.exports={Application:'source'};");
		var result=childProcess.spawnSync(process.execPath,[cli,'g','component','feature/TestCard',root],{encoding:'utf8'});
		expect(result.status).toBe(0);
		expect(fs.existsSync(path.join(root,'source','feature','TestCard','TestCard.js'))).toBe(true);
	});

	it('refuses overwrite unless force is used',function () {
		var root=project();

		Generator.Generate(root,'service','Session',{});
		expect(function () {
			Generator.Generate(root,'service','Session',{});
		}).toThrow(/already exists/);

		Generator.Generate(root,'service','Session',{force:true});
	});
});