import {afterEach, describe, expect, it} from 'vitest';
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
	fs.mkdirSync(componentDirectory, {recursive: true});
	fs.writeFileSync(path.join(directory, 'index.js'), "[\n\t'" + component + "/" + component + ".js'\n]");
	fs.writeFileSync(path.join(componentDirectory, component + '.js'), "Elemenx.Component('" + component + "', {\n\tTemplateURL: '" + component + ".html'\n});");
	fs.writeFileSync(path.join(componentDirectory, component + '.html'), '<div>' + component + '</div>');
}

afterEach(function () {
	var i = 0;
	while (i < temporary.length) {
		fs.rmSync(temporary[i], {recursive: true, force: true});
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

		Builder.Build(root, {application: 'FooApp', entry: 'app.js', index: 'index.html', out: 'dist'});

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

		Builder.Build(root, {applications: ['FooApp', 'BarApp'], entry: 'app.js', index: 'index.html', out: 'dist'});

		var bundle = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
		expect(bundle).toContain('"FooRoot"');
		expect(bundle).toContain('"BarRoot"');
	});

	it('keeps explicit --application semantics as a single graph build', function () {
		var root = project();
		application(root, 'FooApp', 'FooRoot');
		application(root, 'BarApp', 'BarRoot');
		fs.writeFileSync(path.join(root, 'app.js'), "Elemenx.Application('FooApp', {Component:'FooRoot', Root:'FooApp', Mount:'body'});\nElemenx.Application('BarApp', {Component:'BarRoot', Root:'BarApp', Mount:'#bar'});");

		Builder.Build(root, {application: 'FooApp', applicationExplicit: true, entry: 'app.js', index: 'index.html', out: 'dist'});

		var bundle = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
		expect(bundle).toContain('"FooRoot"');
		expect(bundle).not.toContain('"BarRoot"');
	});

	it('classifies graph-aware entities by their Elemenx registration', function () {
		var root = project();
		var app = path.join(root, 'FooApp');
		fs.mkdirSync(path.join(app, 'domain'), {recursive: true});
		fs.writeFileSync(path.join(app, 'index.js'), "[\n\t'domain/Session.js',\n\t'domain/Authorized.js'\n]");
		fs.writeFileSync(path.join(app, 'domain', 'Session.js'), "Elemenx.Service('Session', {});");
		fs.writeFileSync(path.join(app, 'domain', 'Authorized.js'), "Elemenx.Guard('Authorized', function () { return true; });");
		fs.writeFileSync(path.join(root, 'app.js'), "Elemenx.Application('FooApp', {Root:'FooApp', Mount:'body'});");

		Builder.Build(root, {application: 'FooApp', entry: 'app.js', index: 'index.html', out: 'dist'});

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
			Builder.Build(root, {applications: ['FooApp', 'BarApp'], entry: 'app.js', index: 'index.html', out: 'dist'});
		}).toThrow(/duplicate entity Component:Shared/);
	});
	it('keeps toolchain files and Application sources out of dist', function () {
		var root = project();

		application(root, 'FooApp', 'FooRoot');
		fs.writeFileSync(path.join(root, 'app.js'), "Elemenx.Application('FooApp', {Component: 'FooRoot', Root: 'FooApp', Mount: 'body'});");
		fs.writeFileSync(path.join(root, 'elemenx.config.js'), "module.exports = {Application: 'FooApp'};");
		fs.writeFileSync(path.join(root, 'package.json'), '{"private":true}');

		Builder.Build(root, {application: 'FooApp', entry: 'app.js', index: 'index.html', out: 'dist'});

		expect(fs.existsSync(path.join(root, 'dist', 'elemenx.config.js'))).toBe(false);
		expect(fs.existsSync(path.join(root, 'dist', 'package.json'))).toBe(false);
		expect(fs.existsSync(path.join(root, 'dist', 'FooApp'))).toBe(false);
		expect(fs.existsSync(path.join(root, 'dist', 'index.html'))).toBe(true);
		expect(fs.existsSync(path.join(root, 'dist', 'app.js'))).toBe(true);
		expect(fs.existsSync(path.join(root, 'dist', 'elemenx.js'))).toBe(true);
	});


	it('supports a custom output directory without recursively copying it into itself', function () {
		var root = project();
		application(root, 'FooApp', 'FooRoot');
		fs.writeFileSync(path.join(root, 'app.js'), "Elemenx.Application('FooApp', {Root:'FooApp'});");
		fs.writeFileSync(path.join(root, 'asset.txt'), 'asset');

		Builder.Build(root, {application: 'FooApp', entry: 'app.js', index: 'index.html', out: 'build'});

		expect(fs.readFileSync(path.join(root, 'build', 'asset.txt'), 'utf8')).toBe('asset');
		expect(fs.existsSync(path.join(root, 'build', 'build'))).toBe(false);
	});

	it('excludes custom entry and index sources while preserving same-named nested public assets', function () {
		var root = project();
		application(root, 'FooApp', 'FooRoot');
		fs.writeFileSync(path.join(root, 'bootstrap.js'), "Elemenx.Application('FooApp', {Root:'FooApp'});");
		fs.writeFileSync(path.join(root, 'shell.html'), '<!DOCTYPE html><html><body>shell</body></html>');
		fs.mkdirSync(path.join(root, 'public'), {recursive: true});
		fs.writeFileSync(path.join(root, 'public', 'index.html'), 'nested index');
		fs.writeFileSync(path.join(root, 'public', 'app.js'), 'nested app');
		fs.writeFileSync(path.join(root, 'public', 'package.json'), 'nested package');

		Builder.Build(root, {application: 'FooApp', entry: 'bootstrap.js', index: 'shell.html', out: 'dist'});

		expect(fs.existsSync(path.join(root, 'dist', 'bootstrap.js'))).toBe(false);
		expect(fs.existsSync(path.join(root, 'dist', 'shell.html'))).toBe(false);
		expect(fs.readFileSync(path.join(root, 'dist', 'public', 'index.html'), 'utf8')).toBe('nested index');
		expect(fs.readFileSync(path.join(root, 'dist', 'public', 'app.js'), 'utf8')).toBe('nested app');
		expect(fs.readFileSync(path.join(root, 'dist', 'public', 'package.json'), 'utf8')).toBe('nested package');
	});

	it('compiles named DOM templates from the host index into the production Template Registry bootstrap', function () {
		var root = project();
		application(root, 'FooApp', 'FooRoot');
		fs.writeFileSync(path.join(root, 'index.html'), '<!DOCTYPE html><html><body><template id="Probe"><strong>{{Value}}</strong></template><div id="foo"></div><script src="/elemenx.js"></script><script src="/app.js"></script></body></html>');
		fs.writeFileSync(path.join(root, 'app.js'), "Elemenx.Application('FooApp', {Component:'FooRoot', Root:'FooApp', Mount:'#foo'});");

		Builder.Build(root, {application: 'FooApp', entry: 'app.js', index: 'index.html', out: 'dist'});

		var output = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
		expect(output).toContain('Elemenx.Template("Probe", "<strong>{{Value}}</strong>");');
		expect(output.indexOf('Elemenx.Template("Probe"')).toBeLessThan(output.indexOf('Elemenx.Bundle({'));
	});
});