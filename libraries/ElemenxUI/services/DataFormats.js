/*
 * The formats of data and of files: a text read into values and values written into a text, by the name of a format.
 * - Parse(name, text, options) the values of a text; Stringify(name, value, options) the text of values. A text a
 *   format cannot read throws an Error that names the place: its Line and Column (from 1), in its message too.
 * - Register(name, format) adds a format of the Application (or replaces one): {Parse(text, options),
 *   Stringify(value, options), Extensions: ['.ext'], Mime, Label}. Find(name) returns one, Names() lists them,
 *   For(file) the name of the format of a file name (by its extension) or of a type of MIME, or null.
 * Built in, with their options:
 * - json: Indent (2) for Stringify; jsonc reads comments and trailing commas too.
 * - yaml (yml), YAML 1.2 of the core schema: block and flow collections, plain, quoted and block scalars (| and >,
 *   with - and +), comments, anchors and aliases (&a, *a), the merge key <<, several documents (---: All gives them
 *   all). No tags (!!str) and no complex keys (? ). Stringify writes block style, Indent (2).
 * - csv and tsv: Header (true: objects by the names of the first row; false: rows of cells), Delimiter (, or a tab),
 *   Types (true: numbers and booleans read as such). Stringify takes rows or objects (their keys the header).
 * - ini: [sections] (with dots: nested), key = value or key: value, ; and # comments, Types (true).
 * - toml (TOML 1.0): tables, arrays of tables, dotted keys, strings (basic, literal, multi-line), integers (with _,
 *   0x, 0o, 0b), floats (inf, nan), booleans, dates and times (as their text), arrays and inline tables.
 * - xml: an element as {Name, Attributes, Children} (a text is a string among the Children, its spaces around it gone
 *   when elements are beside it); comments, processing instructions and the doctype are left out, CDATA is text.
 *   Stringify: Indent (2), Declaration (true).
 * - query: a=1&b=2&b=3&c[d]=4 as {a: '1', b: ['2', '3'], c: {d: '4'}} (a[] adds to a list); Stringify the other way.
 * - base64: Parse gives the text (UTF-8), Bytes true a Uint8Array; Stringify takes a text, a Uint8Array or an
 *   ArrayBuffer; Url true is the variant for addresses (- and _, no =).
 */
Elemenx.Service('DataFormats', {
	$Meta: {
		Description: 'The formats of data and of files: JSON, YAML, CSV, INI, TOML, XML, query strings and Base64 read and written, and formats of your own.',
		Methods: ['Parse(name, text, options)', 'Stringify(name, value, options)', 'Register(name, format)', 'Find(name)', 'Names()', 'For(file)']
	},

	$OnCreate: function () {
		var self = this;

		this.Formats = {};
		this.Aliases = {};

		this.Register('json', {Label: 'JSON', Extensions: ['.json'], Mime: 'application/json', Parse: function (text) {
			return self.Json(text, false);
		}, Stringify: function (value, options) {
			return JSON.stringify(value, null, self.Indent(options));
		}});
		this.Register('jsonc', {Label: 'JSON with comments', Extensions: ['.jsonc', '.json5'], Parse: function (text) {
			return self.Json(text, true);
		}, Stringify: function (value, options) {
			return JSON.stringify(value, null, self.Indent(options));
		}});
		this.Register('yaml', {Label: 'YAML', Aliases: ['yml'], Extensions: ['.yaml', '.yml'], Mime: 'application/yaml', Parse: function (text, options) {
			return self.Yaml(text, options || {});
		}, Stringify: function (value, options) {
			return self.YamlWrite(value, options || {});
		}});
		this.Register('csv', {Label: 'CSV', Extensions: ['.csv'], Mime: 'text/csv', Parse: function (text, options) {
			return self.Csv(text, options || {}, ',');
		}, Stringify: function (value, options) {
			return self.CsvWrite(value, options || {}, ',');
		}});
		this.Register('tsv', {Label: 'TSV', Extensions: ['.tsv', '.tab'], Mime: 'text/tab-separated-values', Parse: function (text, options) {
			return self.Csv(text, options || {}, '\t');
		}, Stringify: function (value, options) {
			return self.CsvWrite(value, options || {}, '\t');
		}});
		this.Register('ini', {Label: 'INI', Extensions: ['.ini', '.cfg', '.conf'], Parse: function (text, options) {
			return self.Ini(text, options || {});
		}, Stringify: function (value) {
			return self.IniWrite(value);
		}});
		this.Register('toml', {Label: 'TOML', Extensions: ['.toml'], Mime: 'application/toml', Parse: function (text) {
			return self.Toml(text);
		}, Stringify: function (value) {
			return self.TomlWrite(value);
		}});
		this.Register('xml', {Label: 'XML', Extensions: ['.xml', '.svg', '.xhtml'], Mime: 'application/xml', Parse: function (text) {
			return self.Xml(text);
		}, Stringify: function (value, options) {
			return self.XmlWrite(value, options || {});
		}});
		this.Register('query', {Label: 'Query string', Parse: function (text) {
			return self.Query(text);
		}, Stringify: function (value) {
			return self.QueryWrite(value);
		}});
		this.Register('base64', {Label: 'Base64', Extensions: ['.b64'], Parse: function (text, options) {
			return self.Base64(text, options || {});
		}, Stringify: function (value, options) {
			return self.Base64Write(value, options || {});
		}});
	},

	Register: function (name, format) {
		var self = this;
		var key = String(name || '').toLowerCase();
		if (!key || !format || typeof format.Parse !== 'function' || typeof format.Stringify !== 'function')
			throw new Error('DataFormats.Register expects (name, {Parse(text, options), Stringify(value, options)})');

		this.Formats[key] = format;

		(format.Aliases || []).forEach(function (alias) {
			self.Aliases[String(alias).toLowerCase()] = key;
		});

		return this;
	},

	Find: function (name) {
		var key = String(name || '').toLowerCase();

		return this.Formats[key] || this.Formats[this.Aliases[key]] || null;
	},

	Names: function () {
		return Object.keys(this.Formats);
	},

	/* The format of a file name (by its extension) or of a type of MIME. */
	For: function (file) {
		var text = String(file || '').toLowerCase();
		var self = this;
		var found = null;

		Object.keys(this.Formats).forEach(function (name) {
			var format = self.Formats[name];

			if (found) return;

			if (format.Mime && text === format.Mime)
				found = name;

			(format.Extensions || []).forEach(function (extension) {
				if (!found && text.slice(-extension.length) === extension)
					found = name;
			});
		});

		return found;
	},

	Parse: function (name, text, options) {
		var format = this.Find(name);
		if (!format)
			throw new Error('Elemenx DataFormats has no format ' + name + ' (' + this.Names().join(', ') + ')');

		return format.Parse(String(text == null ? '' : text), options || {});
	},

	Stringify: function (name, value, options) {
		var format = this.Find(name);
		if (!format)
			throw new Error('Elemenx DataFormats has no format ' + name + ' (' + this.Names().join(', ') + ')');

		return format.Stringify(value, options || {});
	},

	Indent: function (options) {
		return options && options.Indent !== undefined ? options.Indent : 2;
	},

	/* An Error at an offset of a text: its line and column, from 1. */
	Fail: function (format, text, offset, message) {
		var before = String(text).substring(0, Math.max(0, offset));
		var lines = before.split('\n');
		var error = new Error('Elemenx DataFormats ' + format + ': line ' + lines.length + ', column ' + (lines[lines.length - 1].length + 1) + ': ' + message);

		error.Line = lines.length;
		error.Column = lines[lines.length - 1].length + 1;

		return error;
	},

	/* JSON; with loose true its comments and the commas before a closing bracket go first (their places kept). */
	Json: function (text, loose) {
		var source = text;
		var match;
		var at;

		if (loose)
			source = this.Unloose(text);

		try {
			return JSON.parse(source);
		}
		catch (error) {
			match = /position (\d+)/.exec(error.message);
			at = match ? Number(match[1]) : source.length;

			throw this.Fail('json', source, at, error.message.replace(/ in JSON at position \d+.*$/, '').replace(/^JSON\.parse: /, ''));
		}
	},

	/* JSON with comments and trailing commas as plain JSON: each becomes spaces, so the offsets stay. */
	Unloose: function (text) {
		var out = '';
		var i = 0;
		var quote = false;
		var blank = function (part) {
			return part.replace(/[^\n]/g, ' ');
		};

		while (i < text.length) {
			var c = text.charAt(i);

			if (quote) {
				out += c;

				if (c === '\\') {
					out += text.charAt(i + 1);
					i += 2;

					continue;
				}

				if (c === '"')
					quote = false;

				i++;

				continue;
			}

			if (c === '"') {
				quote = true;
				out += c;
				i++;

				continue;
			}

			if (c === '/' && text.charAt(i + 1) === '/') {
				var end = text.indexOf('\n', i);

				end = end === -1 ? text.length : end;
				out += blank(text.substring(i, end));
				i = end;

				continue;
			}

			if (c === '/' && text.charAt(i + 1) === '*') {
				var close = text.indexOf('*/', i + 2);

				close = close === -1 ? text.length : close + 2;
				out += blank(text.substring(i, close));
				i = close;

				continue;
			}

			out += c;

			i++;
		}

		return out.replace(/,(\s*[}\]])/g, ' $1');
	},

	/* YAML: the document, or with All every document of the text. */
	Yaml: function (text, options) {
		var source = String(text).replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '');
		var documents = [];
		var anchors = {};
		var lines;

		function fail (line, column, message) {
			var error = new Error('Elemenx DataFormats yaml: line ' + line + ', column ' + column + ': ' + message);

			error.Line = line;
			error.Column = column;

			return error;
		}

		/* The text of a line without its comment (a # after a space, outside quotes). */
		function uncomment (text) {
			var quote = null;
			var k;

			for (k = 0; k < text.length; k++) {
				var c = text.charAt(k);

				if (quote) {
					if (c === '\\' && quote === '"') {
						k++;
					}
					else if (c === quote) {
						if (quote === '\'' && text.charAt(k + 1) === '\'') k++;
						else quote = null;
					}
				}
				else if (c === '"' || c === '\'') {
					if (k === 0 || /[\s[{,:\-]/.test(text.charAt(k - 1)))
						quote = c;
				}
				else if (c === '#' && (k === 0 || /\s/.test(text.charAt(k - 1)))) {
					return text.substring(0, k).replace(/\s+$/, '');
				}
			}

			return text.replace(/\s+$/, '');
		}

		function blank (line) {
			return !uncomment(line.Text).trim();
		}

		/* A plain scalar of the core schema: null, a boolean, a number, or the text. */
		function plain (text) {
			if (/^(?:~|null|Null|NULL)?$/.test(text)) return null;
			if (/^(?:true|True|TRUE)$/.test(text)) return true;
			if (/^(?:false|False|FALSE)$/.test(text)) return false;
			if (/^[-+]?[0-9]+$/.test(text)) return parseInt(text, 10);

			if (/^0o[0-7]+$/.test(text))
				return parseInt(text.substring(2), 8);

			if (/^0x[0-9a-fA-F]+$/.test(text))
				return parseInt(text.substring(2), 16);

			if (/^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE][-+]?[0-9]+)?$/.test(text)) return parseFloat(text);

			if (/^[-+]?\.(?:inf|Inf|INF)$/.test(text))
				return text.charAt(0) === '-' ? -Infinity : Infinity;

			if (/^\.(?:nan|NaN|NAN)$/.test(text)) return NaN;

			return text;
		}

		/* A double-quoted scalar: its escapes. */
		function unescape (text, line, column) {
			return text.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/g, function (all, code) {
				var map = {n: '\n', t: '\t', r: '\r', '0': '\0', '"': '"', '\\': '\\', '/': '/', ' ': ' ', b: '\b', f: '\f', e: '\x1b', a: '\x07', v: '\v', N: '\u0085', _: '\u00a0'};

				if (code.length > 1)
					return String.fromCharCode(parseInt(code.substring(1), 16));

				if (map[code] === undefined)
					throw fail(line, column, 'an unknown escape \\' + code);

				return map[code];
			});
		}

		/* Folded lines of a quoted or a plain scalar: a single break is a space, an empty line a break. */
		function fold (parts) {
			var out = '';

			parts.forEach(function (part, index) {
				var trimmed = index ? part.replace(/^\s+/, '') : part;

				if (!index) out = trimmed;
				else if (!trimmed) out += '\n';
				else out += (/\n$/.test(out) || !out ? '' : ' ') + trimmed;
			});

			return out;
		}

		/* A node with anchors and aliases: &name before it, *name for it. */
		function anchored (text, line, column, read) {
			var match = /^&([^\s,[\]{}]+)\s*/.exec(text);
			var value;

			if (/^!/.test(text))
				throw fail(line, column, 'tags (!' + text.substring(1).split(/\s/)[0] + ') are not supported');

			if (match) {
				value = read(text.substring(match[0].length));
				anchors[match[1]] = value;

				return value;
			}

			match = /^\*([^\s,[\]{}]+)$/.exec(text);

			if (match) {
				if (!Object.prototype.hasOwnProperty.call(anchors, match[1]))
					throw fail(line, column, 'no anchor &' + match[1]);

				return anchors[match[1]];
			}

			return read(text);
		}

		/* A flow collection or a scalar written on lines from k: {Value, Next}. */
		function flow (k, column) {
			var text = '';
			var first = k;
			var depth = 0;
			var quote = null;
			var i;
			var j;

			/* The flow text, line after line until its brackets close. */
			for (j = k; j < lines.length; j++) {
				var part = j === k ? lines[j].substring(column) : lines[j];

				text += (j === k ? '' : '\n') + part;

				for (i = 0; i < part.length; i++) {
					var c = part.charAt(i);

					if (quote) {
						if (c === '\\' && quote === '"') i++;
						else if (c === quote) quote = null;
					}
					else if (c === '"' || c === '\'') {
						quote = c;
					}
					else if (c === '#' && (i === 0 || /\s/.test(part.charAt(i - 1)))) {
						text = text.substring(0, text.length - part.length + i);

						break;
					}
					else if (c === '[' || c === '{') {
						depth++;
					}
					else if (c === ']' || c === '}') {
						depth--;
					}
				}

				if (depth <= 0 && !quote) break;
			}

			if (depth > 0)
				throw fail(first + 1, column + 1, 'a flow collection is not closed');

			var at = 0;

			function space () {
				while (at < text.length && /\s/.test(text.charAt(at))) at++;
			}

			function item () {
				var start;
				var value;
				var quoted;

				space();

				var c = text.charAt(at);

				if (c === '[') {
					var list = [];

					at++;

					space();

					while (text.charAt(at) !== ']') {
						list.push(entry());

						space();

						if (text.charAt(at) === ',') at++;
						else if (text.charAt(at) !== ']') throw fail(first + 1, column + at + 1, 'a , or a ] is expected');

						space();
					}

					at++;

					return list;
				}

				if (c === '{') {
					var map = {};

					at++;

					space();

					while (text.charAt(at) !== '}') {
						var key = scalar(true);

						space();

						if (text.charAt(at) === ':') {
							at++;
							map[key] = entry();
						}
						else {
							map[key] = null;
						}

						space();

						if (text.charAt(at) === ',') at++;
						else if (text.charAt(at) !== '}') throw fail(first + 1, column + at + 1, 'a , or a } is expected');

						space();
					}

					at++;

					return map;
				}

				start = at;
				quoted = c === '"' || c === '\'';
				value = scalar(false);

				return quoted ? value : anchored(text.substring(start, at).trim(), first + 1, column + start + 1, function (rest) {
					return plain(rest);
				});
			}

			/* An entry of a sequence: a value, or a pair key: value (a one-key map). */
			function entry () {
				var start = at;
				var value = item();
				var pair;

				space();

				if (text.charAt(at) === ':' && typeof value === 'string' && at > start) {
					at++;
					pair = {};
					pair[value] = item();

					return pair;
				}

				return value;
			}

			function scalar (key) {
				var c = text.charAt(at);
				var start;
				var end;

				space();

				c = text.charAt(at);

				if (c === '"') {
					end = at + 1;

					while (end < text.length && text.charAt(end) !== '"') end += text.charAt(end) === '\\' ? 2 : 1;

					var double = text.substring(at + 1, end);

					at = end + 1;

					return unescape(fold(double.split('\n')), first + 1, column + 1);
				}

				if (c === '\'') {
					end = at + 1;

					while (end < text.length && !(text.charAt(end) === '\'' && text.charAt(end + 1) !== '\'')) end += text.charAt(end) === '\'' ? 2 : 1;

					var single = text.substring(at + 1, end).replace(/''/g, '\'');

					at = end + 1;

					return fold(single.split('\n'));
				}

				start = at;

				while (at < text.length && !/[,[\]{}]/.test(text.charAt(at)) && !(text.charAt(at) === ':' && (key || /[\s,[\]{}]/.test(text.charAt(at + 1)) || at + 1 >= text.length))) at++;

				return text.substring(start, at).trim();
			}

			var result = item();

			return {Value: result, Next: j + 1};
		}

		/* A block scalar (| or >) after its header, its lines more indented than parent: {Value, Next}. */
		function block (k, header, parent) {
			var match = /^([|>])([-+]?)(\d?)([-+]?)\s*$/.exec(header);
			var keep;
			var indent;
			var body = [];
			var j;

			if (!match)
				throw fail(k + 1, 1, 'a block scalar header is | or >, with - or + and an indentation');

			keep = match[2] || match[4];
			indent = match[3] ? parent + Number(match[3]) : -1;

			for (j = k + 1; j < lines.length; j++) {
				var raw = lines[j];
				var lead = /^ */.exec(raw)[0].length;

				if (raw.trim() && indent === -1)
					indent = lead;

				if (raw.trim() && (lead < indent || lead <= parent)) break;

				body.push(raw.trim() ? raw.substring(indent) : raw.substring(Math.min(raw.length, indent < 0 ? raw.length : indent)));
			}

			var text;

			/* Folded: lines of the same indentation joined by a space; an empty line, or a more indented one, keeps its break. */
			if (match[1] === '>') {
				text = '';

				body.forEach(function (line, index) {
					var previous = body[index - 1];

					if (!index) text = line;
					else if (!line) text += '\n';
					else if (/^\s/.test(line) || previous === undefined || /^\s/.test(previous) || previous === '') text += (previous === '' ? '' : '\n') + line;
					else text += ' ' + line;
				});
			}
			else {
				text = body.join('\n');
			}

			var trailing = /\n*$/.exec(body.join('\n') + '\n')[0];

			text = text.replace(/\n+$/, '');

			if (keep === '+') text += trailing;
			else if (keep !== '-' && body.some(function (line) {
				return line;
			})) text += '\n';

			return {Value: text, Next: j};
		}

		/* The node whose first line is k, its indentation more than parent: {Value, Next}. */
		function node (k, parent) {
			while (k < lines.length && blank(line(k))) k++;

			if (k >= lines.length)
				return {Value: null, Next: k};

			var current = line(k);
			if (current.Indent <= parent)
				return {Value: null, Next: k};

			if (/^-(\s|$)/.test(current.Text))
				return sequence(k, current.Indent);

			if (/^\?\s/.test(current.Text))
				throw fail(current.Number, current.Indent + 1, 'complex keys (? ) are not supported');

			if (key(current.Text))
				return mapping(k, current.Indent);

			return value(k, current.Indent, current.Text, parent);
		}

		function line (k) {
			var raw = lines[k];
			var indent = /^ */.exec(raw)[0].length;

			return {Number: k + 1, Indent: indent, Text: raw.substring(indent)};
		}

		/* The key of a mapping line (key: value), or null: {Key, Rest, Column}. */
		function key (text) {
			var match;
			var quoted = /^("(?:\\.|[^"\\])*"|'(?:''|[^'])*')\s*:(?:\s+|$)/.exec(text);

			if (quoted) {
				return {Key: quoted[1].charAt(0) === '"' ? unescape(quoted[1].slice(1, -1), 0, 0) : quoted[1].slice(1, -1).replace(/''/g, '\''), Rest: text.substring(quoted[0].length), Column: quoted[0].length};
			}

			if (/^[[{"'|>&*!%@`]/.test(text) && !/^[&*!][^\s]*\s/.test(text)) return null;

			match = /^([^#:\s][^:#]*?|[^#\s]*:[^\s:][^:#]*?)\s*:(?:\s+|$)/.exec(uncomment(text));

			if (!match || /^-(\s|$)/.test(text)) return null;

			return {Key: match[1], Rest: uncomment(text).substring(match[0].length), Column: match[0].length};
		}

		/* A scalar or a flow collection that begins on line k at column (text): {Value, Next}. */
		function value (k, column, text, parent) {
			var body = uncomment(text);
			var current = line(k);
			var parts;
			var j;

			if (/^[|>]/.test(body))
				return block(k, body, parent);

			if (/^[[{]/.test(body))
				return flow(k, column);

			if (/^&[^\s]+\s+[[{]/.test(body)) {
				var anchor = /^&([^\s]+)\s+/.exec(body);
				var flowed = flow(k, column + anchor[0].length);

				anchors[anchor[1]] = flowed.Value;

				return flowed;
			}

			if (/^&[^\s]+\s*$/.test(body)) {
				var name = body.substring(1).trim();
				var nested = node(k + 1, parent);

				anchors[name] = nested.Value;

				return nested;
			}

			if (/^["']/.test(body)) {
				/* A quoted scalar may go on over more lines. */
				var quote = body.charAt(0);
				var joined = text;

				j = k;

				while (!closed(joined, quote) && j + 1 < lines.length) {
					j++;

					joined += '\n' + lines[j];
				}

				if (!closed(joined, quote))
					throw fail(current.Number, column + 1, 'a quoted scalar is not closed');

				var content = closing(joined, quote);
				var after = uncomment(joined.substring(content.End + 1)).trim();
				if (after)
					throw fail(j + 1, 1, 'nothing may follow a quoted scalar: ' + after);

				return {Value: quote === '"' ? unescape(fold(content.Text.split('\n')), current.Number, column + 1) : fold(content.Text.replace(/''/g, '\'').split('\n')), Next: j + 1};
			}

			/* A plain scalar: the more indented lines after it go on with it. */
			parts = [body];

			for (j = k + 1; j < lines.length; j++) {
				var next = line(j);

				if (!next.Text.trim()) {
					parts.push('');

					continue;
				}

				if (next.Indent <= parent || /^#/.test(next.Text) || key(next.Text) || /^-(\s|$)/.test(next.Text)) break;

				parts.push(uncomment(next.Text));
			}

			while (parts.length > 1 && !parts[parts.length - 1]) parts.pop();

			var joinedPlain = fold(parts);

			return {Value: anchored(joinedPlain, current.Number, column + 1, plain), Next: k + parts.length};
		}

		function closed (text, quote) {
			return closing(text, quote).End !== -1;
		}

		/* The text inside the quotes of a quoted scalar that starts text, and where it ends. */
		function closing (text, quote) {
			var k = 1;

			while (k < text.length) {
				var c = text.charAt(k);

				if (quote === '"' && c === '\\') {
					k += 2;

					continue;
				}

				if (c === quote) {
					if (quote === '\'' && text.charAt(k + 1) === '\'') {
						k += 2;

						continue;
					}

					return {Text: text.substring(1, k), End: k};
				}

				k++;
			}

			return {Text: '', End: -1};
		}

		function sequence (k, indent) {
			var list = [];

			while (k < lines.length) {
				var current = line(k);

				if (blank(current)) {
					k++;

					continue;
				}

				if (current.Indent < indent) break;

				if (current.Indent > indent)
					throw fail(current.Number, current.Indent + 1, 'a line more indented than its sequence');

				if (!/^-(\s|$)/.test(current.Text)) break;

				var rest = current.Text.substring(1).replace(/^\s+/, '');
				var column = indent + current.Text.length - rest.length;
				var result;

				if (!uncomment(rest).trim()) {
					result = node(k + 1, indent);
				}
				else if (/^-(\s|$)/.test(rest) || key(rest)) {
					/* - key: value, or - - item: a collection that starts on the line of its dash. */
					lines[k] = new Array(column + 1).join(' ') + rest;
					result = node(k, indent);
				}
				else {
					result = value(k, column, rest, indent);
				}

				list.push(result.Value);

				k = result.Next;
			}

			return {Value: list, Next: k};
		}

		function mapping (k, indent) {
			var map = {};
			var seen = {};

			while (k < lines.length) {
				var current = line(k);

				if (blank(current)) {
					k++;

					continue;
				}

				if (current.Indent < indent) break;

				if (current.Indent > indent)
					throw fail(current.Number, current.Indent + 1, 'a line more indented than its mapping');

				var pair = key(current.Text);

				if (!pair) {
					if (/^-(\s|$)/.test(current.Text)) break;

					throw fail(current.Number, current.Indent + 1, 'a key: value is expected');
				}

				var result;
				var column = indent + pair.Column;

				if (!pair.Rest.trim()) {
					/* The value on the lines under it: more indented, or a sequence as indented as its key. */
					var next = k + 1;

					while (next < lines.length && blank(line(next))) next++;

					if (next < lines.length && line(next).Indent === indent && /^-(\s|$)/.test(line(next).Text)) result = sequence(next, indent);
					else result = node(k + 1, indent);
				}
				else {
					result = value(k, column, current.Text.substring(pair.Column), indent);
				}

				if (pair.Key === '<<') {
					/* The merge key: the keys of a mapping (or of each of a list) that this one has not. */
					[].concat(result.Value).forEach(function (merged) {
						Object.keys(merged || {}).forEach(function (name) {
							if (!Object.prototype.hasOwnProperty.call(seen, name))
								map[name] = merged[name];
						});
					});
				}
				else {
					if (Object.prototype.hasOwnProperty.call(seen, pair.Key))
						throw fail(current.Number, current.Indent + 1, 'the key ' + pair.Key + ' is there twice');

					seen[pair.Key] = true;
					map[pair.Key] = result.Value;
				}

				k = result.Next;
			}

			return {Value: map, Next: k};
		}

		lines = source.split('\n');

		/* The documents: --- starts one (a node may follow on its line), ... ends one; directives (%) are read past. */
		var starts = [];
		var k;

		for (k = 0; k < lines.length; k++) {
			if (/^---(\s|$)/.test(lines[k]) || /^\.\.\.(\s|$)/.test(lines[k]) || /^%/.test(lines[k]))
				starts.push(k);
		}

		var from = 0;

		function finish (to) {
			var slice = lines.slice(from, to);
			var saved = lines;
			var result;
			var present = slice.some(function (raw) {
				return uncomment(raw.replace(/^\s+/, '')).trim();
			});
			if (!present) return;

			lines = new Array(from).concat(slice);
			anchors = {};
			result = node(from, -1);

			while (result.Next < lines.length && blank(line(result.Next))) result.Next++;

			if (result.Next < lines.length) {
				var stray = line(result.Next);

				throw fail(stray.Number, stray.Indent + 1, 'this line does not belong to the document: ' + stray.Text);
			}

			documents.push(result.Value);

			lines = saved;
		}

		starts.forEach(function (index) {
			finish(index);

			if (/^---\s+\S/.test(lines[index])) {
				/* A node on the line of --- (--- text, --- [a, b]). */
				lines[index] = '    ' + lines[index].substring(3).replace(/^\s+/, '');
				from = index;
			}
			else {
				from = index + 1;
			}
		});

		finish(lines.length);

		if (options.All)
			return documents;

		return documents.length ? documents[0] : null;
	},

	/* YAML of values, in block style. */
	YamlWrite: function (value, options) {
		var step = new Array((options.Indent || 2) + 1).join(' ');

		function scalar (item) {
			if (item === null || item === undefined) return 'null';
			if (typeof item === 'boolean') return String(item);

			if (typeof item === 'number')
				return isNaN(item) ? '.nan' : item === Infinity ? '.inf' : item === -Infinity ? '-.inf' : String(item);

			/* A text that would read as something else, or holds what YAML reads specially, is quoted. */
			var text = String(item);
			var special = !text || /^[\s\-?:,[\]{}#&*!|>'"%@`]|\s$|:\s|\s#|[\n\t]/.test(text);
			var word = /^(?:~|null|Null|NULL|true|True|TRUE|false|False|FALSE|yes|no|on|off)$/.test(text) || /^[-+]?\.(?:inf|nan)$/i.test(text);
			if (special || word || !isNaN(Number(text))) return JSON.stringify(text);

			return text;
		}

		function write (item, indent) {
			var pad = new Array(indent + 1).join(step);

			if (Array.isArray(item)) {
				if (!item.length) return ' []';

				return item.map(function (entry) {
					var inner = write(entry, indent + 1);

					if (entry && typeof entry === 'object' && !(entry instanceof Date) && Object.keys(entry).length) return '\n' + pad + '-' + inner.replace(/^\n[ ]*/, ' ');

					return '\n' + pad + '-' + inner;
				}).join('');
			}

			if (item && typeof item === 'object' && !(item instanceof Date)) {
				if (!Object.keys(item).length) return ' {}';

				return Object.keys(item).map(function (name) {
					return '\n' + pad + scalar(name) + ':' + write(item[name], indent + 1);
				}).join('');
			}

			if (typeof item === 'string' && /\n/.test(item)) {
				return ' |' + (/\n$/.test(item) ? '' : '-') + '\n' + item.replace(/\n$/, '').split('\n').map(function (part) {
					return part ? pad + part : '';
				}).join('\n');
			}

			return ' ' + (item instanceof Date ? item.toISOString() : scalar(item));
		}

		var text = write(value, 0);

		return (/^\n/.test(text) ? text.substring(1) : text.substring(1)) + '\n';
	},

	/* CSV or TSV: rows of cells, or objects by the header. */
	Csv: function (text, options, delimiter) {
		var separator = options.Delimiter || delimiter;
		var rows = [];
		var row = [];
		var cell = '';
		var quoted = false;
		var started = false;
		var i = 0;
		var header;
		var self = this;

		function end () {
			row.push(options.Types && !started ? self.Typed(cell) : cell);

			cell = '';
			started = false;
		}

		while (i < text.length) {
			var c = text.charAt(i);

			if (quoted) {
				if (c === '"' && text.charAt(i + 1) === '"') {
					cell += '"';
					i += 2;

					continue;
				}

				if (c === '"') {
					quoted = false;
					i++;

					continue;
				}

				cell += c;
				i++;

				continue;
			}

			if (c === '"' && !cell) {
				quoted = true;
				started = true;
				i++;

				continue;
			}

			if (c === separator) {
				end();

				i++;

				continue;
			}

			if (c === '\r' || c === '\n') {
				end();

				rows.push(row);

				row = [];
				i += c === '\r' && text.charAt(i + 1) === '\n' ? 2 : 1;

				continue;
			}

			cell += c;

			i++;
		}

		if (quoted)
			throw this.Fail('csv', text, text.length, 'a quoted cell is not closed');

		if (cell || row.length || started) {
			end();

			rows.push(row);
		}

		if (options.Header === false) return rows;

		header = (rows.shift() || []).map(String);

		return rows.map(function (cells) {
			var item = {};

			header.forEach(function (name, index) {
				item[name] = cells[index] === undefined ? '' : cells[index];
			});

			return item;
		});
	},

	/* A cell, an INI value: a number or a boolean when it reads as one. */
	Typed: function (text) {
		var value = String(text).trim();
		if (/^-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(value)) return Number(value);

		if (/^(?:true|false)$/i.test(value))
			return value.toLowerCase() === 'true';

		return text;
	},

	CsvWrite: function (value, options, delimiter) {
		var separator = options.Delimiter || delimiter;
		var rows = value || [];
		var header;

		function cell (item) {
			var text = item === null || item === undefined ? '' : String(item);

			return text.indexOf(separator) !== -1 || /["\r\n]/.test(text) || /^\s|\s$/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
		}

		if (rows.length && !Array.isArray(rows[0])) {
			header = options.Columns || rows.reduce(function (names, item) {
				Object.keys(item || {}).forEach(function (name) {
					if (names.indexOf(name) === -1)
						names.push(name);
				});

				return names;
			}, []);

			rows = [header].concat(rows.map(function (item) {
				return header.map(function (name) {
					return item[name];
				});
			}));
		}

		return rows.map(function (cells) {
			return cells.map(cell).join(separator);
		}).join('\r\n') + (rows.length ? '\r\n' : '');
	},

	Ini: function (text, options) {
		var self = this;
		var result = {};
		var section = result;
		var offset = 0;

		String(text).replace(/\r\n?/g, '\n').split('\n').forEach(function (raw) {
			var line = raw.trim();
			var match;

			offset += raw.length + 1;

			if (!line || /^[;#]/.test(line)) return;

			if ((match = /^\[([^\]]+)\]$/.exec(line))) {
				section = match[1].split('.').reduce(function (place, name) {
					name = name.trim();

					if (!place[name] || typeof place[name] !== 'object')
						place[name] = {};

					return place[name];
				}, result);

				return;
			}

			match = /^([^=:]+?)\s*[=:]\s*(.*)$/.exec(line);

			if (!match)
				throw self.Fail('ini', text, offset - raw.length - 1, 'a [section] or a key = value is expected');

			var value = match[2].replace(/\s+[;#].*$/, '');

			if (/^"(.*)"$/.test(value) || /^'(.*)'$/.test(value)) {
				value = value.slice(1, -1);
			}
			else if (options.Types !== false) {
				value = self.Typed(value);
			}

			section[match[1]] = value;
		});

		return result;
	},

	IniWrite: function (value) {
		var lines = [];

		function text (item) {
			var plain = String(item);

			return /^\s|\s$|[;#"]/.test(plain) ? JSON.stringify(plain) : plain;
		}

		function section (object, path) {
			var keys = Object.keys(object || {});
			var nested = [];

			keys.forEach(function (name) {
				if (object[name] && typeof object[name] === 'object') nested.push(name);
				else lines.push(name + ' = ' + text(object[name]));
			});

			nested.forEach(function (name) {
				lines.push('', '[' + path.concat([name]).join('.') + ']');

				section(object[name], path.concat([name]));
			});
		}

		section(value, []);

		return lines.join('\n').replace(/^\n/, '') + '\n';
	},

	Toml: function (text) {
		var self = this;
		var source = String(text).replace(/\r\n?/g, '\n');
		var result = {};
		var table = result;
		var defined = {};
		var at = 0;

		function fail (message) {
			return self.Fail('toml', source, at, message);
		}

		function space () {
			while (at < source.length && /[ \t]/.test(source.charAt(at))) at++;
		}

		/* Spaces, line breaks and comments (inside an array). */
		function gap () {
			while (at < source.length) {
				if (/[ \t\n]/.test(source.charAt(at))) {
					at++;
				}
				else if (source.charAt(at) === '#') {
					while (at < source.length && source.charAt(at) !== '\n') at++;
				}
				else {
					break;
				}
			}
		}

		function rest () {
			space();

			if (source.charAt(at) === '#') {
				while (at < source.length && source.charAt(at) !== '\n') at++;
			}

			if (at < source.length && source.charAt(at) !== '\n')
				throw fail('the line goes on after its value: ' + source.substring(at).split('\n')[0]);
		}

		function keyPart () {
			var c = source.charAt(at);
			var match;

			if (c === '"' || c === '\'') return string();

			match = /^[A-Za-z0-9_-]+/.exec(source.substring(at));

			if (!match)
				throw fail('a key is expected');

			at += match[0].length;

			return match[0];
		}

		/* A key with its dots: [part, ...]. */
		function key () {
			var parts = [keyPart()];

			space();

			while (source.charAt(at) === '.') {
				at++;

				space();

				parts.push(keyPart());

				space();
			}

			return parts;
		}

		function string () {
			var quote = source.charAt(at);
			var multi = source.substr(at, 3) === quote + quote + quote;
			var end;
			var body;

			if (multi) {
				at += 3;

				if (source.charAt(at) === '\n')
					at++;

				end = source.indexOf(quote + quote + quote, at);

				if (end === -1)
					throw fail('a multi-line string is not closed');

				/* Up to two quotes more belong to the string. */
				while (source.charAt(end + 3) === quote) end++;

				body = source.substring(at, end);
				at = end + 3;

				return quote === '"' ? escapes(body.replace(/\\\n\s*/g, '')) : body;
			}

			at++;
			end = at;

			while (end < source.length && source.charAt(end) !== quote && source.charAt(end) !== '\n') end += quote === '"' && source.charAt(end) === '\\' ? 2 : 1;

			if (source.charAt(end) !== quote)
				throw fail('a string is not closed');

			body = source.substring(at, end);
			at = end + 1;

			return quote === '"' ? escapes(body) : body;
		}

		function escapes (body) {
			return body.replace(/\\(u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/g, function (all, code) {
				var map = {b: '\b', t: '\t', n: '\n', f: '\f', r: '\r', '"': '"', '\\': '\\', e: '\x1b'};

				if (code.length > 1)
					return String.fromCharCode(parseInt(code.substring(1), 16));

				if (map[code] === undefined)
					throw fail('an unknown escape \\' + code);

				return map[code];
			});
		}

		function value () {
			var c = source.charAt(at);
			var match;
			var tail = source.substring(at);

			if (c === '"' || c === '\'') return string();

			if (c === '[') {
				var list = [];

				at++;

				gap();

				while (source.charAt(at) !== ']') {
					list.push(value());

					gap();

					if (source.charAt(at) === ',') {
						at++;

						gap();
					}
					else if (source.charAt(at) !== ']') {
						throw fail('a , or a ] is expected');
					}
				}

				at++;

				return list;
			}

			if (c === '{') {
				var inline = {};

				at++;

				space();

				while (source.charAt(at) !== '}') {
					var path = key();

					space();

					if (source.charAt(at) !== '=')
						throw fail('a = is expected');

					at++;

					space();

					put(inline, path, value());

					space();

					if (source.charAt(at) === ',') {
						at++;

						space();
					}
					else if (source.charAt(at) !== '}') {
						throw fail('a , or a } is expected');
					}
				}

				at++;

				return inline;
			}

			if ((match = /^(?:true|false)(?![A-Za-z0-9_-])/.exec(tail))) {
				at += match[0].length;

				return match[0] === 'true';
			}

			if ((match = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[-+]\d{2}:\d{2})?)?|^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?/.exec(tail))) {
				at += match[0].length;

				return match[0];
			}

			if ((match = /^[-+]?(?:inf|nan)/.exec(tail))) {
				at += match[0].length;

				return /nan/.test(match[0]) ? NaN : match[0].charAt(0) === '-' ? -Infinity : Infinity;
			}

			if ((match = /^0x[0-9a-fA-F_]+|^0o[0-7_]+|^0b[01_]+/.exec(tail))) {
				at += match[0].length;

				return parseInt(match[0].substring(2).replace(/_/g, ''), {x: 16, o: 8, b: 2}[match[0].charAt(1)]);
			}

			if ((match = /^[-+]?\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][-+]?\d[\d_]*)?/.exec(tail))) {
				at += match[0].length;

				return Number(match[0].replace(/_/g, ''));
			}

			throw fail('a value is expected');
		}

		/* A value at a dotted path of a table, its tables made on the way. */
		function put (place, path, item) {
			var last = path[path.length - 1];

			path.slice(0, -1).forEach(function (name) {
				if (place[name] === undefined)
					place[name] = {};

				if (typeof place[name] !== 'object' || Array.isArray(place[name]))
					throw fail('the key ' + name + ' is not a table');

				place = place[name];
			});

			if (Object.prototype.hasOwnProperty.call(place, last))
				throw fail('the key ' + path.join('.') + ' is there twice');

			place[last] = item;
		}

		/* The table at a header path (an array of tables: its last one; a new one with push). */
		function open (path, push) {
			var place = result;

			path.forEach(function (name, index) {
				var last = index === path.length - 1;

				if (last && push) {
					if (place[name] === undefined)
						place[name] = [];

					if (!Array.isArray(place[name]))
						throw fail('the key ' + name + ' is not an array of tables');

					place[name].push({});

					place = place[name][place[name].length - 1];

					return;
				}

				if (place[name] === undefined)
					place[name] = {};

				place = Array.isArray(place[name]) ? place[name][place[name].length - 1] : place[name];

				if (typeof place !== 'object')
					throw fail('the key ' + name + ' is not a table');
			});

			return place;
		}

		while (at < source.length) {
			gap();

			if (at >= source.length) break;

			if (source.charAt(at) === '[') {
				var push = source.charAt(at + 1) === '[';

				at += push ? 2 : 1;

				space();

				var header = key();

				space();

				if (source.substr(at, push ? 2 : 1) !== (push ? ']]' : ']'))
					throw fail('a table header is not closed');

				at += push ? 2 : 1;

				if (!push) {
					if (defined[header.join('.')])
						throw fail('the table ' + header.join('.') + ' is there twice');

					defined[header.join('.')] = true;
				}

				table = open(header, push);

				rest();

				continue;
			}

			var path = key();

			space();

			if (source.charAt(at) !== '=')
				throw fail('a = is expected after the key ' + path.join('.'));

			at++;

			space();

			put(table, path, value());

			rest();
		}

		return result;
	},

	TomlWrite: function (value) {
		var lines = [];

		function key (name) {
			return /^[A-Za-z0-9_-]+$/.test(name) ? name : JSON.stringify(name);
		}

		function item (entry) {
			if (typeof entry === 'string') return JSON.stringify(entry);

			if (typeof entry === 'number')
				return isNaN(entry) ? 'nan' : entry === Infinity ? 'inf' : entry === -Infinity ? '-inf' : String(entry);

			if (typeof entry === 'boolean') return String(entry);

			if (entry instanceof Date)
				return entry.toISOString();

			if (Array.isArray(entry))
				return '[' + entry.map(item).join(', ') + ']';

			if (entry && typeof entry === 'object') {
				return '{' + Object.keys(entry).map(function (name) {
					return key(name) + ' = ' + item(entry[name]);
				}).join(', ') + '}';
			}

			return '""';
		}

		function tables (list) {
			return Array.isArray(list) && list.length && list.every(function (entry) {
				return entry && typeof entry === 'object' && !Array.isArray(entry);
			});
		}

		function table (object, path) {
			var names = Object.keys(object || {});
			var later = [];

			names.forEach(function (name) {
				var entry = object[name];

				if ((entry && typeof entry === 'object' && !Array.isArray(entry) && !(entry instanceof Date)) || tables(entry)) later.push(name);
				else lines.push(key(name) + ' = ' + item(entry));
			});

			later.forEach(function (name) {
				var entry = object[name];
				var full = path.concat([key(name)]).join('.');

				if (Array.isArray(entry)) {
					entry.forEach(function (each) {
						lines.push('', '[[' + full + ']]');

						table(each, path.concat([key(name)]));
					});

					return;
				}

				lines.push('', '[' + full + ']');

				table(entry, path.concat([key(name)]));
			});
		}

		table(value, []);

		return lines.join('\n').replace(/^\n/, '') + '\n';
	},

	Xml: function (text) {
		var self = this;
		var source = String(text);
		var at = 0;
		var root = null;

		function fail (message) {
			return self.Fail('xml', source, at, message);
		}

		function entities (part) {
			return part.replace(/&(#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g, function (all, code) {
				var map = {lt: '<', gt: '>', amp: '&', quot: '"', apos: '\''};

				if (code.charAt(0) === '#')
					return String.fromCharCode(code.charAt(1) === 'x' ? parseInt(code.substring(2), 16) : parseInt(code.substring(1), 10));

				return map[code];
			});
		}

		/* What is not an element: a comment, a processing instruction, a doctype, read past. */
		function skip () {
			var end;

			while (true) {
				if (source.substr(at, 4) === '<!--') {
					end = source.indexOf('-->', at);

					if (end === -1)
						throw fail('a comment is not closed');

					at = end + 3;
				}
				else if (source.substr(at, 2) === '<?') {
					end = source.indexOf('?>', at);

					if (end === -1)
						throw fail('a processing instruction is not closed');

					at = end + 2;
				}
				else if (/^<!DOCTYPE/i.test(source.substr(at, 9))) {
					var depth = 0;

					for (end = at; end < source.length; end++) {
						if (source.charAt(end) === '[') depth++;
						else if (source.charAt(end) === ']') depth--;
						else if (source.charAt(end) === '>' && depth <= 0) break;
					}

					at = end + 1;
				}
				else {
					return;
				}
			}
		}

		function element () {
			var match = /^<([A-Za-z_][\w.:-]*)/.exec(source.substring(at));
			var node;

			if (!match)
				throw fail('an element is expected');

			node = {Name: match[1], Attributes: {}, Children: []};
			at += match[0].length;

			while (true) {
				var attribute = /^\s+([A-Za-z_][\w.:-]*)\s*=\s*("([^"]*)"|'([^']*)')/.exec(source.substring(at));
				if (!attribute) break;

				node.Attributes[attribute[1]] = entities(attribute[3] !== undefined ? attribute[3] : attribute[4]);

				at += attribute[0].length;
			}

			var close = /^\s*(\/?)>/.exec(source.substring(at));
			if (!close)
				throw fail('the tag <' + node.Name + '> is not closed');

			at += close[0].length;

			if (close[1]) return node;

			while (true) {
				var next = source.indexOf('<', at);
				if (next === -1)
					throw fail('the element <' + node.Name + '> is not closed');

				if (next > at)
					node.Children.push(entities(source.substring(at, next)));

				at = next;

				if (source.substr(at, 9) === '<![CDATA[') {
					var cdata = source.indexOf(']]>', at);
					if (cdata === -1)
						throw fail('a CDATA section is not closed');

					node.Children.push(source.substring(at + 9, cdata));

					at = cdata + 3;

					continue;
				}

				if (source.substr(at, 4) === '<!--' || source.substr(at, 2) === '<?') {
					skip();

					continue;
				}

				if (source.charAt(at + 1) === '/') {
					var end = /^<\/([A-Za-z_][\w.:-]*)\s*>/.exec(source.substring(at));
					if (!end || end[1] !== node.Name)
						throw fail('</' + node.Name + '> is expected');

					at += end[0].length;

					break;
				}

				node.Children.push(element());
			}

			/*
			 * Among elements, a text loses the white space around it (the indentation of the lines), and one of white
			 * space alone goes; the text alone of an element is kept as it is.
			 */
			if (node.Children.some(function (child) {
				return typeof child !== 'string';
			})) {
				node.Children = node.Children.map(function (child) {
					return typeof child === 'string' ? child.trim() : child;
				}).filter(function (child) {
					return child !== '';
				});
			}

			return node;
		}

		source = source.replace(/^\uFEFF/, '');

		while (/\s/.test(source.charAt(at))) at++;

		skip();

		while (/\s/.test(source.charAt(at))) at++;

		skip();

		while (/\s/.test(source.charAt(at))) at++;

		root = element();

		while (/\s/.test(source.charAt(at))) at++;

		skip();

		while (/\s/.test(source.charAt(at))) at++;

		if (at < source.length)
			throw fail('only one root element is allowed');

		return root;
	},

	XmlWrite: function (value, options) {
		var step = options.Indent === 0 ? '' : new Array((options.Indent || 2) + 1).join(' ');
		var breakLine = step ? '\n' : '';

		function escape (text, attribute) {
			var out = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

			return attribute ? out.replace(/"/g, '&quot;') : out;
		}

		function write (node, depth) {
			var pad = new Array(depth + 1).join(step);
			var attributes = Object.keys(node.Attributes || {}).map(function (name) {
				return ' ' + name + '="' + escape(node.Attributes[name], true) + '"';
			}).join('');
			var children = node.Children || [];
			if (!children.length)
				return pad + '<' + node.Name + attributes + '/>';

			if (children.every(function (child) {
				return typeof child === 'string';
			}))
				return pad + '<' + node.Name + attributes + '>' + escape(children.join('')) + '</' + node.Name + '>';

			return pad + '<' + node.Name + attributes + '>' + breakLine + children.map(function (child) {
				return typeof child === 'string' ? new Array(depth + 2).join(step) + escape(child.trim()) : write(child, depth + 1);
			}).join(breakLine) + breakLine + pad + '</' + node.Name + '>';
		}

		return (options.Declaration === false ? '' : '<?xml version="1.0" encoding="UTF-8"?>' + breakLine) + write(value, 0) + breakLine;
	},

	Query: function (text) {
		var result = {};

		String(text).replace(/^[?#]/, '').split('&').forEach(function (pair) {
			var at = pair.indexOf('=');
			var name;
			var value;
			var path;
			var place = result;

			if (!pair) return;

			name = decodeURIComponent((at === -1 ? pair : pair.substring(0, at)).replace(/\+/g, ' '));
			value = at === -1 ? '' : decodeURIComponent(pair.substring(at + 1).replace(/\+/g, ' '));
			path = [name.replace(/\[.*$/, '')].concat((name.match(/\[[^\]]*\]/g) || []).map(function (part) {
				return part.slice(1, -1);
			}));

			path.forEach(function (part, index) {
				var last = index === path.length - 1;
				var nextPart = path[index + 1];

				if (last) {
					if (part === '' && Array.isArray(place)) place.push(value);
					else if (Object.prototype.hasOwnProperty.call(place, part)) place[part] = [].concat(place[part], value);
					else place[part] = value;

					return;
				}

				if (place[part] === undefined)
					place[part] = nextPart === '' ? [] : {};

				place = place[part];
			});
		});

		return result;
	},

	QueryWrite: function (value) {
		var pairs = [];

		function add (prefix, item) {
			if (Array.isArray(item)) {
				item.forEach(function (entry) {
					if (entry && typeof entry === 'object') add(prefix + '[]', entry);
					else pairs.push(encodeURIComponent(prefix) + '=' + encodeURIComponent(entry == null ? '' : entry));
				});

				return;
			}

			if (item && typeof item === 'object') {
				Object.keys(item).forEach(function (name) {
					add(prefix ? prefix + '[' + name + ']' : name, item[name]);
				});

				return;
			}

			pairs.push(encodeURIComponent(prefix) + '=' + encodeURIComponent(item == null ? '' : item));
		}

		add('', value || {});

		return pairs.join('&').replace(/%5B/g, '[').replace(/%5D/g, ']');
	},

	Base64: function (text, options) {
		var clean = String(text).replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
		var binary;
		var bytes;
		var i;

		while (clean.length % 4) clean += '=';

		if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean))
			throw this.Fail('base64', text, 0, 'not a text of Base64');

		binary = atob(clean);
		bytes = new Uint8Array(binary.length);

		for (i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

		if (options.Bytes) return bytes;

		return typeof TextDecoder === 'function' ? new TextDecoder().decode(bytes) : decodeURIComponent(escape(binary));
	},

	Base64Write: function (value, options) {
		var bytes;
		var binary = '';
		var i;
		var text;

		if (value instanceof ArrayBuffer) bytes = new Uint8Array(value);
		else if (value && value.buffer instanceof ArrayBuffer && typeof value.byteLength === 'number') bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
		else bytes = typeof TextEncoder === 'function' ? new TextEncoder().encode(String(value == null ? '' : value)) : null;

		if (bytes) {
			for (i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
		}
		else {
			binary = unescape(encodeURIComponent(String(value)));
		}

		text = btoa(binary);

		return options.Url ? text.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : text;
	}
});
