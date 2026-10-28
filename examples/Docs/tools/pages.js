/*
 * Makes the pages of the Library for the reference: one for every component, service and directive of ElemenxUI, from
 * the comment at the head of its source (in English), with its example (tools/examples/<Name>.html) and its Russian
 * description (the files of tools/ru) when they are there; and pages/index.json, the contents (the components in the
 * groups their $Meta names, as data/meta.json has them), and pages/search.<language>.json, the text of every page in a
 * language for the search of the reference. A page it made starts with the line <!-- generated -->: it is made again
 * each time; a page without that line was written by hand and is kept. A page of the Library lists the tests of its
 * component, service or directive too (tests/regression, tests/examples), their names linked to their lines in the
 * repository. node examples/Docs/tools/pages.js
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

/* A file written only when its text changes: the others stay as they are, for the watchers and indexers of editors. */
function save (file, text) {
	if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text) return;

	fs.mkdirSync(path.dirname(file), {recursive: true});

	/* An editor that indexes the file may hold it for a moment (on Windows the write fails then): a few tries. */
	for (var attempt = 1; ; attempt++) {
		try {
			fs.writeFileSync(file, text);

			return;
		}
		catch (error) {
			if (attempt === 10 || ['UNKNOWN', 'EBUSY', 'EPERM'].indexOf(error.code) === -1)
				throw error;

			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
		}
	}
}

function write (file, text) {
	if (fs.existsSync(file) && fs.readFileSync(file, 'utf8').indexOf(Marker) !== 0) return;

	save(file, text);
}

var Words = {
	en: {Properties: 'Properties', Property: 'Property', Default: 'Default', Events: 'Events', Slots: 'Slots', Slot: 'default', Methods: 'Methods', Tests: 'Tests', More: 'more in the same files'},
	ru: {Properties: 'Свойства', Property: 'Свойство', Default: 'По умолчанию', Events: 'События', Slots: 'Слоты', Slot: 'по умолчанию', Methods: 'Методы', Tests: 'Тесты', More: 'ещё в тех же файлах'}
};

var Root = path.resolve(Docs, '..', '..');

/* The files of the repository on its site: the repository of package.json, its main branch. */
var Repository = String((JSON.parse(fs.readFileSync(path.join(Root, 'package.json'), 'utf8')).repository || {}).url || '').replace(/^git\+/, '').replace(/\.git$/, '') + '/blob/main/';

/*
 * The tests of the repository, one entry for each: {File (from the root), Line, Title, Describe (the title of the
 * describe it is in), Body (its code up to the next test)}. A title is a string in quotes (its escapes read).
 */
var Tests = (function () {
	var result = [];

	['tests/regression', 'tests/examples'].forEach(function (folder) {
		fs.readdirSync(path.join(Root, folder)).filter(function (file) {
			return /\.(test|spec)\.[cm]?js$/.test(file);
		}).sort().forEach(function (file) {
			var source = fs.readFileSync(path.join(Root, folder, file), 'utf8');
			var pattern = /(^|[^\w.$])(describe|it|test)(?:\.(?:only|skip|each\([^)]*\)))?\(\s*(['"])((?:\\.|(?!\3)[^\\\n])*)\3/g;
			var marks = [];
			var match = pattern.exec(source);
			var describe = '';

			while (match) {
				marks.push({Kind: match[2], Title: match[4].replace(/\\(.)/g, '$1'), At: match.index + match[1].length});

				match = pattern.exec(source);
			}

			marks.forEach(function (mark, index) {
				if (mark.Kind === 'describe') {
					describe = mark.Title;

					return;
				}

				result.push({
					File: folder + '/' + file,
					Line: source.substring(0, mark.At).split('\n').length,
					Title: mark.Title,
					Describe: describe,
					Body: source.substring(mark.At, index + 1 < marks.length ? marks[index + 1].At : source.length)
				});
			});
		});
	});

	return result;
})();

/*
 * The tests of a component, a service or a directive, the closest first: the ones whose name or describe names it,
 * then the ones that make it or ask for it by its name, then the ones whose templates have its tag; at most limit.
 * {List, More}.
 */
function testsOf (kind, name, limit) {
	var escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	var word = kind.ID === 'directives' ? new RegExp('\\*' + escaped + '\\b') : new RegExp('(^|[^\\w$])' + escaped + '(?![\\w$])');
	var asked = kind.ID === 'directives' ? new RegExp('\\*' + escaped + '\\b|[\'"]directive:' + escaped + '[\'"]') : new RegExp('[\'"](?:service:)?' + escaped + '[\'"]');
	var tag = kind.ID === 'components' ? new RegExp('<' + escaped + '[\\s/>]') : null;
	var ranked = [[], [], []];
	var list;

	Tests.forEach(function (test) {
		if (word.test(test.Title) || word.test(test.Describe)) ranked[0].push(test);
		else if (asked.test(test.Body)) ranked[1].push(test);
		else if (tag && tag.test(test.Body)) ranked[2].push(test);
	});

	list = ranked[0].concat(ranked[1], ranked[2]);

	return {List: list.slice(0, limit), More: Math.max(0, list.length - limit)};
}

/* The section of the tests of a page: their names linked to their lines, the file beside each. */
function tests (kind, name, language) {
	var words = Words[language];
	var found = testsOf(kind, name, 12);
	if (!found.List.length) return '';

	return '\n## ' + words.Tests + '\n\n' + found.List.map(function (test) {
		return '- [' + test.Title.replace(/([[\]\\])/g, '\\$1') + '](' + Repository + test.File + '#L' + test.Line + ') — `' + test.File + '`';
	}).join('\n') + (found.More ? '\n\n+' + found.More + ' ' + words.More : '') + '\n';
}

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

/* The descriptions of the events in Russian: {'Component.event': text}. */
var RussianEvents = JSON.parse(fs.readFileSync(path.join(__dirname, 'ru-events.json'), 'utf8'));

/* The descriptions of the events of a component in data/meta.json, or null when it describes none. */
function eventDescriptions (name) {
	var found = meta.Components.filter(function (component) {
		return component.Name === name;
	})[0];

	return found && found.EventDescriptions && Object.keys(found.EventDescriptions).length ? found.EventDescriptions : null;
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

	/* The events with their descriptions ($Meta.Events as {name: description}; in Russian those of tools/ru-events.json), their names alone otherwise. */
	if (events.length && eventDescriptions(name)) {
		text += '\n## ' + words.Events + '\n\n' + events.map(function (event) {
			var described = language === 'ru' ? RussianEvents[name + '.' + event] : eventDescriptions(name)[event];

			return '- `' + event + '`' + (described ? ': ' + described : '');
		}).join('\n') + '\n';
	}
	else if (events.length) {
		text += '\n## ' + words.Events + '\n\n' + events.map(function (event) {
			return '`' + event + '`';
		}).join(', ') + '\n';
	}

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

	return text + tests(kind, name.replace(/^\*/, ''), language);
}

var sections = guide.Sections.slice();

/* The groups of the components: the one each names in its $Meta, in the order of the palette, by the names of the Library. */
var meta = JSON.parse(fs.readFileSync(path.join(Library, 'data', 'meta.json'), 'utf8'));
var labels = {en: JSON.parse(fs.readFileSync(path.join(Library, 'locales', 'en.json'), 'utf8')).ui.designer.groups, ru: JSON.parse(fs.readFileSync(path.join(Library, 'locales', 'ru.json'), 'utf8')).ui.designer.groups};
var order = ['layout', 'text', 'inputs', 'buttons', 'menus', 'navigation', 'display', 'feedback', 'data', 'codes', 'media', 'overlays', 'social', 'commerce', 'music', 'game', 'tools', 'other'];
var groupOf = {};

meta.Components.forEach(function (component) {
	groupOf[component.Name] = order.indexOf(component.Group) === -1 ? 'other' : component.Group;
});

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

	sections.push(kind.ID === 'components' ? {
		ID: kind.ID,
		Title: kind.Title,
		Groups: order.filter(function (group) {
			return names.some(function (name) {
				return (groupOf[name] || 'other') === group;
			});
		}).map(function (group) {
			return {ID: group, Title: {en: labels.en[group], ru: labels.ru[group]}};
		}),
		Pages: names.map(function (name) {
			return {ID: name, Title: {en: name}, Group: groupOf[name] || 'other'};
		})
	} : {
		ID: kind.ID,
		Title: kind.Title,
		Pages: names.map(function (name) {
			var id = kind.ID === 'directives' ? name.charAt(0).toLowerCase() + name.substring(1) : name;

			return {ID: id, Title: {en: kind.ID === 'directives' ? '*' + id : name}};
		})
	});
});

save(path.join(Pages, 'index.json'), JSON.stringify({Sections: sections}, null, '\t') + '\n');

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

/*
 * The text of a page for the search: its words without the marks of Markdown (headings, emphasis, links: their text),
 * its code kept, its lines joined.
 */
/* The text of a page for the search: no markup, and no diagram (its SVG is no text to find). */
function plain (text) {
	return text.replace(Marker, '').replace(/^```diagram\n[\s\S]*?^```$/gm, '').replace(/^# .*$/m, '').replace(/^```\w*$/gm, '').replace(/^#+\s*/gm, '').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]+/g, '').replace(/\s+/g, ' ').trim();
}

/* The search of the reference in each language: every page, its section, its title and its text (the English one when it has none). */
['en', 'ru'].forEach(function (language) {
	var entries = [];

	sections.forEach(function (section) {
		section.Pages.forEach(function (entry) {
			var own = path.join(Pages, section.ID, entry.ID + '.' + language + '.md');
			var file = fs.existsSync(own) ? own : path.join(Pages, section.ID, entry.ID + '.en.md');
			if (!fs.existsSync(file)) return;

			entries.push({ID: section.ID + '/' + entry.ID, Section: section.Title[language] || section.Title.en, Title: entry.Title ? entry.Title[language] || entry.Title.en : entry.ID, Text: plain(fs.readFileSync(file, 'utf8'))});
		});
	});

	save(path.join(Pages, 'search.' + language + '.json'), JSON.stringify(entries) + '\n');
});
