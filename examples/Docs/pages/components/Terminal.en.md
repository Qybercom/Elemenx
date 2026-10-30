<!-- generated -->
# Terminal

A terminal: a scrolling output above a command line. Lines: [{ID, Kind, Text}] where Kind is input, output, error, info or success. Enter emits command with the text; Arrow Up and Down walk the history of this terminal; Ctrl+L emits clear. Busy makes the command line read-only: it keeps the focus, so the next command can follow at once. Slots: actions (in the title bar, shown with Title or actions). The output follows new lines while the reader is at its end. Mod+F (or Ctrl+Shift+F) finds in the output: a FindBar under the title marks the matches (the Find Service) and goes from one to the next; Escape closes it.

## Properties

| Property | Default |
| --- | --- |
| `Lines` | `[]` |
| `Title` | `''` |
| `Prompt` | `'$'` |
| `Placeholder` | `''` |
| `Busy` | `false` |

## Events

- `command`: Enter on the command line: the text of the command.
- `clear`: Ctrl+L: clear the output.

## Slots

`actions`

## Example

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

## Tests

- [Mod+F finds and Mod+H replaces in the editors, Mod+F finds in a terminal; viewers show Markdown and code, formulas are drawn as MathML](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1794) — `tests/examples/ui-kit.spec.js`
- [workspace shows the tool windows the page puts in it and resizes them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5519) — `tests/examples/ui-kit.spec.js`
- [terminal runs commands and recalls its history](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6082) — `tests/examples/ui-kit.spec.js`
