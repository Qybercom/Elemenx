<!-- generated -->
# Syntax

The highlighting of source code: the grammars of the languages and the tokens of a text in one of them. Built in: javascript (js, mjs, cjs, jsx), typescript (ts, tsx), json, html (xml, svg), css, markdown (md), sql, python (py), shell (sh, bash, zsh), yaml (yml), toml, ini (cfg, conf, properties, env) and csv (tsv); text has no rules. Used by CodeEditor; any component may show highlighted code with it.

- Register(name, grammar) adds a language (or replaces one): {Aliases, Rules, Comment, Indent}. Rules are [Type, RegExp, Options]: the first rule that matches nearest wins (a rule must not match empty text). Type is the class of the token (elemenx-syntax-<Type>; null for plain text). Options: Inside (a language name, or a function (match) returning one: the match is read in that language) or Groups (the types of the capture groups, which follow each other and cover the match; a group may be {Inside}). Comment: {Line: '//'} or {Block: ['<!--', '-->']} for the comment command of an editor. Indent: a RegExp of the text before a line break that indents the next line one more step.
- Find(name) returns the grammar of a language or of an alias (null when there is none); Languages() the names.
- Tokens(text, language) returns [{Type, Text}] covering the text; Lines(text, language) the same split into lines (a token never holds a line break); HTML(text, language) escaped markup with a span for each token.

## Methods

- `Register(name, grammar)`
- `Find(name)`
- `Languages()`
- `Tokens(text, language)`
- `Lines(text, language)`
- `HTML(text, language)`

## Example

```example
<Select [options]="Languages" [value]="Language" (change)="Chose" />
<pre class="elemenx-code" [property.innerHTML]="Html(Sample, Language)"></pre>
<p class="elemenx-text small muted">{{Count(Sample, Language)}} tokens</p>
<script>
({
	Language: 'javascript',
	Sample: "// A sum\nfunction add (a, b) {\n\treturn a + b * 2; /* twice */\n}\n",
	Languages: [{Value: 'javascript', Label: 'JavaScript'}, {Value: 'python', Label: 'Python'}, {Value: 'sql', Label: 'SQL'}],
	Samples: {
		javascript: "// A sum\nfunction add (a, b) {\n\treturn a + b * 2; /* twice */\n}\n",
		python: "def add(a, b):\n\t\"\"\"A sum.\"\"\"\n\treturn a + b * 2  # twice\n",
		sql: "SELECT name, COUNT(*) AS orders\nFROM users\nWHERE active = 1\nGROUP BY name;\n"
	},

	$OnCreate: function () {
		var syntax = this.$Service('Syntax');

		this.Html = function (text, language) {
			return syntax.HTML(text, language);
		};

		this.Count = function (text, language) {
			return syntax.Tokens(text, language).length;
		};
	},

	Chose: function (value) {
		this.Language = value;
		this.Sample = this.Samples[value];
	}
})
</script>
```

## Tests

- [covers the whole text with its tokens in every language](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/syntax.test.js#L40) — `tests/regression/syntax.test.js`
- [reads YAML, TOML, INI and CSV: their keys, sections, strings, numbers, anchors and comments](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/syntax.test.js#L61) — `tests/regression/syntax.test.js`
- [reads JavaScript: comments, strings, regular expressions, numbers, keywords and calls](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/syntax.test.js#L97) — `tests/regression/syntax.test.js`
- [reads a block comment and a string left open up to the end, as they are typed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/syntax.test.js#L113) — `tests/regression/syntax.test.js`
- [reads the script and the style of HTML in their languages, and the tags and attributes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/syntax.test.js#L118) — `tests/regression/syntax.test.js`
- [reads the code of a fenced block of Markdown in the language it names](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/syntax.test.js#L129) — `tests/regression/syntax.test.js`
- [splits the tokens into lines, one array for each line](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/syntax.test.js#L137) — `tests/regression/syntax.test.js`
- [escapes the HTML it returns](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/syntax.test.js#L146) — `tests/regression/syntax.test.js`
- [finds languages by their aliases and takes new ones](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/syntax.test.js#L151) — `tests/regression/syntax.test.js`
