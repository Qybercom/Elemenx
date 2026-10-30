/*
 * The parts of ElemenxUI for the browser contracts: the page of the tests serves no Library, so a test defines the
 * Components, Services and Directives it needs from their sources, the templates and the styles inline. Use(names)
 * defines them and what they use in turn: the Components of their templates, the Services they ask for ($Service) and
 * the Directives of their templates, their Traits ($Traits) and their bases ($Extends). The phrases of ElemenxUI in
 * English come with them (Elemenx.Locale).
 */
import english from '../libraries/ElemenxUI/locales/en.json';

var components = import.meta.glob('../libraries/ElemenxUI/components/*/*.{js,html,css}', {query: '?raw', import: 'default', eager: true});
var services = import.meta.glob('../libraries/ElemenxUI/services/*.js', {query: '?raw', import: 'default', eager: true});
var directives = import.meta.glob('../libraries/ElemenxUI/directives/*.js', {query: '?raw', import: 'default', eager: true});
var traits = import.meta.glob('../libraries/ElemenxUI/traits/*.js', {query: '?raw', import: 'default', eager: true});
var defined = {};

function file (list, name) {
	var key = Object.keys(list).find(function (path) {
		return path.slice(-name.length - 1) === '/' + name;
	});

	return key ? list[key] : null;
}

/* The names of the Components of the Library a text names as tags, of the Services it asks for and of its directives. */
function wants (text) {
	var found = {Components: [], Services: [], Directives: [], Traits: []};
	var match;
	var tags = /<([A-Z]\w*)\b/g;
	var asked = /\$Service\(\s*'(\w+)'/g;
	var marks = /\s\*([a-z]\w*)\b/g;
	var extended = /\$Extends\s*:\s*(['"])(\w+)\1/g;
	var listed = /\$Traits\s*:\s*\[([^\]]*)\]/g;

	while ((match = tags.exec(text)))
		found.Components.push(match[1]);

	while ((match = asked.exec(text)))
		found.Services.push(match[1]);

	while ((match = marks.exec(text)))
		found.Directives.push(match[1]);

	while ((match = extended.exec(text)))
		found.Components.push(match[2]);

	while ((match = listed.exec(text))) {
		(match[1].match(/'[^']+'|"[^"]+"/g) || []).forEach(function (name) {
			found.Traits.push(name.slice(1, -1));
		});
	}

	return found;
}

function service (name) {
	var source = file(services, name + '.js');
	if (defined['service:' + name] || !source) return;

	defined['service:' + name] = true;

	need(wants(source));

	new Function(source)();
}

function directive (name) {
	var key = Object.keys(directives).find(function (path) {
		return /\/(\w+)\.js$/.exec(path)[1].toLowerCase() === name.toLowerCase();
	});
	if (defined['directive:' + name.toLowerCase()] || !key) return;

	defined['directive:' + name.toLowerCase()] = true;

	need(wants(directives[key]));

	new Function(directives[key])();
}

function component (name) {
	var source = file(components, name + '/' + name + '.js');
	var template = file(components, name + '/' + name + '.html');
	var style = file(components, name + '/' + name + '.css');

	if (defined['component:' + name] || !source) return;

	defined['component:' + name] = true;

	need(wants(source + '\n' + (template || '')));

	new Function(source.replace(/\n\t\$StyleURL: '[^']*',/, '').replace(/\$TemplateURL: '[^']*'/, function () {
		return '$Template: ' + JSON.stringify(template || '');
	}))();

	if (style)
		Elemenx.Style('test:' + name, style);
}

function trait (name) {
	var source = file(traits, name + '.js');
	if (defined['trait:' + name] || !source) return;

	defined['trait:' + name] = true;

	need(wants(source));

	new Function(source)();
}

function need (found) {
	found.Traits.forEach(trait);
	found.Services.forEach(service);
	found.Directives.forEach(directive);
	found.Components.forEach(component);
}

/* Defines the Components (by their names), the Services ('service:Name') and the Directives ('*name') given, and what they use. */
export function Use (names) {
	if (!defined.locale) {
		defined.locale = true;

		Elemenx.Locale.Add('en', english);
	}

	names.forEach(function (name) {
		if (name.indexOf('service:') === 0) service(name.substring(8));
		else if (name.charAt(0) === '*') directive(name.substring(1));
		else component(name);
	});
}
