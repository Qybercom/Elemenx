<!-- generated -->
# CodeView

Source code shown, not edited: Value highlighted by the Syntax Service in Language, as a CodeEditor draws it. LineNumbers (and Start, the number of the first line), Wrap, Highlight ([3, '7-9']: lines marked), Copy (a button that copies the code, on by default), Label. The text is selectable; Rows limits its height in lines (it scrolls). Fold: a bracket ({, [ or () that closes on a later line, or an element of HTML or XML whose closing tag is on a later line (<ul> ... </ul>; not one that closes itself, nor a void element), makes a block that folds: a button beside its first line hides the lines up to the one that closes it, and the first line ends with … and the rest of that last one ("items": [ … ], or <ul> … </ul>). A press on … unfolds it too. Folded lists the numbers of the lines whose blocks start folded; the event fold reports {Line, Folded} at each press. Without Value the code is the body of the element (<CodeView Language="html">&lt;p&gt;Hi&lt;/p&gt;</CodeView>: its text, so a tag in it is written as &lt;), without the indentation its lines share: the body follows its changes.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Language` | `'text'` |
| `LineNumbers` | `false` |
| `Start` | `1` |
| `Wrap` | `false` |
| `Highlight` | `[]` |
| `Copy` | `true` |
| `Rows` | `0` |
| `Label` | `''` |
| `Fold` | `false` |
| `Folded` | `[]` |

## Events

- `fold`: A block was folded or unfolded: {Line, Folded}.

## Slots

default

## Example

```example
<CodeView Language="javascript" LineNumbers="true" [highlight]="[4]" Label="A function" Value="function greet (name) {&#10;&#9;var text = 'Hello, ' + name;&#10;&#10;&#9;return text.toUpperCase();&#10;}" />
<CodeView Language="json" Fold="true" [folded]="[7]" Label="A package" [value]="Package" (fold)="Folded" />
<p class="elemenx-text small muted">{{Note}}</p>
<CodeView Language="css" Rows="3" Value=".card {&#10;&#9;color: var(--elemenx-accent);&#10;&#9;padding: 12px;&#10;&#9;border-radius: 8px;&#10;}" />
<script>
({
	Note: 'Fold: the arrows fold the blocks, … unfolds them; the copy button shows under the pointer.',
	Package: '{\n\t"name": "elemenx",\n\t"keywords": [\n\t\t"ui",\n\t\t"es5"\n\t],\n\t"scripts": {\n\t\t"test": "vitest",\n\t\t"lint": "eslint ."\n\t}\n}\n',

	Folded: function (event) {
		this.Note = 'Line ' + event.Line + (event.Folded ? ' folded' : ' unfolded');
	}
})
</script>
```

## Tests

- [writes the text of a Markdown and the code of a CodeView as their body, edited in a field of many lines](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L1289) — `tests/examples/builder.spec.js`
