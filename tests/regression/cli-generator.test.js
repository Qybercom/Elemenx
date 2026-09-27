import {afterEach,describe,expect,it} from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
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

	it('refuses overwrite unless force is used',function () {
		var root=project();

		Generator.Generate(root,'service','Session',{});
		expect(function () {
			Generator.Generate(root,'service','Session',{});
		}).toThrow(/already exists/);

		Generator.Generate(root,'service','Session',{force:true});
	});
});