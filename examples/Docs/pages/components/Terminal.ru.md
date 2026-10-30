<!-- generated -->
# Terminal

Терминал: прокручиваемый вывод над командной строкой. Lines: [{ID, Kind, Text}], где Kind — input, output, error, info или success. Enter отправляет command с текстом; стрелки вверх и вниз листают историю этого терминала; Ctrl+L отправляет clear. Busy делает командную строку только для чтения: она сохраняет фокус, так что следующая команда может последовать сразу. Слоты: actions (в строке заголовка, показанной при Title или actions). Вывод следует за новыми строками, пока читатель в его конце. Mod+F (или Ctrl+Shift+F) ищет в выводе: FindBar под заголовком помечает совпадения (сервис Find) и переходит от одного к другому; Escape закрывает его.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Lines` | `[]` |
| `Title` | `''` |
| `Prompt` | `'$'` |
| `Placeholder` | `''` |
| `Busy` | `false` |

## События

- `command`: Enter в командной строке: текст команды.
- `clear`: Ctrl+L: очистить вывод.

## Слоты

`actions`

## Пример

```example
<div class="docs-frame">
	<Terminal Title="Shell" Prompt="$" [lines]="Lines" [busy]="Busy" (command)="Run" (clear)="Clear">
		<Button slot="actions" Icon="delete" Title="Clear" Size="small" Variant="ghost" (click)="Clear" />
	</Terminal>
</div>
<script>
({
	Lines: [{ID: 1, Kind: 'info', Text: 'Type help. Arrow Up recalls a command, Ctrl+L clears.'}],
	Busy: false,
	Next: 2,

	Add: function (kind, text) {
		this.Lines = this.Lines.concat([{ID: this.Next++, Kind: kind, Text: text}]);
	},

	Run: function (text) {
		var self = this;
		var words = text.trim().split(/\s+/);

		this.Add('input', text);

		if (words[0] === 'help')
			this.Add('output', 'help, echo <text>, date, build, clear');
		else if (words[0] === 'echo')
			this.Add('output', words.slice(1).join(' '));
		else if (words[0] === 'date')
			this.Add('output', new Date().toString());
		else if (words[0] === 'clear')
			this.Clear();
		else if (words[0] === 'build') {
			this.Busy = true;

			setTimeout(function () {
				self.Add('output', 'Compiling 42 files...');
			}, 400);

			setTimeout(function () {
				self.Add('success', 'Built in 0.8 s');
				self.Busy = false;
			}, 1000);
		}
		else if (words[0])
			this.Add('error', words[0] + ': command not found');
	},

	Clear: function () {
		this.Lines = [];
	}
})
</script>
```

## Тесты

- [Mod+F finds and Mod+H replaces in the editors, Mod+F finds in a terminal; viewers show Markdown and code, formulas are drawn as MathML](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1794) — `tests/examples/ui-kit.spec.js`
- [workspace shows the tool windows the page puts in it and resizes them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5546) — `tests/examples/ui-kit.spec.js`
- [terminal runs commands and recalls its history](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6109) — `tests/examples/ui-kit.spec.js`
