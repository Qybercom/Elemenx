<!-- generated -->
# Chat

A chat layout built on elemenx-screen, elemenx-container and elemenx-column. Slots: sidebar (conversations), header, default (the messages), composer. SidebarOpen shows the sidebar (a chat 600 pixels wide or less, as on a phone, hides it); SidebarWidth is resizable. The message list follows new messages while the reader is at its end, and stays in place while the reader scrolls back through the history. Selection is the IDs of the messages chosen (the select events of the ChatMessage): while it has some, a bar takes the place of the header with their count, a button that lets them go (the clear event; Escape too) and the slot selection for the actions on them. Each ChatMessage takes [selecting] and [selected] from it.

## Properties

| Property | Default |
| --- | --- |
| `SidebarOpen` | `true` |
| `SidebarWidth` | `280` |
| `Selection` | `[]` |

## Events

- `clear`: The selection of messages was let go (its button, or Escape).
- `resize`: The sidebar was resized: SidebarWidth.

## Slots

`sidebar`, `header`, `selection`, default, `composer`

## Example

```example
<div class="docs-frame tall">
	<Chat [selection]="Selection" (clear)="Cleared">
		<div slot="sidebar" class="docs-stack">
			<Input Shape="round" Icon="search" Placeholder="Search" Size="small" />
			<div class="elemenx-chat-conversation active"><Avatar Name="Grace Hopper" Size="small" /><div><strong>Grace Hopper</strong><p class="elemenx-text small muted">The build is green.</p></div></div>
			<div class="elemenx-chat-conversation"><Avatar Name="Alan Turing" Size="small" /><div><strong>Alan Turing</strong><p class="elemenx-text small muted">See you tomorrow</p></div></div>
		</div>
		<div slot="header" class="elemenx-container" style="gap: 8px;"><Avatar Name="Grace Hopper" Size="small" Status="online" /><strong>Grace Hopper</strong></div>
		<Button slot="selection" Icon="delete" Title="Delete selected" Variant="ghost" (click)="Delete" />
		<ChatMessage *for="message of Messages" *key="message.ID" [id]="message.ID" [author]="message.Author" [text]="message.Text" [time]="message.Time" [own]="!!message.Own" [status]="message.Status || ''" [selecting]="Selection.length > 0" [selected]="Selection.indexOf(message.ID) !== -1" (select)="Selected" />
		<ChatComposer slot="composer" (send)="Send" />
	</Chat>
</div>
<script>
({
	Selection: [],
	Messages: [
		{ID: 1, Author: 'Grace Hopper', Text: 'The build is green again.', Time: '10:02'},
		{ID: 2, Author: 'Grace Hopper', Text: 'Can you check the new table?', Time: '10:03'},
		{ID: 3, Author: 'Me', Text: 'Looks good, merging it now.', Time: '10:05', Own: true, Status: 'read'}
	],

	Send: function (text) {
		var now = new Date();

		this.Messages = this.Messages.concat([{ID: Date.now(), Author: 'Me', Text: text, Time: now.getHours() + ':' + ('0' + now.getMinutes()).slice(-2), Own: true, Status: 'sent'}]);
	},

	Selected: function (event) {
		var id = event.ID;

		this.Selection = this.Selection.indexOf(id) === -1 ? this.Selection.concat([id]) : this.Selection.filter(function (item) {
			return item !== id;
		});
	},

	Cleared: function () {
		this.Selection = [];
	},

	Delete: function () {
		var selection = this.Selection;

		this.Messages = this.Messages.filter(function (message) {
			return selection.indexOf(message.ID) === -1;
		});

		this.Selection = [];
	}
})
</script>
```

## Tests

- [chat composer puts emoji at the caret and sends stickers; messages take reactions](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L999) — `tests/examples/ui-kit.spec.js`
- [chat composer suggests emoji for a word and for :word, the stickers of a message of one emoji, and keeps to its setting](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1070) — `tests/examples/ui-kit.spec.js`
- [chat messages: a tap opens the menu, a long press starts a choice of several, the bar counts and deletes them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1549) — `tests/examples/ui-kit.spec.js`
- [a call stage pages its tiles, changes its layout with the bar of the call, pins a tile in front, opens its side panel and takes its own video to another corner](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L2775) — `tests/examples/ui-kit.spec.js`
- [a mobile menu is a sheet from the bottom: large rows, levels inside it with a way back, Cancel and the shade close it](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4045) — `tests/examples/ui-kit.spec.js`
- [chat keeps to its last message when what it holds grows later: a picture that loads, more messages](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5543) — `tests/examples/ui-kit.spec.js`
- [chat shows the avatar on the newest message of a run from one author](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5594) — `tests/examples/ui-kit.spec.js`
- [chat messages show their state, open their menu by a right click or the dots, and sum up reactions and views](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5611) — `tests/examples/ui-kit.spec.js`
