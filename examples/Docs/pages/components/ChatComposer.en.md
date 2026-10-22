<!-- generated -->
# ChatComposer

The message field of a Chat. Enter sends (the send event carries the text), Shift+Enter starts a new line. The field grows with its text up to MaxRows. Attach shows a button that emits the attach event. Emoji shows the button of an ExpressionPicker: an emoji goes into the text where the caret is, a sticker is sent at once (the sticker event carries {Sticker}); Stickers turns the tab of the stickers off. Suggestions above the field: Suggest 'always' (the default) offers emoji for the word at the caret (2 letters or more) and for :word, 'colon' only for :word, 'never' none; a pressed emoji takes the place of the word (for :word, Arrow Up and Down choose and Enter or Tab takes one). SuggestStickers (true) offers the stickers of a message of one emoji (the Emoji of the Stickers Service): a pressed sticker is sent in place of the message. Escape hides them.

## Properties

| Property | Default |
| --- | --- |
| `Placeholder` | `''` |
| `MaxRows` | `8` |
| `Attach` | `true` |
| `Emoji` | `true` |
| `Stickers` | `true` |
| `Disabled` | `false` |
| `Suggest` | `'always'` |
| `SuggestStickers` | `true` |

## Events

`input`, `sticker`, `send`, `attach`

## Example

```example
<ChatComposer Attach="false" (send)="Send" (sticker)="Sticker" />
<ul class="elemenx-ul"><li *for="line of Sent" *key="$index">{{line}}</li></ul>
<script>
({
	Sent: [],

	Send: function (text) {
		this.Sent = this.Sent.concat(['Sent: ' + text]);
	},

	Sticker: function (event) {
		this.Sent = this.Sent.concat(['A sticker: ' + event.Sticker.Title]);
	}
})
</script>
```
