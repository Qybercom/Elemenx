<!-- generated -->
# DataFormats

Форматы данных и файлов: текст, прочитанный в значения, и значения, записанные в текст, по имени формата.
- Parse(name, text, options) — значения текста; Stringify(name, value, options) — текст значений. Текст, который формат не может прочитать, выбрасывает Error с местом ошибки: Line и Column (с 1), они же в сообщении.
- Register(name, format) добавляет формат приложения (или заменяет): {Parse(text, options), Stringify(value, options), Extensions: ['.ext'], Mime, Label}. Find(name) возвращает формат, Names() перечисляет их, For(file) — имя формата по имени файла (по расширению) или по типу MIME, либо null.
Встроенные, с их параметрами:
- json: Indent (2) для Stringify; jsonc читает ещё комментарии и запятые перед закрывающей скобкой.
- yaml (yml), YAML 1.2 базовой схемы: блочные и flow-коллекции, простые, кавычечные и блочные скаляры (| и >, с - и +), комментарии, якоря и ссылки (&a, *a), ключ слияния <<, несколько документов (---: All отдаёт их все). Без тегов (!!str) и сложных ключей (? ). Stringify пишет в блочном стиле, Indent (2).
- csv и tsv: Header (true — объекты по именам первой строки; false — строки ячеек), Delimiter (, или табуляция), Types (true — числа и логические значения читаются как таковые). Stringify принимает строки или объекты (их ключи — заголовок).
- ini: [разделы] (с точками — вложенные), key = value или key: value, комментарии ; и #, Types (true).
- toml (TOML 1.0): таблицы, массивы таблиц, ключи с точками, строки (обычные, литеральные, многострочные), целые (с _, 0x, 0o, 0b), дробные (inf, nan), логические, даты и время (их текстом), массивы и встроенные таблицы.
- xml: элемент как {Name, Attributes, Children} (текст — строка среди Children, без пробелов по краям, если рядом есть элементы); комментарии, инструкции обработки и doctype пропускаются, CDATA — текст. Stringify: Indent (2), Declaration (true).
- query: a=1&b=2&b=3&c[d]=4 как {a: '1', b: ['2', '3'], c: {d: '4'}} (a[] добавляет в список); Stringify — обратно.
- base64: Parse отдаёт текст (UTF-8), Bytes true — Uint8Array; Stringify принимает текст, Uint8Array или ArrayBuffer; Url true — вариант для адресов (- и _, без =).

## Методы

- `Register(name, format)`
- `Find(name)`
- `Names()`
- `For(file)`
- `Parse(name, text, options)`
- `Stringify(name, value, options)`

## Пример

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

## Тесты

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
