var fs = require('fs');
var os = require('os');
var path = require('path');
var Generator = require('../../tools/generator.js');
var Builder = require('../../tools/builder.js');
var Server = require('../../tools/server.js');

var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-production-e2e-'));
var port = Number(process.env.PORT || 4275);

Generator.GenerateApplication(root, 'FooApp', {});
Generator.GenerateApplication(root, 'BarApp', {});

fs.rmSync(path.join(root, 'FooApp', 'App'), {recursive: true, force: true});
fs.rmSync(path.join(root, 'BarApp', 'App'), {recursive: true, force: true});

fs.mkdirSync(path.join(root, 'FooApp', 'FooRoot'), {recursive: true});
fs.mkdirSync(path.join(root, 'BarApp', 'BarRoot'), {recursive: true});

fs.writeFileSync(path.join(root, 'FooApp', 'index.js'), "['FooRoot/FooRoot.js']");
fs.writeFileSync(path.join(root, 'FooApp', 'FooRoot', 'FooRoot.js'), "Elemenx.Component('FooRoot', {$TemplateURL: 'FooRoot.html'});");
fs.writeFileSync(path.join(root, 'FooApp', 'FooRoot', 'FooRoot.html'), '<main id="foo-root">Foo production<div id="bar"></div></main>');

fs.writeFileSync(path.join(root, 'BarApp', 'index.js'), "['BarRoot/BarRoot.js']");
fs.writeFileSync(path.join(root, 'BarApp', 'BarRoot', 'BarRoot.js'), "Elemenx.Component('BarRoot', {$TemplateURL: 'BarRoot.html'});");
fs.writeFileSync(path.join(root, 'BarApp', 'BarRoot', 'BarRoot.html'), '<section id="bar-root">Bar production</section>');

fs.writeFileSync(path.join(root, 'app.js'), "Elemenx.Application('FooApp', {$Component: 'FooRoot', $Root: 'FooApp', $Mount: 'body'});\nElemenx.Application('BarApp', {$Component: 'BarRoot', $Root: 'BarApp', $Mount: '#bar'});");
fs.writeFileSync(path.join(root, 'index.html'), '<!DOCTYPE html><html><head><script src="/elemenx.js"></script><script src="/app.js"></script></head><body></body></html>');

Builder.Build(root, {
	applications: ['FooApp', 'BarApp'],
	entry: 'app.js',
	index: 'index.html',
	out: 'dist'
});

fs.rmSync(path.join(root, 'FooApp'), {recursive: true, force: true});
fs.rmSync(path.join(root, 'BarApp'), {recursive: true, force: true});

if (fs.existsSync(path.join(root, 'dist', 'elemenx.config.js')))
	throw new Error('elemenx.config.js leaked into dist');

var server = Server.Create({
	Root: path.join(root, 'dist'),
	Compression: true,
	SPA: false
});

function cleanup () {
	server.Close(function () {
		fs.rmSync(root, {recursive: true, force: true});
		process.exit(0);
	});
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

server.Listen(port, '127.0.0.1', function () {
	process.stdout.write('Elemenx production E2E: http://127.0.0.1:' + port + '/\n');
});