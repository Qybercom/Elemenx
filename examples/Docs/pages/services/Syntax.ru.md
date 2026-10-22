<!-- generated -->
# Syntax

Подсветка исходного кода: грамматики языков и токены текста на одном из них. Встроены: javascript (js, mjs, cjs, jsx), typescript (ts, tsx), json, html (xml, svg), css, markdown (md), sql, python (py) и shell (sh, bash, zsh); у text правил нет. Используется CodeEditor; любой компонент может показывать с её помощью подсвеченный код.

- Register(name, grammar) добавляет язык (или заменяет): {Aliases, Rules, Comment, Indent}. Rules — [Type, RegExp, Options]: побеждает первое правило с ближайшим совпадением (правило не должно совпадать с пустым текстом). Type — класс токена (elemenx-syntax-<Type>; null для простого текста). Options: Inside (имя языка или функция (match), возвращающая его: совпадение читается на этом языке) или Groups (типы групп захвата, которые идут друг за другом и покрывают совпадение; группа может быть {Inside}). Comment: {Line: '//'} или {Block: ['<!--', '-->']} для команды комментирования редактора. Indent: RegExp текста перед переносом строки, после которого следующая строка получает отступ на шаг больше.
- Find(name) возвращает грамматику языка или псевдонима (null, если её нет); Languages() — имена.
- Tokens(text, language) возвращает [{Type, Text}], покрывающие текст; Lines(text, language) — то же, разбитое на строки (токен никогда не содержит перенос строки); HTML(text, language) — экранированная разметка со span на каждый токен.

## Методы

- `Register(name, grammar)`
- `Find(name)`
- `Languages()`
- `Tokens(text, language)`
- `Lines(text, language)`
- `HTML(text, language)`

## Пример

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
