var fs = require('fs');
var path = require('path');

module.exports = {
	Application: 'application',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4183,
		ProductionPort: 4184,

		/* The bundles the export of an Application puts into its file: bundles/<name>, from dist/ of the repository (npm run dist). */
		Request: function (request, response, pathname) {
			var match = /^\/bundles\/(elemenx\.min\.js|elemenx-ui\.min\.js)$/.exec(pathname);
			var file = match ? path.resolve(__dirname, '..', '..', 'dist', match[1]) : '';

			if (!match)
				return false;

			if (!fs.existsSync(file)) {
				response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
				response.end('No ' + match[1] + ' in dist/: npm run dist makes it.');

				return true;
			}

			response.writeHead(200, {'Content-Type': 'text/javascript; charset=utf-8'});

			fs.createReadStream(file).pipe(response);

			return true;
		}
	}
};
