<!-- generated -->
# EmojiPicker

A picker of the emoji of Unicode (the Emoji Service): a search over names and keywords, the groups with a tab each, the emoji used last first, a skin tone for the emoji that take one, and the name of the emoji under the pointer. Emoji that the system cannot draw as one picture are left out. Keys: typing searches, Down goes from the search to the emoji, the arrows move between them, Enter picks, Escape emits dismiss. Columns is the emoji in a row. Events: pick ({Emoji, Name, Base}), dismiss.

## Properties

| Property | Default |
| --- | --- |
| `Label` | `''` |
| `Placeholder` | `''` |
| `Nothing` | `''` |
| `Columns` | `9` |
| `Tones` | `true` |
| `Recent` | `true` |
| `Autofocus` | `true` |

## Events

- `pick`: An emoji was picked: {Emoji (with the skin tone), Name, Base}.
- `dismiss`: Escape was pressed: close it.

## Example

```example
<div class="elemenx-card"><EmojiPicker Autofocus="false" (pick)="Picked" /></div>
<p class="elemenx-text">Picked: <span class="elemenx-title">{{Emoji || '—'}}</span> {{Name}}</p>
<script>
({
	Emoji: '',
	Name: '',

	Picked: function (event) {
		this.Emoji = event.Emoji;
		this.Name = event.Name;
	}
})
</script>
```

## Tests

- [is served by elemenx docs with the answers of its examples of the network](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/docs-site.test.js#L126) — `tests/regression/docs-site.test.js`
- [builds the Docs with all of the framework and every pack, without the tools that write its pages, and with its server](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/docs-site.test.js#L89) — `tests/regression/docs-site.test.js`
