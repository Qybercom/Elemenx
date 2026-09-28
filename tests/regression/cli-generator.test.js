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
	it('generates a named Application directly into the current directory',function () {
		var root=fs.mkdtempSync(path.join(os.tmpdir(),'elemenx-application-'));
		temporary.push(root);
		var cli=path.resolve(process.cwd(),'elemenx-cli.js');
		var result=childProcess.spawnSync(process.execPath,[cli,'g','application','FooApp'],{cwd:root,encoding:'utf8'});
		expect(result.status).toBe(0);
		expect(fs.existsSync(path.join(root,'FooApp','index.js'))).toBe(true);
		expect(fs.existsSync(path.join(root,'FooApp','App','App.js'))).toBe(true);
		expect(fs.existsSync(path.join(root,'FooApp','App','App.html'))).toBe(true);
		expect(fs.existsSync(path.join(root,'FooApp','FooApp'))).toBe(false);
	});

	it('uses the optional Application path without adding another name directory level',function () {
		var root=fs.mkdtempSync(path.join(os.tmpdir(),'elemenx-application-path-'));
		var destination=path.join(root,'host');
		temporary.push(root);
		var cli=path.resolve(process.cwd(),'elemenx-cli.js');
		var result=childProcess.spawnSync(process.execPath,[cli,'g','application','FooApp',destination],{encoding:'utf8'});
		expect(result.status).toBe(0);
		expect(fs.existsSync(path.join(destination,'FooApp','index.js'))).toBe(true);
		expect(fs.existsSync(path.join(destination,'FooApp','FooApp','index.js'))).toBe(false);
	});

	it('creates another named Application without touching existing host files',function () {
		var root=fs.mkdtempSync(path.join(os.tmpdir(),'elemenx-multi-application-'));
		temporary.push(root);
		Generator.GenerateApplication(root,'FooApp',{});
		var app=fs.readFileSync(path.join(root,'app.js'),'utf8');
		var html=fs.readFileSync(path.join(root,'index.html'),'utf8');
		var config=fs.readFileSync(path.join(root,'elemenx.config.js'),'utf8');
		Generator.GenerateApplication(root,'BarApp',{});
		expect(fs.existsSync(path.join(root,'FooApp','index.js'))).toBe(true);
		expect(fs.existsSync(path.join(root,'BarApp','index.js'))).toBe(true);
		expect(fs.readFileSync(path.join(root,'app.js'),'utf8')).toBe(app);
		expect(fs.readFileSync(path.join(root,'index.html'),'utf8')).toBe(html);
		expect(fs.readFileSync(path.join(root,'elemenx.config.js'),'utf8')).toBe(config);
	});

	it('resolves an entity to a named Application graph from its path',function () {
		var root=fs.mkdtempSync(path.join(os.tmpdir(),'elemenx-named-graph-'));
		temporary.push(root);
		Generator.GenerateApplication(root,'FooApp',{});
		Generator.GenerateApplication(root,'BarApp',{});
		Generator.Generate(root,'component','BarApp/Pages/Home',{});
		expect(fs.existsSync(path.join(root,'BarApp','Pages','Home','Home.js'))).toBe(true);
		expect(fs.readFileSync(path.join(root,'BarApp','index.js'),'utf8')).toContain("'Pages/Home/Home.js'");
		expect(fs.readFileSync(path.join(root,'FooApp','index.js'),'utf8')).not.toContain('Home');
	});

	it('refuses overwriting an existing named Application unless force is used',function () {
		var root=fs.mkdtempSync(path.join(os.tmpdir(),'elemenx-application-force-'));
		temporary.push(root);
		Generator.GenerateApplication(root,'FooApp',{});
		expect(function () {
			Generator.GenerateApplication(root,'FooApp',{});
		}).toThrow(/already exists/);
		Generator.GenerateApplication(root,'FooApp',{force:true});
	});

	it('does not duplicate a configured Application root when target includes it',function () {
		var root=fs.mkdtempSync(path.join(os.tmpdir(),'elemenx-configured-root-target-'));
		temporary.push(root);
		fs.mkdirSync(path.join(root,'source'),{recursive:true});
		fs.writeFileSync(path.join(root,'source','index.js'),'[]');
		Generator.Generate(root,'component','source/Feature/TestCard',{application:'source'});
		expect(fs.existsSync(path.join(root,'source','Feature','TestCard','TestCard.js'))).toBe(true);
		expect(fs.existsSync(path.join(root,'source','source','Feature','TestCard','TestCard.js'))).toBe(false);
	});

	it('prints a real newline and never includes it in the generated Application directory name',function () {
		var root=fs.mkdtempSync(path.join(os.tmpdir(),'elemenx-application-newline-'));
		temporary.push(root);
		var result=Generator.GenerateApplication(root,'MyApp',{});
		expect(path.basename(result.Application)).toBe('MyApp');
		expect(fs.existsSync(path.join(root,'MyApp'))).toBe(true);
		expect(fs.existsSync(path.join(root,'MyApp\\n'))).toBe(false);
	});

	it('keeps --port ahead of the configured development port',function () {
		var cli=fs.readFileSync(path.resolve(process.cwd(),'elemenx-cli.js'),'utf8');
		expect(cli).toContain("value(parsed.Options, 'port', server.DevelopmentPort, 4173)");
	});


	it('keeps boolean --force from consuming a following project path',function () {
		var root=project();
		var cli=path.resolve(process.cwd(),'elemenx-cli.js');
		var result=childProcess.spawnSync(process.execPath,[cli,'g','service','Session','--force',root],{encoding:'utf8'});
		expect(result.status).toBe(0);
		expect(fs.existsSync(path.join(root,'application','Session.js'))).toBe(true);
	});

	it('keeps server CLI options ahead of configured values',function () {
		var cli=fs.readFileSync(path.resolve(process.cwd(),'elemenx-cli.js'),'utf8');
		expect(cli).toContain("value(options, 'host', serverSettings.Host, '127.0.0.1')");
		expect(cli).toContain("value(options, 'compression-threshold', serverSettings.CompressionThreshold, 1024)");
		expect(cli).toContain("value(options, 'cache-control', serverSettings.CacheControl");
	});

});