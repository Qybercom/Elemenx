import {afterEach,describe,expect,it} from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {createRequire} from 'module';

var require = createRequire(import.meta.url);
var Builder = require('../../tools/builder.js');
var temporary = [];

function project () {
	var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-builder-multi-'));
	temporary.push(root);
	fs.writeFileSync(path.join(root, 'index.html'), '<!DOCTYPE html><html><body><div id="foo"></div><div id="bar"></div><script src="/elemenx.js"></script><script src="/app.js"></script></body></html>');
	return root;
}

function application (root, name, component) {
	var directory = path.join(root, name);
	var componentDirectory = path.join(directory, component);
	fs.mkdirSync(componentDirectory, {recursive:true});
	fs.writeFileSync(path.join(directory, 'index.js'), "[\n\t'" + component + "/" + component + ".js'\n]");
	fs.writeFileSync(path.join(componentDirectory, component + '.js'), "Elemenx.Component('" + component + "', {\n\tTemplateURL: '" + component + ".html'\n});");
	fs.writeFileSync(path.join(componentDirectory, component + '.html'), '<div>' + component + '</div>');
}

afterEach(function () {
	var i = 0;
	while (i < temporary.length) {
		fs.rmSync(temporary[i], {recursive:true, force:true});
		i++;
	}
	temporary = [];
});

describe('Elemenx multi-Application Builder', function () {
	it('discovers multiple named graph roots from the host bootstrap', function () {
		var root = project();
		application(root, 'FooApp', 'FooRoot');
		application(root, 'BarApp', 'BarRoot');
		fs.writeFileSync(path.join(root, 'app.js'), "Elemenx.Application('FooApp', {Component:'FooRoot', Root:'FooApp', Mount:'#foo'});\nElemenx.Application('BarApp', {Component:'BarRoot', Root:'BarApp', Mount:'#bar'});");

		Builder.Build(root, {application:'FooApp', entry:'app.js', index:'index.html', out:'dist'});

		var bundle = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
		expect(bundle).toContain('"FooRoot"');
		expect(bundle).toContain('"BarRoot"');
		expect(bundle).toContain('Template: "<div>FooRoot</div>"');
		expect(bundle).toContain('Template: "<div>BarRoot</div>"');
		expect(fs.existsSync(path.join(root, 'dist', 'FooApp'))).toBe(false);
		expect(fs.existsSync(path.join(root, 'dist', 'BarApp'))).toBe(false);
	});

	it('accepts Applications from configuration/build options', function () {
		var root = project();
		application(root, 'FooApp', 'FooRoot');
		application(root, 'BarApp', 'BarRoot');
		fs.writeFileSync(path.join(root, 'app.js'), "Elemenx.Application('Host', {Component:'FooRoot', Mount:'body'});");

		Builder.Build(root, {applications:['FooApp', 'BarApp'], entry:'app.js', index:'index.html', out:'dist'});

		var bundle = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
		expect(bundle).toContain('"FooRoot"');
		expect(bundle).toContain('"BarRoot"');
	});

	it('keeps explicit --application semantics as a single graph build', function () {
		var root = project();
		application(root, 'FooApp', 'FooRoot');
		application(root, 'BarApp', 'BarRoot');
		fs.writeFileSync(path.join(root, 'app.js'), "Elemenx.Application('FooApp', {Component:'FooRoot', Root:'FooApp', Mount:'body'});\nElemenx.Application('BarApp', {Component:'BarRoot', Root:'BarApp', Mount:'#bar'});");

		Builder.Build(root, {application:'FooApp', applicationExplicit:true, entry:'app.js', index:'index.html', out:'dist'});

		var bundle = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
		expect(bundle).toContain('"FooRoot"');
		expect(bundle).not.toContain('"BarRoot"');
	});

	it('classifies graph-aware entities by their Elemenx registration', function () {
		var root = project();
		var app = path.join(root, 'FooApp');
		fs.mkdirSync(path.join(app, 'domain'), {recursive:true});
		fs.writeFileSync(path.join(app, 'index.js'), "[\n\t'domain/Session.js',\n\t'domain/Authorized.js'\n]");
		fs.writeFileSync(path.join(app, 'domain', 'Session.js'), "Elemenx.Service('Session', {});");
		fs.writeFileSync(path.join(app, 'domain', 'Authorized.js'), "Elemenx.Guard('Authorized', function () { return true; });");
		fs.writeFileSync(path.join(root, 'app.js'), "Elemenx.Application('FooApp', {Root:'FooApp', Mount:'body'});");

		Builder.Build(root, {application:'FooApp', entry:'app.js', index:'index.html', out:'dist'});

		var bundle = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
		expect(bundle).toContain('"Service"');
		expect(bundle).toContain('"Session"');
		expect(bundle).toContain('"Guard"');
		expect(bundle).toContain('"Authorized"');
		expect(bundle).not.toContain('"Entity"');
	});

	it('reports collisions between Application graphs instead of silently overwriting', function () {
		var root = project();
		application(root, 'FooApp', 'Shared');
		application(root, 'BarApp', 'Shared');
		fs.writeFileSync(path.join(root, 'app.js'), "Elemenx.Application('FooApp', {Root:'FooApp'});\nElemenx.Application('BarApp', {Root:'BarApp'});");

		expect(function () {
			Builder.Build(root, {applications:['FooApp', 'BarApp'], entry:'app.js', index:'index.html', out:'dist'});
		}).toThrow(/duplicate entity Component:Shared/);
	});
});