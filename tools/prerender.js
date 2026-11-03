'use strict';

/*
 * The pages of a build rendered once, as a server sends them (SSG): each page of the site as an HTML file of its own with
 * its markup and the state of its Components (tools/ssr.js), so a search engine reads it and a browser shows it before
 * the scripts run. It starts at its Routes and follows the links of each page it renders (<a href="/...">, the same site,
 * not a file), up to Limit pages.
 * - Run(options, callback (error, pages)): options Output (the folder of the build), Routes (['/']), Crawl (true: the
 *   links of the pages too), Limit (200), Base (the address the site is served from, '/'), Timeout (of a page, in
 *   milliseconds). A page is written as index.html for / and as <path>.html for another (/items: items.html; the server
 *   of Elemenx sends it for /items, another server needs the same rule: try_files $uri $uri.html of nginx); the
 *   compressed copies of a file it writes go. pages: [{URL, File, Error}], a page that failed with its error and no file.
 */

var fs = require('fs');
var path = require('path');
var SSR = require('./ssr');

/* The links of a page to pages of the same site: their paths, without a query or a hash, not of a file. */
function links (html, base) {
	var found = [];
	var pattern = /<a\b[^>]*\bhref="([^"]*)"/gi;
	var match;

	while ((match = pattern.exec(html))) {
		var href = match[1].replace(/&amp;/g, '&');
		var url;

		if (!/^\//.test(href) || /^\/\//.test(href)) continue;

		url = href.split('#')[0].split('?')[0];

		if (base !== '/' && url.indexOf(base) !== 0) continue;
		if (/\.[a-z0-9]{1,5}$/i.test(url)) continue;

		url = url.length > 1 ? url.replace(/\/+$/, '') : url;

		if (found.indexOf(url) === -1)
			found.push(url);
	}

	return found;
}

/* The file of a page: index.html for the root of the site, <path>.html for another. */
function fileOf (output, base, url) {
	var relative = url.substring(base.length).replace(/^\/+/, '');

	return relative ? path.join(output, relative + '.html') : path.join(output, 'index.html');
}

function Run (options, callback) {
	var settings = options || {};
	var output = path.resolve(settings.Output || 'dist');
	var base = String(settings.Base || '/').replace(/\/?$/, '/');
	var limit = settings.Limit || 200;
	var queue = (settings.Routes && settings.Routes.length ? settings.Routes : [base]).slice();
	var seen = {};
	var pages = [];
	/* The page of the build as it was built: every page is rendered of it, not of one rendered before. */
	var page = path.join(output, 'index.html');
	var html = fs.existsSync(page) ? fs.readFileSync(page, 'utf8') : null;

	if (html === null) {
		callback(new Error('Elemenx prerender: no page ' + page));

		return;
	}

	queue.forEach(function (url) {
		seen[url] = true;
	});

	(function next () {
		var url = queue.shift();

		if (!url || pages.length >= limit) {
			callback(null, pages);

			return;
		}

		SSR.Render({Root: output, URL: url, Base: base, HTML: html, Timeout: settings.Timeout}, function (error, rendered) {
			var file;

			if (error) {
				pages.push({URL: url, File: null, Error: error});

				next();

				return;
			}

			file = fileOf(output, base, url);

			fs.mkdirSync(path.dirname(file), {recursive: true});
			fs.writeFileSync(file, rendered);

			/* The compressed copies of the page made before it was rendered are not of it any more. */
			['.br', '.gz'].forEach(function (suffix) {
				if (fs.existsSync(file + suffix))
					fs.unlinkSync(file + suffix);
			});

			pages.push({URL: url, File: file, Error: null});

			if (settings.Crawl !== false) {
				links(rendered, base).forEach(function (link) {
					if (!seen[link]) {
						seen[link] = true;

						queue.push(link);
					}
				});
			}

			next();
		});
	})();
}

module.exports = {
	Run: Run,
	Links: links
};
