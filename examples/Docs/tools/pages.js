/*
 * Makes the pages of the Library for the reference: one for every component, service and directive of ElemenxUI,
 * from the comment at the head of its source (in English), with its example (tools/examples/<Name>.html) and its Russian
 * description (the files of tools/ru) when they are there; and pages/index.json, the contents. A page it made starts with the
 * line <!-- generated -->: it is made again each time; a page without that line was written by hand and is kept.
 * node examples/Docs/tools/pages.js
 */
var fs = require('fs');
var path = require('path');
var isPublic = require('./public.js');

var Docs = path.resolve(__dirname, '..');
var Library = path.resolve(Docs, '..', '..', 'libraries', 'ElemenxUI');
var Pages = path.join(Docs, 'pages');
var Marker = '<!-- generated -->';
var examples = {};

/* The examples: tools/examples/<Name>.html, the example of the page of that name. */
fs.readdirSync(path.join(__dirname, 'examples')).forEach(function (file) {
	if (/\.html$/.test(file))
		examples[file.replace(/\.html$/, '')] = fs.readFileSync(path.join(__dirname, 'examples', file), 'utf8').replace(/\s+$/, '');
});

var russian = {};

/* The Russian descriptions: the files of tools/ru, {Name: Markdown}. */
fs.readdirSync(path.join(__dirname, 'ru')).filter(function (file) {
	return /\.json$/.test(file);
}).forEach(function (file) {
	var part = JSON.parse(fs.readFileSync(path.join(__dirname, 'ru', file), 'utf8'));
	var name;

	for (name in part) {
		if (Object.prototype.hasOwnProperty.call(part, name))
			russian[name] = part[name];
	}
});

var guide = JSON.parse(fs.readFileSync(path.join(__dirname, 'guide.json'), 'utf8'));

var kinds = [
	{ID: 'components', Title: {en: 'Components', ru: 'Компоненты'}, Example: {en: 'Example', ru: 'Пример'}},
	{ID: 'services', Title: {en: 'Services', ru: 'Сервисы'}, Example: {en: 'Example', ru: 'Пример'}},
	{ID: 'directives', Title: {en: 'Directives', ru: 'Директивы'}, Example: {en: 'Example', ru: 'Пример'}}
];

/* The comment at the head of a source as Markdown: its paragraphs, and its lines that start with "- " as a list. */
function markdown (source) {
	var match = /^\/\*([\s\S]*?)\*\//.exec(source);
	var blocks = [];
	var current = null;

	if (!match) return '';

	match[1].split('\n').forEach(function (raw) {
		var line = raw.replace(/^\s*\* ?/, '');

		if (!line.trim()) {
			current = null;

			return;
		}

		if (/^- /.test(line)) {
			current = {List: true, Text: line.substring(2).trim()};

			blocks.push(current);

			return;
		}

		if (current && (current.List ? /^ {2}/.test(line) : true)) {
			current.Text += ' ' + line.trim();

			return;
		}

		current = {List: false, Text: line.trim()};

		blocks.push(current);
	});

	return blocks.map(function (block, index) {
		var next = blocks[index + 1];

		return (block.List ? '- ' : '') + block.Text + (block.List && next && next.List ? '\n' : '\n\n');
	}).join('').trim() + '\n';
}

function write (file, text) {
	if (fs.existsSync(file) && fs.readFileSync(file, 'utf8').indexOf(Marker) !== 0) return;

	fs.mkdirSync(path.dirname(file), {recursive: true});
	fs.writeFileSync(file, text);
}

var Words = {
	en: {Properties: 'Properties', Property: 'Property', Default: 'Default', Events: 'Events', Slots: 'Slots', Slot: 'default', Methods: 'Methods'},
	ru: {Properties: 'Свойства', Property: 'Свойство', Default: 'По умолчанию', Events: 'События', Slots: 'Слоты', Slot: 'по умолчанию', Methods: 'Методы'}
};

/*
 * The members of a definition: the entries of its object one tab in (a value, or a method with its arguments), and the
 * methods its $OnCreate gives the instance (this.Name = function (...)).
 */
function members (source) {
	var result = {Values: [], Methods: []};
	var seen = {};

	source.split('\n').forEach(function (line) {
		var entry = /^\t([A-Za-z]\w*): (.*?),?\s*$/.exec(line);
		var method = /^\t\tthis\.([A-Z]\w*) = function \(([^)]*)\)/.exec(line);
		var value;

		if (method && !seen[method[1]]) {
			seen[method[1]] = true;

			result.Methods.push({Name: method[1], Arguments: method[2]});

			return;
		}

		if (!entry || seen[entry[1]]) return;

		seen[entry[1]] = true;

		if (/^function\s*\(/.test(entry[2])) {
			result.Methods.push({Name: entry[1], Arguments: /^function\s*\(([^)]*)\)/.exec(entry[2])[1]});

			return;
		}

		value = entry[2];

		if (/[[{]$/.test(value))
			value = value.slice(0, -1) + (value.slice(-1) === '[' ? '[…]' : '{…}');

		result.Values.push({Name: entry[1], Value: value});
	});

	return result;
}

/*
 * The API of a page: the props of a component with their defaults, its events and its slots, and the methods of a
 * component or a service. Only the public members are listed (tools/public.js): the other members are its state.
 */
function api (kind, name, source, template, comment, language) {
	var words = Words[language];
	var found = members(source);
	var text = '';
	var events = [];
	var slots = [];
	var pattern = /\$Emit\('([\w-]+)'/g;
	var match;
	var props = found.Values.filter(function (value) {
		return isPublic(name, value.Name, comment);
	});
	var methods = found.Methods.filter(function (method) {
		return new RegExp('(^|[^A-Za-z0-9_])' + method.Name + '\\(').test(comment);
	});

	if (kind.ID === 'components' && props.length) {
		text += '\n## ' + words.Properties + '\n\n| ' + words.Property + ' | ' + words.Default + ' |\n| --- | --- |\n';
		text += props.map(function (value) {
			return '| `' + value.Name + '` | `' + value.Value.replace(/\|/g, '\\|') + '` |';
		}).join('\n') + '\n';
	}

	if (kind.ID === 'components') {
		match = pattern.exec(source + template);

		while (match) {
			if (events.indexOf(match[1]) === -1)
				events.push(match[1]);

			match = pattern.exec(source + template);
		}

		pattern = /<slot(?:\s+name="([\w-]+)")?/g;
		match = pattern.exec(template);

		while (match) {
			if (slots.indexOf(match[1] || '') === -1)
				slots.push(match[1] || '');

			match = pattern.exec(template);
		}
	}

	if (events.length)
		text += '\n## ' + words.Events + '\n\n' + events.map(function (event) {
			return '`' + event + '`';
		}).join(', ') + '\n';

	if (slots.length)
		text += '\n## ' + words.Slots + '\n\n' + slots.map(function (slot) {
			return slot ? '`' + slot + '`' : words.Slot;
		}).join(', ') + '\n';

	if (methods.length)
		text += '\n## ' + words.Methods + '\n\n' + methods.map(function (method) {
			return '- `' + method.Name + '(' + method.Arguments + ')`';
		}).join('\n') + '\n';

	return text;
}

function page (kind, name, description, language, reference) {
	var example = examples[name.replace(/^\*/, '')] || examples[name];
	var text = Marker + '\n# ' + name + '\n\n' + description + (reference || '');

	if (example)
		text += '\n## ' + kind.Example[language] + '\n\n```example\n' + example + '\n```\n';

	return text;
}

var sections = guide.Sections.slice();

kinds.forEach(function (kind) {
	var directory = path.join(Library, kind.ID);
	var names = fs.readdirSync(directory).filter(function (entry) {
		return kind.ID === 'components' ? fs.existsSync(path.join(directory, entry, entry + '.js')) : /\.js$/.test(entry);
	}).map(function (entry) {
		return entry.replace(/\.js$/, '');
	}).sort();

	names.forEach(function (name) {
		var file = kind.ID === 'components' ? path.join(directory, name, name + '.js') : path.join(directory, name + '.js');
		var source = fs.readFileSync(file, 'utf8');
		var html = path.join(directory, name, name + '.html');
		var template = kind.ID === 'components' && fs.existsSync(html) ? fs.readFileSync(html, 'utf8') : '';
		var comment = (/^\/\*([\s\S]*?)\*\//.exec(source) || ['', ''])[1];
		var id = kind.ID === 'directives' ? name.charAt(0).toLowerCase() + name.substring(1) : name;
		var title = kind.ID === 'directives' ? '*' + id : name;

		write(path.join(Pages, kind.ID, id + '.en.md'), page(kind, title, markdown(source), 'en', api(kind, name, source, template, comment, 'en')));

		if (russian[name])
			write(path.join(Pages, kind.ID, id + '.ru.md'), page(kind, title, russian[name].trim() + '\n', 'ru', api(kind, name, source, template, comment, 'ru')));
	});

	sections.push({
		ID: kind.ID,
		Title: kind.Title,
		Pages: names.map(function (name) {
			var id = kind.ID === 'directives' ? name.charAt(0).toLowerCase() + name.substring(1) : name;

			return {ID: id, Title: {en: kind.ID === 'directives' ? '*' + id : name}};
		})
	});
});

fs.writeFileSync(path.join(Pages, 'index.json'), JSON.stringify({Sections: sections}, null, '\t') + '\n');

/*
 * The Russian pages written by hand: tools/ru-pages/<section>/<page>.md, the text in Russian, and a line "@block N"
 * where the N-th fenced block of the English page goes (its code and its examples), so the code of both stays the same.
 */
function translations (directory, relative) {
	fs.readdirSync(directory).forEach(function (entry) {
		var file = path.join(directory, entry);
		var name = relative ? relative + '/' + entry : entry;
		var english;
		var blocks;

		if (fs.statSync(file).isDirectory()) {
			translations(file, name);

			return;
		}

		english = fs.readFileSync(path.join(Pages, name.replace(/\.md$/, '.en.md')), 'utf8');
		blocks = english.match(/^```[\s\S]*?^```$/gm) || [];

		write(path.join(Pages, name.replace(/\.md$/, '.ru.md')), Marker + '\n' + fs.readFileSync(file, 'utf8').replace(/^@block (\d+)$/gm, function (line, index) {
			if (!blocks[index - 1])
				throw new Error('No block ' + index + ' in ' + name.replace(/\.md$/, '.en.md'));

			return blocks[index - 1];
		}));
	});
}

translations(path.join(__dirname, 'ru-pages'), '');
