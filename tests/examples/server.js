var path = require('path');
var Builder = require('../../tools/builder.js');
var Server = require('../../tools/server.js');

var project = path.resolve(__dirname, '../../examples/Advanced');
var port = Number(process.env.PORT || 4276);
var settings = require('../../examples/Advanced/elemenx.config.js');

Builder.Build(project, {
	application: 'application',
	entry: 'app.js',
	index: 'index.html',
	out: 'dist'
});

var server = Server.Create({
	Root: path.join(project, 'dist'),
	Compression: true,
	CacheControl: 'public, max-age=0, must-revalidate',
	Request: settings.Server.Request,
	WebSocket: settings.Server.WebSocket
});

function cleanup () {
	server.Close(function () {
		process.exit(0);
	});
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

server.Listen(port, '127.0.0.1', function () {
	process.stdout.write('Elemenx Advanced production E2E: http://127.0.0.1:' + port + '/\n');
});