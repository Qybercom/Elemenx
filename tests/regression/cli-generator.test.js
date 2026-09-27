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

describe('Elemenx CLI generator',function () {
	it('generates a Component and registers it in the application graph',function () {
		var root=project();

		Generator.Generate(root,'component','UserCard',{});

		expect(fs.existsSync(path.join(root,'application','components','UserCard','UserCard.js'))).toBe(true);
		expect(fs.existsSync(path.join(root,'application','components','UserCard','UserCard.html'))).toBe(true);
		expect(fs.readFileSync(path.join(root,'application','components','index.js'),'utf8')).toContain("'UserCard/UserCard.js'");
		expect(fs.readFileSync(path.join(root,'application','index.js'),'utf8')).toContain("'components'");
	});

	it('generates Service, Guard and Directive graph entries',function () {
		var root=project();

		Generator.Generate(root,'service','Session',{});
		Generator.Generate(root,'guard','Authorized',{});
		Generator.Generate(root,'directive','Tooltip',{});

		expect(fs.readFileSync(path.join(root,'application','services','index.js'),'utf8')).toContain("'Session.js'");
		expect(fs.readFileSync(path.join(root,'application','guards','index.js'),'utf8')).toContain("'Authorized.js'");
		expect(fs.readFileSync(path.join(root,'application','directives','index.js'),'utf8')).toContain("'Tooltip.js'");
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