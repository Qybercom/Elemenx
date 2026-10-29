'use strict';

/*
 * A project for the Designer (elemenx design [project]): what it is, read from its files and never written to them.
 * Describe(project) returns {Name, Entry, Applications, Components, Services, Directives, Guards, Libraries}:
 * - an Application is {Name, Title, Root, Component, Use (its Libraries), Routes: [{Path, Component, Guards, Redirect}],
 *   Guards (the names its routes ask for)}, read from the entry (app.js) as the framework would run it;
 * - a Component is {Name, Root, File, Template, Style (the paths of its files from the project), Description, Props
 *   ([{Name, Type, Default, Description, Options}]: its $Meta, else the values of its definition), Events, Slots,
 *   Methods}; a Service and a Directive {Name, Root, File, Description, Methods}; a Guard {Name, Root, File, Code (the
 *   body of its function, as the Designer keeps the code of a guard)};
 * Request(project, entry, page) answers the server of the Designer: /__project/describe.json, the same as a script
 * (/__project/describe.js: window.ElemenxDesign), every file of the project under /__project/files/ (GET only, nothing
 * outside the project), so the Designer runs its Components from their sources, and with page (the index.html of the
 * Designer) the page itself, that script in it before the application: the Designer starts on the project.
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var common = require('./common.js');
var Meta = require('./meta.js');

var Types = {'.js': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'};

/* Whatever the entry asks of the framework at its top (a handle, a call on it) answers this: nothing. */
var nothing = new Proxy(function () {}, {
	get: function (target, key) {
		return key === Symbol.toPrimitive ? function () {
			return '';
		} : nothing;
	},
	apply: function () {
		return nothing;
	}
});

/* The Applications the entry declares: Elemenx.Application(name, definition), run in a box with nothing else of the framework. */
function applications (file) {
	var found = [];
	var framework = new Proxy({}, {
		get: function (target, key) {
			if (key === 'Application') {
				return function (name, definition) {
					if (definition && typeof definition === 'object')
						found.push({Name: name, Definition: definition});

					return nothing;
				};
			}

			return nothing;
		}
	});

	if (!fs.existsSync(file)) return found;

	try {
		vm.runInNewContext(fs.readFileSync(file, 'utf8'), {Elemenx: framework, window: nothing, document: nothing, navigator: nothing, location: nothing, console: console}, {filename: file, timeout: 10000});
	}
	catch (error) {
		common.fail('Elemenx design: ' + file + ': ' + error.message);
	}

	return found;
}

/* The routes of a $Router, flat: [{Path, Component, Guards, Redirect}], the children of a route under its path. */
function routes (router, prefix) {
	var list = [];

	((router && router.Routes) || []).forEach(function (route) {
		var full = (prefix || '') + (route.Path || '');
		var guards = [].concat(route.Guards || [], route.Guard ? [route.Guard] : []);

		list.push({Path: full, Component: route.Component || '', Guards: guards, Redirect: route.Redirect || ''});

		if (route.Children)
			list = list.concat(routes({Routes: route.Children}, full.replace(/\/$/, '')));
	});

	return list;
}

/* The files of a graph (index.js and the ones it names), the .js among them. */
function scripts (directory, visited) {
	var list = [];
	var index = path.join(directory, 'index.js');

	visited = visited || {};

	if (visited[directory] || !fs.existsSync(index)) return list;

	visited[directory] = true;

	common.parseIndex(index).forEach(function (entry) {
		var target = path.resolve(directory, entry);

		if (/\.js$/i.test(entry) && fs.existsSync(target)) list.push(target);
		else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) list = list.concat(scripts(target, visited));
	});

	return list;
}

/* The props of a Component without $Meta: the values of its definition (not its methods, not the names of the framework). */
function props (definition) {
	return Object.keys(definition).filter(function (key) {
		return key.charAt(0) !== '$' && typeof definition[key] !== 'function';
	}).map(function (key) {
		var value = definition[key];

		return {Name: key, Type: typeof value === 'boolean' ? 'bool' : typeof value === 'number' ? 'number' : typeof value === 'string' ? 'text' : 'json', Default: value === undefined ? null : JSON.parse(JSON.stringify(value)), Description: ''};
	});
}

/* A file beside a script, named by a key of its definition ($TemplateURL: 'Card.html'), as a path of the project. */
function beside (project, file, name) {
	return name ? path.relative(project, path.resolve(path.dirname(file), name)).replace(/\\/g, '/') : '';
}

function Describe (project, entry) {
	var root = path.resolve(project);
	var file = path.join(root, entry || 'app.js');
	var result = {Name: path.basename(root), Entry: path.basename(file), Applications: [], Components: [], Services: [], Directives: [], Guards: [], Libraries: []};
	var roots = {};

	applications(file).forEach(function (application) {
		var definition = application.Definition;
		var list = routes(definition.$Router);

		result.Applications.push({
			Name: application.Name,
			Title: typeof definition.$Title === 'string' ? definition.$Title : '',
			Root: definition.$Root || '',
			Component: definition.$Component || '',
			Use: [].concat(definition.$Use || []).filter(function (name) {
				return typeof name === 'string';
			}),
			Routes: list,
			Guards: list.reduce(function (all, route) {
				return all.concat(route.Guards.filter(function (name) {
					return all.indexOf(name) === -1;
				}));
			}, [])
		});

		if (definition.$Root)
			roots[definition.$Root] = true;

		[].concat(definition.$Use || []).forEach(function (name) {
			if (typeof name === 'string' && result.Libraries.indexOf(name) === -1)
				result.Libraries.push(name);
		});
	});

	if (!Object.keys(roots).length && fs.existsSync(path.join(root, 'application', 'index.js')))
		roots.application = true;

	Object.keys(roots).forEach(function (name) {
		scripts(path.join(root, name)).forEach(function (script) {
			Meta.Definitions(script).forEach(function (found) {
				var definition = found.Definition;
				var meta = found.Kind === 'Guard' ? {} : Meta.Normalize(found.Name, found.Kind, definition) || {};
				var code;

				if (found.Kind === 'Guard') {
					code = String(definition);

					result.Guards.push({Name: found.Name, Root: name, File: path.relative(root, script).replace(/\\/g, '/'), Code: code.substring(code.indexOf('{') + 1, code.lastIndexOf('}')).replace(/^\n+|\s+$/g, '')});

					return;
				}

				var item = {Name: found.Name, Root: name, File: path.relative(root, script).replace(/\\/g, '/'), Description: meta.Description || '', Methods: meta.Methods || Object.keys(definition).filter(function (key) {
					return key.charAt(0) !== '$' && typeof definition[key] === 'function';
				})};

				if (found.Kind === 'Component') {
					item.Template = beside(root, script, definition.$TemplateURL);
					item.Style = beside(root, script, definition.$StyleURL);
					item.Inline = typeof definition.$Template === 'string' ? definition.$Template : '';
					item.Props = meta.Props && meta.Props.length ? meta.Props : props(definition);
					item.Events = meta.Events || [];
					item.Slots = meta.Slots || [];
				}

				result[found.Kind + 's'].push(item);
			});
		});
	});

	return result;
}

/* The answers of the server of the Designer for a project: its description, and its files as they are. */
function Request (project, entry, page) {
	var root = path.resolve(project);
	var prefix = root.charAt(root.length - 1) === path.sep ? root : root + path.sep;

	return function (request, response, pathname) {
		var file;
		var body;

		if (page && (pathname === '/' || pathname === '/index.html') && (request.method === 'GET' || request.method === 'HEAD') && fs.existsSync(page)) {
			body = fs.readFileSync(page, 'utf8').replace(/(<script\b[^>]*\bsrc="[^"]*app\.js")/, '<script src="/__project/describe.js"></script>\n\t$1');

			response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache'});
			response.end(request.method === 'HEAD' ? '' : body);

			return true;
		}

		if (pathname.indexOf('/__project/') !== 0) return false;

		if (request.method !== 'GET' && request.method !== 'HEAD') {
			response.writeHead(405, {'Content-Type': 'text/plain; charset=utf-8', 'Allow': 'GET, HEAD'});
			response.end('The project is read only');

			return true;
		}

		if (pathname === '/__project/describe.json' || pathname === '/__project/describe.js') {
			try {
				body = JSON.stringify(Describe(root, entry));
			}
			catch (error) {
				response.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
				response.end(String(error.message || error));

				return true;
			}

			if (pathname === '/__project/describe.js')
				body = 'window.ElemenxDesign = ' + body + ';\n';

			response.writeHead(200, {'Content-Type': pathname === '/__project/describe.js' ? 'text/javascript; charset=utf-8' : 'application/json; charset=utf-8', 'Cache-Control': 'no-cache'});
			response.end(request.method === 'HEAD' ? '' : body);

			return true;
		}

		file = path.resolve(root, pathname.substring('/__project/files/'.length));

		if (pathname.indexOf('/__project/files/') !== 0 || file.indexOf(prefix) !== 0 || /(^|[\\/])(node_modules|\.git)([\\/]|$)/.test(path.relative(root, file)) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
			response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
			response.end('Not Found');

			return true;
		}

		response.writeHead(200, {'Content-Type': Types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache'});

		if (request.method === 'HEAD') response.end();
		else fs.createReadStream(file).pipe(response);

		return true;
	};
}

module.exports = {
	Describe: Describe,
	Request: Request
};
