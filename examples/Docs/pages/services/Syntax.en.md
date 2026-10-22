<!-- generated -->
# Syntax

The highlighting of source code: the grammars of the languages and the tokens of a text in one of them. Built in: javascript (js, mjs, cjs, jsx), typescript (ts, tsx), json, html (xml, svg), css, markdown (md), sql, python (py) and shell (sh, bash, zsh); text has no rules. Used by CodeEditor; any component may show highlighted code with it.

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
