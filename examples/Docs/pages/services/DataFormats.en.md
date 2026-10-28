<!-- generated -->
# DataFormats

The formats of data and of files: a text read into values and values written into a text, by the name of a format.

- Parse(name, text, options) the values of a text; Stringify(name, value, options) the text of values. A text a format cannot read throws an Error that names the place: its Line and Column (from 1), in its message too.
- Register(name, format) adds a format of the Application (or replaces one): {Parse(text, options), Stringify(value, options), Extensions: ['.ext'], Mime, Label}. Find(name) returns one, Names() lists them, For(file) the name of the format of a file name (by its extension) or of a type of MIME, or null.

Built in, with their options:

- json: Indent (2) for Stringify; jsonc reads comments and trailing commas too.
- yaml (yml), YAML 1.2 of the core schema: block and flow collections, plain, quoted and block scalars (| and >, with - and +), comments, anchors and aliases (&a, *a), the merge key <<, several documents (---: All gives them all). No tags (!!str) and no complex keys (? ). Stringify writes block style, Indent (2).
- csv and tsv: Header (true: objects by the names of the first row; false: rows of cells), Delimiter (, or a tab), Types (true: numbers and booleans read as such). Stringify takes rows or objects (their keys the header).
- ini: [sections] (with dots: nested), key = value or key: value, ; and # comments, Types (true).
- toml (TOML 1.0): tables, arrays of tables, dotted keys, strings (basic, literal, multi-line), integers (with _, 0x, 0o, 0b), floats (inf, nan), booleans, dates and times (as their text), arrays and inline tables.
- xml: an element as {Name, Attributes, Children} (a text is a string among the Children, its spaces around it gone when elements are beside it); comments, processing instructions and the doctype are left out, CDATA is text. Stringify: Indent (2), Declaration (true).
- query: a=1&b=2&b=3&c[d]=4 as {a: '1', b: ['2', '3'], c: {d: '4'}} (a[] adds to a list); Stringify the other way.
- base64: Parse gives the text (UTF-8), Bytes true a Uint8Array; Stringify takes a text, a Uint8Array or an ArrayBuffer; Url true is the variant for addresses (- and _, no =).

## Methods

- `Register(name, format)`
- `Find(name)`
- `Names()`
- `For(file)`
- `Parse(name, text, options)`
- `Stringify(name, value, options)`

## Example

```example
<div class="docs-stack">
	<div class="docs-row">
		<Select Label="From" [value]="From" [options]="Names" (change)="Source" />
		<Select Label="To" [value]="To" [options]="Names" (change)="Target" />
	</div>
	<CodeEditor [language]="From" [value]="Text" Rows="10" (input)="Typed" />
	<p class="elemenx-text small" [class.danger]="!!Problem">{{Problem || 'Edit the text: it is read in the first format and written in the second.'}}</p>
	<CodeView [language]="To === 'query' || To === 'base64' ? 'text' : To" [value]="Output" />
</div>
<script>
(function () {
	var samples = {
		yaml: 'name: Elemenx\nversion: 0.11\ntags: [ui, es5]\nauthor:\n  name: Ada\n  langs:\n    - en\n    - ru\n',
		json: '{\n  "name": "Elemenx",\n  "tags": ["ui", "es5"],\n  "author": {"name": "Ada"}\n}',
		toml: 'name = "Elemenx"\ntags = ["ui", "es5"]\n\n[author]\nname = "Ada"\n',
		ini: 'name = Elemenx\n\n[author]\nname = Ada\n',
		xml: '<book lang="en">\n  <title>Elemenx</title>\n  <author>Ada</author>\n</book>\n',
		csv: 'name,age\nAda,36\nAlan,41\n',
		query: 'name=Elemenx&tags[]=ui&tags[]=es5'
	};

	return {
		From: 'yaml',
		To: 'json',
		Text: samples.yaml,
		Output: '',
		Problem: '',
		Names: ['yaml', 'json', 'toml', 'ini', 'xml', 'csv', 'query', 'base64'].map(function (name) {
			return {Value: name, Label: name.toUpperCase()};
		}),

		$OnCreate: function () {
			this.Convert();
		},

		/* The text read in its format, written in the other one; what cannot be read is named with its line. */
		Convert: function () {
			var formats = this.$Service('DataFormats');

			try {
				this.Output = formats.Stringify(this.To, formats.Parse(this.From, this.Text));
				this.Problem = '';
			}
			catch (error) {
				this.Problem = error.message;
			}
		},

		Source: function (name) {
			this.From = name;
			this.Text = samples[name] || this.Text;
			this.Convert();
		},

		Target: function (name) {
			this.To = name;
			this.Convert();
		},

		Typed: function (text) {
			this.Text = text;
			this.Convert();
		}
	};
})()
</script>
```

## Tests

- [names its formats, finds the one of a file or a type, takes formats of its own and refuses an unknown one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/data-formats.test.js#L28) — `tests/regression/data-formats.test.js`
- [reads YAML: mappings, sequences, flow collections, scalars of the core schema, block scalars, anchors and merges](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/data-formats.test.js#L53) — `tests/regression/data-formats.test.js`
- [names the line and the column of what YAML cannot read](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/data-formats.test.js#L127) — `tests/regression/data-formats.test.js`
- [writes YAML that reads back as the same values](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/data-formats.test.js#L139) — `tests/regression/data-formats.test.js`
- [reads JSON and JSON with comments, naming the place of an error](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/data-formats.test.js#L157) — `tests/regression/data-formats.test.js`
- [reads and writes CSV and TSV: quotes, the header, the types](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/data-formats.test.js#L170) — `tests/regression/data-formats.test.js`
- [reads and writes INI: sections, nested by dots, comments and types](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/data-formats.test.js#L182) — `tests/regression/data-formats.test.js`
- [reads and writes TOML: tables, arrays of tables, dotted keys, strings, numbers, dates and inline tables](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/data-formats.test.js#L190) — `tests/regression/data-formats.test.js`
- [reads and writes XML as elements of {Name, Attributes, Children}](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/data-formats.test.js#L230) — `tests/regression/data-formats.test.js`
- [reads and writes query strings with lists and nested names, and Base64 of texts and bytes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/data-formats.test.js#L245) — `tests/regression/data-formats.test.js`
