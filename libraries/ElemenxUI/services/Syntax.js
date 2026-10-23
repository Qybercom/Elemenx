/*
 * The highlighting of source code: the grammars of the languages and the tokens of a text in one of them. Built in:
 * javascript (js, mjs, cjs, jsx), typescript (ts, tsx), json, html (xml, svg), css, markdown (md), sql, python (py)
 * and shell (sh, bash, zsh); text has no rules. Used by CodeEditor; any component may show highlighted code with it.
 * - Register(name, grammar) adds a language (or replaces one): {Aliases, Rules, Comment, Indent}. Rules are
 *   [Type, RegExp, Options]: the first rule that matches nearest wins (a rule must not match empty text). Type is the
 *   class of the token (elemenx-syntax-<Type>; null for plain text). Options: Inside (a language name, or a
 *   function (match) returning one: the match is read in that language) or Groups (the types of the capture groups,
 *   which follow each other and cover the match; a group may be {Inside}). Comment: {Line: '//'} or {Block: ['<!--',
 *   '-->']} for the comment command of an editor. Indent: a RegExp of the text before a line break that indents the
 *   next line one more step.
 * - Find(name) returns the grammar of a language or of an alias (null when there is none); Languages() the names.
 * - Tokens(text, language) returns [{Type, Text}] covering the text; Lines(text, language) the same split into
 *   lines (a token never holds a line break); HTML(text, language) escaped markup with a span for each token.
 */
Elemenx.Service('Syntax', {
	$Meta: {
		Description: 'The highlighting of source code: the grammars of the languages and the tokens of a text in one of them.',
		Methods: ['Register(name, grammar)', 'Find(name)', 'Languages()', 'Tokens(text, language)', 'Lines(text, language)', 'HTML(text, language)']
	},
	$OnCreate: function () {
		var self = this;
		var keywords = 'break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static switch throw try typeof var void while with yield async await get set';
		var script = [
			['comment', /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/],
			['string', /`(?:\\[\s\S]|[^\\`])*`?/],
			['string', /'(?:\\.|[^\\'\n])*'?|"(?:\\.|[^\\"\n])*"?/],
			[null, /([=(,:;!&|?{}[\]]\s*|^\s*|\breturn\s+|\btypeof\s+)(\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n[])+\/[dgimsuy]*)/m, {Groups: ['punctuation', 'regex']}],
			['number', /\b(?:0[xX][\da-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?\d+)?n?)\b|\.\d[\d_]*(?:[eE][+-]?\d+)?\b/],
			['literal', /\b(?:true|false|null|undefined|NaN|Infinity|this|super)\b/],
			['meta', /@[\w$.]+/]
		];

		this.Grammars = {};
		this.Aliases = {};

		function words (list) {
			return new RegExp('\\b(?:' + list.split(' ').join('|') + ')\\b');
		}

		/* The rules after the ones every script language shares: its keywords, types, calls and operators. */
		function scriptRules (extra, types) {
			return script.concat([
				['keyword', words(keywords + (extra ? ' ' + extra : ''))],
				['type', types ? new RegExp('\\b(?:' + types.split(' ').join('|') + ')\\b|\\b[A-Z][\\w$]*\\b') : /\b[A-Z][\w$]*\b/],
				['function', /[A-Za-z_$][\w$]*(?=\s*\()/],
				['operator', /=>|[-+*/%=&|^~!<>?]+|\.{3}/],
				['punctuation', /[{}[\]();,.:]/]
			]);
		}

		this.Register('text', {Rules: []});

		this.Register('javascript', {
			Aliases: ['js', 'mjs', 'cjs', 'jsx'],
			Comment: {Line: '//'},
			Indent: /[{[(]\s*$/,
			Rules: scriptRules()
		});

		this.Register('typescript', {
			Aliases: ['ts', 'tsx'],
			Comment: {Line: '//'},
			Indent: /[{[(]\s*$/,
			Rules: scriptRules('abstract as declare enum implements interface keyof namespace private protected public readonly satisfies type infer is', 'any boolean never number object string symbol unknown void bigint')
		});

		this.Register('json', {
			Aliases: ['jsonc'],
			Comment: {Line: '//'},
			Indent: /[{[]\s*$/,
			Rules: [
				['comment', /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/],
				['property', /"(?:\\.|[^\\"\n])*"(?=\s*:)/],
				['string', /"(?:\\.|[^\\"\n])*"?/],
				['number', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
				['literal', /\b(?:true|false|null)\b/],
				['punctuation', /[{}[\],:]/]
			]
		});

		this.Register('css', {
			Aliases: ['scss', 'less'],
			Comment: {Block: ['/*', '*/']},
			Indent: /\{\s*$/,
			Rules: [
				['comment', /\/\*[\s\S]*?(?:\*\/|$)/],
				['string', /'(?:\\.|[^\\'\n])*'?|"(?:\\.|[^\\"\n])*"?/],
				['keyword', /@[\w-]+|!important\b/],
				['selector', /[^{};@/\s][^{};@/]*(?=\{)/],
				['property', /--[\w-]+|[\w-]+(?=\s*:)/],
				['function', /[\w-]+(?=\()/],
				['number', /#[\da-fA-F]{3,8}\b|-?(?:\d*\.)?\d+(?:%|[a-zA-Z]+\b)?/],
				['punctuation', /[{}();:,]/]
			]
		});

		/* The inside of a tag of html: its name, its attributes and their values. */
		this.Register('html-tag', {
			Rules: [
				['tag', /^<\/?[^\s>/]*|\/?>$/],
				['string', /"[^"]*"?|'[^']*'?/],
				['attribute', /[^\s"'>/=]+/],
				['punctuation', /=/]
			]
		});

		this.Register('html', {
			Aliases: ['xml', 'svg', 'htm'],
			Comment: {Block: ['<!--', '-->']},
			Indent: /<(?!\/|!|(?:area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)\b)[^>]*[^/]>\s*$/i,
			Rules: [
				['comment', /<!--[\s\S]*?(?:-->|$)/],
				['meta', /<![^>]*>?|<\?[\s\S]*?(?:\?>|$)/],
				[null, /(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>|$)/i, {Groups: [{Inside: 'html-tag'}, {Inside: 'javascript'}, {Inside: 'html-tag'}]}],
				[null, /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>|$)/i, {Groups: [{Inside: 'html-tag'}, {Inside: 'css'}, {Inside: 'html-tag'}]}],
				[null, /<\/?[A-Za-z][^\s>/]*(?:\s+[^\s>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>/, {Inside: 'html-tag'}],
				[null, /(\{\{)([\s\S]*?)(\}\}|$)/, {Groups: ['punctuation', {Inside: 'javascript'}, 'punctuation']}],
				['literal', /&(?:#\d+|#x[\da-fA-F]+|\w+);/]
			]
		});

		this.Register('markdown', {
			Aliases: ['md'],
			Comment: {Block: ['<!--', '-->']},
			Rules: [
				[null, /^(```|~~~)([^\n]*\n)([\s\S]*?)(^\1[^\n]*$|(?![\s\S]))/m, {Groups: ['punctuation', 'meta', {Inside: function (match) {
					return match[2].trim().split(/\s/)[0] || 'text';
				}}, 'punctuation']}],
				['comment', /<!--[\s\S]*?(?:-->|$)/],
				['heading', /^#{1,6}[ \t][^\n]*|^[^\n]+\n(?:=+|-+)[ \t]*$/m],
				['comment', /^>[^\n]*/m],
				['punctuation', /^[ \t]*(?:[-*+]|\d+[.)])(?=[ \t])|^(?:[-*_][ \t]*){3,}$/m],
				['code', /`[^`\n]+`/],
				['strong', /\*\*[^*\n]+\*\*|__[^_\n]+__/],
				['emphasis', /\*[^*\s][^*\n]*\*|\b_[^_\n]+_\b/],
				['link', /!?\[[^\]\n]*\](?:\([^)\n]*\)|\[[^\]\n]*\])|<https?:\/\/[^>\s]+>/]
			]
		});

		this.Register('sql', {
			Comment: {Line: '--'},
			Indent: /\(\s*$/,
			Rules: [
				['comment', /--[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/],
				['string', /'(?:''|[^'])*'?/],
				['property', /"(?:""|[^"])*"?|`[^`]*`?|\[[^\]\n]*\]/],
				['number', /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
				['keyword', /\b(?:add|all|alter|and|any|as|asc|begin|between|by|case|cascade|check|column|commit|constraint|create|cross|database|default|delete|desc|distinct|drop|else|end|exists|foreign|from|full|grant|group|having|if|in|index|inner|insert|intersect|into|is|join|key|left|like|limit|not|null|offset|on|or|order|outer|over|partition|primary|procedure|references|replace|returning|revoke|right|rollback|select|set|table|then|top|transaction|trigger|truncate|union|unique|update|using|values|view|when|where|with)\b/i],
				['type', /\b(?:bigint|binary|bit|blob|boolean|char|date|datetime|decimal|double|float|int|integer|interval|json|jsonb|money|numeric|real|serial|smallint|text|time|timestamp|uuid|varchar)\b/i],
				['literal', /\b(?:true|false)\b/i],
				['function', /[A-Za-z_][\w]*(?=\s*\()/],
				['variable', /[@:$][A-Za-z_]\w*|\?/],
				['operator', /[-+*/%=<>!|&^~]+/],
				['punctuation', /[(),;.]/]
			]
		});

		this.Register('python', {
			Aliases: ['py'],
			Comment: {Line: '#'},
			Indent: /[:{[(]\s*$/,
			Rules: [
				['comment', /#[^\n]*/],
				['string', /(?:[rRbBuUfF]{1,2})?("""|''')[\s\S]*?(?:\1|$(?![\s\S]))/],
				['string', /(?:[rRbBuUfF]{1,2})?(?:'(?:\\.|[^\\'\n])*'?|"(?:\\.|[^\\"\n])*"?)/],
				['meta', /^[ \t]*@[\w.]+/m],
				['number', /\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?\d+)?j?)\b|\.\d+\b/],
				['keyword', words('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case')],
				['literal', /\b(?:True|False|None|self|cls)\b/],
				['type', /\b(?:int|float|str|bool|bytes|list|dict|set|tuple|object|type)\b|\b[A-Z]\w*\b/],
				['function', /[A-Za-z_]\w*(?=\s*\()/],
				['operator', /->|[-+*/%=&|^~<>!@]+/],
				['punctuation', /[{}[\]();,.:]/]
			]
		});

		this.Register('shell', {
			Aliases: ['sh', 'bash', 'zsh', 'console'],
			Comment: {Line: '#'},
			Indent: /(?:\bthen|\bdo|\{|\()\s*$/,
			Rules: [
				['comment', /(?:^|[ \t])#[^\n]*/m],
				['string', /'[^']*'?/],
				['string', /"(?:\\[\s\S]|[^\\"])*"?/],
				['variable', /\$(?:\{[^}\n]*\}?|\(\(?|[A-Za-z_]\w*|[@#?$!*0-9-])/],
				['keyword', words('if then else elif fi for in do done while until case esac function return export local readonly declare unset shift break continue exit source alias')],
				['attribute', /(?:^|\s)--?[A-Za-z][\w-]*/m],
				['number', /\b\d+\b/],
				['operator', /&&|\|\||[|&;<>]+|=/]
			]
		});

		/* The tokens of text in a grammar, pushed on result; plain text between them is a token of type null. */
		this.Read = function (text, grammar, result) {
			var rules = grammar ? grammar.Rules : [];
			var cache = [];
			var position = 0;
			var best;
			var chosen;
			var i;
			var match;

			while (position < text.length) {
				best = null;
				chosen = -1;
				i = 0;

				while (i < rules.length) {
					match = cache[i];

					if (match === undefined || match && match.index < position) {
						rules[i].Pattern.lastIndex = position;

						match = rules[i].Pattern.exec(text);

						if (match && !match[0])
							match = null;

						cache[i] = match;
					}

					if (match && (!best || match.index < best.index)) {
						best = match;
						chosen = i;
					}

					i++;
				}

				if (!best) break;

				if (best.index > position)
					self.Push(result, null, text.substring(position, best.index));

				self.Emit(best, rules[chosen], result);

				position = best.index + best[0].length;
			}

			if (position < text.length)
				self.Push(result, null, text.substring(position));

			return result;
		};

		/* The tokens of a match of a rule. */
		this.Emit = function (match, rule, result) {
			var groups = rule.Options && rule.Options.Groups;
			var inside = rule.Options && rule.Options.Inside;
			var i = 0;
			var part;

			if (groups) {
				while (i < groups.length) {
					part = match[i + 1] || '';

					if (part && groups[i] && groups[i].Inside) self.Read(part, self.Find(typeof groups[i].Inside === 'function' ? groups[i].Inside(match) : groups[i].Inside), result);
					else if (part) self.Push(result, groups[i] || null, part);

					i++;
				}

				return;
			}

			if (inside) {
				self.Read(match[0], self.Find(typeof inside === 'function' ? inside(match) : inside), result);

				return;
			}

			self.Push(result, rule.Type, match[0]);
		};

		/* Adds a token, joined to the last one when it has the same type. */
		this.Push = function (result, type, text) {
			var last = result[result.length - 1];

			if (last && last.Type === type) last.Text += text;
			else result.push({Type: type, Text: text});
		};
	},

	Register: function (name, grammar) {
		var self = this;
		var key = String(name).toLowerCase();
		var rules = (grammar.Rules || []).map(function (rule) {
			var pattern = rule[1];
			var flags = 'g' + (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : '');

			return {Type: rule[0] || null, Pattern: new RegExp(pattern.source, flags), Options: rule[2] || null};
		});

		this.Grammars[key] = {Name: key, Rules: rules, Comment: grammar.Comment || null, Indent: grammar.Indent || null};

		(grammar.Aliases || []).forEach(function (alias) {
			self.Aliases[String(alias).toLowerCase()] = key;
		});

		return this;
	},

	Find: function (name) {
		var key = String(name || 'text').toLowerCase();

		return this.Grammars[key] || this.Grammars[this.Aliases[key]] || null;
	},

	Languages: function () {
		return Object.keys(this.Grammars).filter(function (name) {
			return name !== 'html-tag';
		});
	},

	Tokens: function (text, language) {
		return this.Read(String(text == null ? '' : text), this.Find(language), []);
	},

	Lines: function (text, language) {
		var lines = [[]];
		var self = this;

		this.Tokens(text, language).forEach(function (token) {
			var parts = token.Text.split('\n');
			var i = 0;

			while (i < parts.length) {
				if (i > 0)
					lines.push([]);

				if (parts[i])
					self.Push(lines[lines.length - 1], token.Type, parts[i]);

				i++;
			}
		});

		return lines;
	},

	HTML: function (text, language) {
		return this.Tokens(text, language).map(function (token) {
			var escaped = token.Text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

			return token.Type ? '<span class="elemenx-syntax-' + token.Type + '">' + escaped + '</span>' : escaped;
		}).join('');
	}
});
