'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

var Types = {
	'.html':'text/html; charset=utf-8',
	'.js':'text/javascript; charset=utf-8',
	'.css':'text/css; charset=utf-8',
	'.json':'application/json; charset=utf-8',
	'.svg':'image/svg+xml',
	'.txt':'text/plain; charset=utf-8',
	'.xml':'application/xml; charset=utf-8',
	'.png':'image/png',
	'.jpg':'image/jpeg',
	'.jpeg':'image/jpeg',
	'.webp':'image/webp',
	'.gif':'image/gif',
	'.ico':'image/x-icon',
	'.woff':'font/woff',
	'.woff2':'font/woff2'
};

var Compressible = {
	'.html':true,
	'.js':true,
	'.css':true,
	'.json':true,
	'.svg':true,
	'.txt':true,
	'.xml':true
};

function etag (stat) {
	return '"' + stat.size.toString(16) + '-' + Math.floor(stat.mtimeMs).toString(16) + '"';
}

function notModified (request, stat, tag) {
	var match=request.headers['if-none-match'];
	var modified=request.headers['if-modified-since'];
	if (match && match === tag) return true;
	if (!match && modified) {
		var time=Date.parse(modified);
		if (!isNaN(time) && Math.floor(stat.mtimeMs / 1000) <= Math.floor(time / 1000))
			return true;
	}
	return false;
}

function acceptsGzip (request) {
	return /(?:^|,|\s)gzip(?:\s*;|\s*,|$)/i.test(request.headers['accept-encoding'] || '');
}

function create (options) {
	options=options || {};
	var root=path.resolve(options.Root || process.cwd());
	var framework=path.resolve(options.Framework || path.join(__dirname,'..','elemenx.js'));
	var compression=options.Compression !== false;
	var threshold=options.CompressionThreshold === undefined ? 1024 : Number(options.CompressionThreshold);

	function send (request,response,file) {
		fs.stat(file,function (error,stat) {
			if (error || !stat.isFile()) {
				response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
				response.end('Not Found');
				return;
			}

			var ext=path.extname(file).toLowerCase();
			var tag=etag(stat);
			var headers={
				'Content-Type':Types[ext] || 'application/octet-stream',
				'ETag':tag,
				'Last-Modified':stat.mtime.toUTCString()
			};

			if (options.CacheControl) headers['Cache-Control']=String(options.CacheControl);
			var useGzip=compression && Compressible[ext] && stat.size >= threshold && acceptsGzip(request);

			if (Compressible[ext]) headers.Vary='Accept-Encoding';

			if (notModified(request,stat,tag)) {
				response.writeHead(304,headers);
				response.end();
				return;
			}

			if (request.method === 'HEAD') {
				headers['Content-Length']=stat.size;
				response.writeHead(200,headers);
				response.end();
			}
			else if (useGzip) {
				headers['Content-Encoding']='gzip';
				response.writeHead(200,headers);
				fs.createReadStream(file).pipe(zlib.createGzip()).pipe(response);
			}
			else {
				headers['Content-Length']=stat.size;
				response.writeHead(200,headers);
				fs.createReadStream(file).pipe(response);
			}
		});
	}

	var server=http.createServer(function (request,response) {
		var pathname;
		try {
			pathname=decodeURIComponent(request.url.split('?')[0]);
		}
		catch (error) {
			response.writeHead(400);
			response.end('Bad Request');
			return;
		}

		if (pathname === '/elemenx.js' && options.FrameworkFallback !== false && !fs.existsSync(path.join(root,'elemenx.js'))) {
			send(request,response,framework);
			return;
		}

		var relative=pathname === '/' ? 'index.html' : pathname.replace(/^\/+/,'');
		var file=path.resolve(root,relative);
		var prefix=root.charAt(root.length - 1) === path.sep ? root : root + path.sep;

		if (file !== root && file.indexOf(prefix) !== 0) {
			response.writeHead(403);
			response.end('Forbidden');
			return;
		}

		fs.stat(file,function (error,stat) {
			if (!error && stat.isFile()) {
				send(request,response,file);
				return;
			}

			if (options.SPA === false) {
				response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
				response.end('Not Found');
				return;
			}

			send(request,response,path.join(root,'index.html'));
		});
	});

	return {
		Server:server,
		Listen:function (port,host,callback) {
			server.listen(Number(port === undefined || port === null ? 4173 : port),host || '127.0.0.1',callback);
			return this;
		},
		Close:function (callback) {
			server.close(callback);
		}
	};
}

module.exports={
	Create:create
};

if (require.main === module) {
	var root=path.resolve(process.argv[2] || process.cwd());
	var port=Number(process.argv[3] || process.env.PORT || 4173);
	create({Root:root}).Listen(port,'127.0.0.1',function () {
		console.log('Elemenx server: http://127.0.0.1:' + port + '/');
	});
}