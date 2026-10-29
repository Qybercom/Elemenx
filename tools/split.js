'use strict';

/*
 * A build split by its routes: the Components only one route needs go into a part of their own, a script beside the
 * bundle fetched the first time the route is shown (Elemenx.Bundle.Part); the rest stays in the bundle.
 * - Routes(source) are the routes the entry declares, [{Path, Component}]: the objects of $Router.Routes with a Path and
 *   a Component of a name (a route with children keeps its Component in the bundle).
 * - Plan(components, rest, routes) splits the Components, {Name: source}: those the rest of the code (the page, the
 *   entry without the Components of its routes, the other entities) uses, with all they use, stay in the bundle, and so
 *   do those of the route of the path / (the first screen) and those several routes use. Every other Component a
 *   route uses goes into the part of its Component: {Main: [names], Parts: {Component: [names]}}.
 * A text uses a Component by its tag (<Name), by Component: 'Name' or by its name in quotes.
 */

function escaped (name) {
	return String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uses (source, name) {
	return new RegExp('<\\s*' + escaped(name) + '(?:\\s|/?>)|([\'"])' + escaped(name) + '\\1').test(source || '');
}

/*
 * The code without its comments, each of the same length in spaces (the places of the rest stay), and the code with
 * what is between the brackets of a level below blank too: blank(text) or blank(text, true).
 */
function blank (source, nested) {
	var result = '';
	var depth = 0;
	var quote = '';
	var i = 0;

	while (i < source.length) {
		var character = source.charAt(i);
		var end;

		if (quote) {
			result += depth > 1 ? ' ' : character;

			if (character === '\\') {
				i++;
				result += depth > 1 ? ' ' : source.charAt(i);
			}
			else if (character === quote) {
				quote = '';
			}
		}
		else if (character === '/' && (source.charAt(i + 1) === '/' || source.charAt(i + 1) === '*')) {
			end = source.charAt(i + 1) === '/' ? source.indexOf('\n', i) : source.indexOf('*/', i + 2) + 2;
			end = end < i + 2 ? source.length : end;

			result += source.substring(i, end).replace(/[^\n]/g, ' ');
			i = end;

			continue;
		}
		else {
			if (character === '"' || character === '\'' || character === '`')
				quote = character;

			if (nested && (character === '{' || character === '['))
				depth++;

			result += nested && depth > 1 ? ' ' : character;

			if (nested && (character === '}' || character === ']'))
				depth--;
		}

		i++;
	}

	return result;
}

/* The text of a bracket from its start (an index of [ or {) to its end, in a code without comments. */
function bracket (source, start) {
	var open = source.charAt(start);
	var close = open === '[' ? ']' : '}';
	var depth = 0;
	var quote = '';
	var i = start;

	while (i < source.length) {
		var character = source.charAt(i);

		if (quote) {
			if (character === '\\') i++;
			else if (character === quote) quote = '';
		}
		else if (character === '"' || character === '\'' || character === '`') {
			quote = character;
		}
		else if (character === open) {
			depth++;
		}
		else if (character === close) {
			depth--;

			if (!depth)
				return source.substring(start, i + 1);
		}

		i++;
	}

	return source.substring(start);
}

/* The routes of a list (its text, from [ to ]): each object of its first level; one with children gives theirs. */
function read (list, routes) {
	var i = 1;

	while (i < list.length) {
		var character = list.charAt(i);
		var object;
		var own;
		var path;
		var component;
		var children;

		/* A string or an array of the list is passed over whole. */
		if (character === '"' || character === '\'' || character === '`' || character === '[') {
			i += character === '[' ? bracket(list, i).length : /^(['"`])(?:\\[\s\S]|(?!\1)[^\\])*\1?/.exec(list.substring(i))[0].length;

			continue;
		}

		if (character !== '{') {
			i++;

			continue;
		}

		object = bracket(list, i);
		own = blank(object, true);
		path = /\bPath\s*:\s*(['"])([^'"]*)\1/.exec(own);
		component = /\bComponent\s*:\s*(['"])([A-Za-z_$][\w$]*)\1/.exec(own);
		children = /\bChildren\s*:/.exec(own);

		/* Its list of children is blank in own (a level below): it is read from the object, where it starts after the key. */
		if (children) read(bracket(object, object.indexOf('[', children.index)), routes);
		else if (path && component) routes.push({Path: path[2], Component: component[2], Text: object});

		i += object.length;
	}

	return routes;
}

function Routes (source) {
	var routes = [];
	var text = blank(String(source || ''), false);
	var pattern = /\bRoutes\s*:\s*\[/g;
	var found;

	while ((found = pattern.exec(text)))
		read(bracket(text, found.index + found[0].length - 1), routes);

	return routes;
}

function Plan (components, rest, routes) {
	var names = Object.keys(components);
	var main = {};
	var owners = {};
	var parts = {};
	var text = String(rest || '');
	var split = routes.filter(function (route) {
		return route.Path !== '/' && route.Path !== '' && components[route.Component];
	});

	/* Everything a Component uses, and what that uses. */
	function closure (start, into) {
		var stack = [start];

		while (stack.length) {
			var name = stack.pop();
			if (into[name]) continue;

			into[name] = true;

			names.forEach(function (other) {
				if (!into[other] && other !== name && uses(components[name], other))
					stack.push(other);
			});
		}

		return into;
	}

	/* The rest of the code without the routes split: the Components it names stay, with the first screen. */
	split.forEach(function (route) {
		text = text.split(route.Text).join('');
	});

	names.forEach(function (name) {
		if (uses(text, name))
			closure(name, main);
	});

	routes.filter(function (route) {
		return (route.Path === '/' || route.Path === '') && components[route.Component];
	}).forEach(function (route) {
		closure(route.Component, main);
	});

	/* A Component of the routes split, by the parts that need it: in one part it goes there, in several it stays. */
	split.forEach(function (route) {
		Object.keys(closure(route.Component, {})).forEach(function (name) {
			if (main[name]) return;

			owners[name] = owners[name] || {};
			owners[name][route.Component] = true;
		});
	});

	Object.keys(owners).forEach(function (name) {
		var keys = Object.keys(owners[name]);

		if (keys.length !== 1) {
			main[name] = true;

			return;
		}

		parts[keys[0]] = (parts[keys[0]] || []).concat(name);
	});

	/* A part loses what stayed after all (a Component of two parts): what it keeps is what one route alone needs. */
	Object.keys(parts).forEach(function (key) {
		parts[key] = parts[key].filter(function (name) {
			return !main[name];
		}).sort();

		if (!parts[key].length)
			delete parts[key];
	});

	return {
		Main: names.filter(function (name) {
			return !Object.keys(parts).some(function (key) {
				return parts[key].indexOf(name) !== -1;
			});
		}).sort(),
		Parts: parts
	};
}

module.exports = {
	Routes: Routes,
	Plan: Plan,
	Uses: uses
};
