<!-- generated -->
# CodeEditor

An editor of source code: a real <textarea> (typing, IME, the undo of the browser, screen readers and mobile keyboards work as in any field) over a layer that draws the text highlighted by the Syntax Service. It has no toolbar: the controls of an Application call its methods (the ready event gives the editor).

- Value, Language (a language of the Syntax Service), LineNumbers, Wrap, TabSize, Spaces (indents with spaces, not tabs), Pairs (closes brackets and quotes), ActiveLine, ReadOnly, Disabled, Invalid, Placeholder, Name, Label; Rows (the lines it shows) or AutoSize (grows with the text).
- Markers: [{Line, Column, EndLine, EndColumn, Severity, Message}] underline the text (lines and columns from 1; without Column the whole line; without an end the word). Severity: error, warning or info. The pointer over a marker shows its message.
- Complete(context, callback) offers completions as the user types a word (and on Ctrl+Space): context is {Text, Offset, Line, Column, Word, Before, Language, Explicit}; callback(error, items), items [{Label, Insert, Detail, Kind}] or texts. The items that start with the word show; Enter or Tab inserts one.
- Hint(context, callback) shows a hint for the text under the pointer: callback(error, text).
- Keys: Tab and Shift+Tab indent and outdent (Escape, then Tab, leaves the editor), Enter keeps the indent, Mod+/ comments the lines, Mod+] and Mod+[ indent and outdent, Ctrl+Space completes, Mod+F finds and Mod+R (or Mod+H) replaces in its own find bar (a FindBar over its corner; FindBar: false leaves it to the page).
- Methods: Focus(), Selection() ({Start, End, Text}), Select(start, end), Insert(text), Replace(start, end, text), Position(offset) ({Line, Column}), Offset(line, column), GoTo(line, column), Undo(), Redo(), Indent(), Outdent(), Comment(), Find(query, {Case, Word, RegExp}) (returns the count of matches and selects the next one), FindNext(), FindPrevious(), ReplaceCurrent(text), ReplaceAll(text), ClearFind(), Print(options, callback) (the Print Service; options as there).
- Diff view: with Original (the text before) and Diff 'unified' (one column; true too) or 'split' (the two texts side by side), the editor shows how Value differs from Original, read only: the lines removed and added on their colors, the words changed inside a changed line marked, the numbers of the lines in both texts, highlighted as in the editing view; the unchanged runs fold down to Context lines (3) around the changes, and a press on a fold opens it. DiffStats() returns {Added, Removed}; NextChange() and PreviousChange() scroll to a change.
- Events: input and change (Value), cursor ({Line, Column, Start, End}), ready (the editor).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Language` | `'text'` |
| `LineNumbers` | `true` |
| `Wrap` | `false` |
| `TabSize` | `4` |
| `Spaces` | `false` |
| `Pairs` | `true` |
| `ActiveLine` | `true` |
| `ReadOnly` | `false` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `Placeholder` | `''` |
| `Name` | `null` |
| `Label` | `''` |
| `Rows` | `12` |
| `AutoSize` | `false` |
| `Markers` | `[]` |
| `Complete` | `null` |
| `Hint` | `null` |
| `Original` | `null` |
| `Diff` | `false` |
| `Context` | `3` |
| `FindBar` | `true` |

## Events

`ready`, `cursor`, `input`, `change`, `complete`

## Methods

- `Indent()`
- `Outdent()`
- `Comment()`
- `Focus()`
- `Selection()`
- `Select(start, end)`
- `Insert(text)`
- `Replace(start, end, text)`
- `Position(offset)`
- `Offset(line, column)`
- `GoTo(line, column)`
- `Undo()`
- `Redo()`
- `Find(query, options)`
- `FindNext()`
- `FindPrevious()`
- `ReplaceCurrent(text)`
- `ReplaceAll(text)`
- `ClearFind()`
- `Print(options, callback)`
- `DiffStats()`
- `NextChange()`
- `PreviousChange()`

## Example

```example
<RadioGroup Variant="segmented" [options]="[{Value: 'javascript', Label: 'JavaScript'}, {Value: 'python', Label: 'Python'}, {Value: 'sql', Label: 'SQL'}]" [value]="Language" (change)="Chose" />
<CodeEditor [language]="Language" [value]="Code" LineNumbers="true" Rows="8" Pairs="true" (input)="Typed" (cursor)="Moved" />
<p class="elemenx-text small muted">{{Code.length}} characters · {{Cursor}} · Mod+F finds, Mod+H replaces, Mod+/ comments a line.</p>
<script>
({
	Language: 'javascript',
	Cursor: '',
	Code: "/* A counter. */\nfunction count (limit) {\n\tvar total = 0;\n\n\tfor (var i = 0; i < limit; i++)\n\t\ttotal += i;\n\n\treturn total;\n}\n",
	Samples: {
		javascript: "/* A counter. */\nfunction count (limit) {\n\tvar total = 0;\n\n\tfor (var i = 0; i < limit; i++)\n\t\ttotal += i;\n\n\treturn total;\n}\n",
		python: "def count(limit):\n\t\"\"\"A counter.\"\"\"\n\treturn sum(range(limit))  # the total\n",
		sql: "SELECT name, COUNT(*) AS orders\nFROM users\nGROUP BY name;\n"
	},

	Chose: function (value) {
		this.Language = value;
		this.Code = this.Samples[value];
	},

	Typed: function (value) {
		this.Code = value;
	},

	Moved: function (cursor) {
		this.Cursor = 'line ' + cursor.Line + ', column ' + cursor.Column;
	}
})
</script>
```
