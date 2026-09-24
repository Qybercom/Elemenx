var http = require('http');
var fs = require('fs');
var path = require('path');

var Root = path.resolve(process.argv[2] || process.cwd());
var Framework = path.resolve(__dirname, '..', 'elemenx.js');
var Port = Number(process.env.PORT || 4173);
var Types = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml'
};

function Send (response, file) {
	fs.readFile(file, function (error, data) {
		if (error) {
			response.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
			response.end(error.message);
			return;
		}

		response.writeHead(200, {'Content-Type': Types[path.extname(file)] || 'application/octet-stream'});
		response.end(data);
	});
}

http.createServer(function (request, response) {
	var pathname = decodeURIComponent(request.url.split('?')[0]);

	if (pathname === '/elemenx.js') {
		Send(response, Framework);
		return;
	}

	var relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
	var file = path.resolve(Root, relative);

	if (file.indexOf(Root) !== 0) {
		response.writeHead(403);
		response.end('Forbidden');
		return;
	}

	fs.stat(file, function (error, stat) {
		if (!error && stat.isFile()) {
			Send(response, file);
			return;
		}

		Send(response, path.join(Root, 'index.html'));
	});
}).listen(Port, '127.0.0.1', function () {
	console.log('Elemenx example: http://127.0.0.1:' + Port + '/');
});