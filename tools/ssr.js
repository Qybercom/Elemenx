'use strict';

/*
 * A page of a project of Elemenx rendered in Node, as a server sends it (SSR): the page runs in a document of its own
 * (tools/dom.js) with its scripts and the files they ask for read from the project, as the development server gives
 * them (/elemenx.js the framework, /libraries/ the libraries beside it), its Applications render the page of the URL,
 * their $OnSSR load their data, and Elemenx.Render gives the HTML with the markup of each mount and the state of its
 * Components.
 * - Render(options, callback (error, html, state)): options Root (the folder of the project), URL (the path of the page,
 *   '/' by default, with its query), Page (its file in Root, index.html), HTML (the text of the page in place of its file),
 *   Base (the address the site is served from: '/ui/' reads /ui/app.js as app.js of Root), Framework (elemenx.js; the one
 *   of this package by default), Language, Timeout (milliseconds, 15000), Files(url) (the text of a file of an address it
 *   answers itself, or null). The page runs in a context of its own each time: nothing of one render is left for the next.
 */

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var Dom = require('./dom');
var Templates = require('./templates');

/* The file of an address of the page, as the development server finds it; null when there is none. */
function fileOf (root, framework, pathname) {
	var libraries = path.resolve(path.dirname(framework), 'libraries');
	var relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
	var file;

	if (pathname === '/elemenx.js' && !fs.existsSync(path.join(root, 'elemenx.js'))) return framework;

	if (pathname.indexOf('/libraries/') === 0) {
		file = path.resolve(libraries, pathname.substring('/libraries/'.length));

		if (file.indexOf(libraries + path.sep) === 0 && fs.existsSync(file)) return file;
	}

	file = path.resolve(root, relative);

	if (file.indexOf(root + path.sep) !== 0 && file !== root) return null;

	return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

function Render (options, callback) {
	var settings = options || {};
	var root = path.resolve(settings.Root || process.cwd());
	var framework = path.resolve(settings.Framework || path.join(__dirname, '..', 'elemenx.js'));
	var address = new URL(settings.URL || '/', 'http://localhost');
	var page = path.join(root, settings.Page || 'index.html');
	var base = String(settings.Base || '/').replace(/\/?$/, '/');
	var errors = [];
	var finished = false;
	var timer;
	var window;
	var context;

	function finish (error, html, state) {
		if (finished) return;

		finished = true;

		clearTimeout(timer);

		callback(error || null, html, state);
	}

	function fetch (url, done) {
		var target = new URL(url, address.href);
		var own = typeof settings.Files === 'function' ? settings.Files(target.pathname + target.search) : null;
		var file;

		if (own !== null && own !== undefined) {
			done(null, own);

			return;
		}

		if (target.origin !== address.origin) {
			done(new Error('Elemenx SSR reads the files of its own page: ' + url));

			return;
		}

		file = fileOf(root, framework, '/' + decodeURIComponent(target.pathname).substring(target.pathname.indexOf(base) === 0 ? base.length : 1));

		if (!file) {
			done(new Error('Elemenx SSR: no file for ' + target.pathname));

			return;
		}

		fs.readFile(file, 'utf8', function (error, text) {
			done(error, path.extname(file) === '.html' ? Templates.Page(text) : text);
		});
	}

	function run (text, url) {
		vm.runInContext(text, context, {filename: url});
	}

	if (settings.HTML === undefined && !fs.existsSync(page)) {
		finish(new Error('Elemenx SSR: no page ' + page));

		return;
	}

	window = Dom.Window({
		URL: address.href,
		HTML: Templates.Page(settings.HTML === undefined ? fs.readFileSync(page, 'utf8') : String(settings.HTML)),
		Language: settings.Language,
		Fetch: fetch,
		Run: run,
		/* What the page throws or reports fails the render at once: a page that broke is not sent as if it rendered. */
		Report: function (error) {
			errors.push(error);

			finish(error);
		}
	});

	/* Rendered for a server: the framework awaits the $OnSSR of the page and keeps their fields. */
	window.ElemenxSSR = {URL: address.href};
	context = vm.createContext(window);

	timer = setTimeout(function () {
		finish(new Error('Elemenx SSR: the page took longer than ' + (settings.Timeout || 15000) + ' ms' + (errors.length ? ': ' + errors[0].message : '')));
	}, settings.Timeout || 15000);

	/* The scripts of the page, one after the other, as a browser runs them; then the page as it rendered. */
	(function next (scripts, index) {
		var script = scripts[index];
		var type;

		if (!script) {
			if (!window.Elemenx || typeof window.Elemenx.Render !== 'function') {
				finish(new Error('Elemenx SSR: the page has no Elemenx'));

				return;
			}

			window.Elemenx.Render(function (error, html, state) {
				finish(error, html, state);
			});

			return;
		}

		type = (script.getAttribute('type') || '').toLowerCase();
		script.Ran = true;

		if (type && type !== 'text/javascript' && type !== 'application/javascript') {
			next(scripts, index + 1);

			return;
		}

		function ran (error) {
			if (error) {
				finish(error);

				return;
			}

			next(scripts, index + 1);
		}

		window.document.currentScript = script;

		if (!script.getAttribute('src')) {
			try {
				run(script.textContent, address.href);
			}
			catch (error) {
				ran(error);

				return;
			}
			finally {
				window.document.currentScript = null;
			}

			ran(null);

			return;
		}

		fetch(script.src, function (error, text) {
			if (error) {
				ran(error);

				return;
			}

			window.document.currentScript = script;

			try {
				run(text, script.src);
			}
			catch (failure) {
				ran(failure);

				return;
			}
			finally {
				window.document.currentScript = null;
			}

			ran(null);
		});
	})(window.document.querySelectorAll('script'), 0);
}

module.exports = {
	Render: Render
};
