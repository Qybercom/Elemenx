<!-- generated -->
# ChatMessage

One message of a Chat. Text, or the default slot for rich content. Own puts the message on the reader's side. Avatar is an image URL; without it the initials of Author are shown. Position places the message in a run of messages from one author: single, first, middle or last. The author name shows on the first message of a run and the avatar on the last (the newest) one. Status: sending (a clock), sent (a check), delivered (two checks), read (two checks in the accent) or error. Edited marks a message changed after it was sent ("edited"; a text, as the time of the change, is its hint). Sticker is the URL of a sticker sent as the message. Reactions: [{Emoji, Count, Mine, Users: [{Name, Avatar}]}] under the bubble; a press on one emits react. React adds the button that picks an emoji to react with (EmojiPicker). Actions: the menu of the message ([{ID, Label, Icon, Shortcut, Disabled, Danger, Separator}], as MenuList), opened by a right click (a long press on a touch screen), the Menu key or Shift+F10, or the button with three dots; a choice emits action. The item of ID 'summary' opens the summary instead. On a phone the menu is a sheet from the bottom of the screen. The summary: who reacted with what (the Users of the Reactions) and who has seen the message (Viewers: [{Name, Avatar, Time}]; Views counts them when the list is not known), in tabs. The eye with the count of views in the corner of the bubble opens it too. The choice of several messages: on a touch screen a tap opens the menu of the message and a long press (Hold milliseconds) chooses the message; with a mouse Shift and a click choose it, and the menu item of ID 'select' chooses it from the keys. While the chat is Selecting, a tap, a click or the check at the start of the message turns its choice; Selected marks a chosen message. The Chat around keeps the choice (its Selection) and the bar of its actions. Events: react ({ID, Emoji, Mine}): Mine tells whether the reader reacts (true) or takes the reaction back (false); action ({ID, Action, Item}); select ({ID, Selected}): the message asks to be chosen or let go. ID is the ID of the message.

## Properties

| Property | Default |
| --- | --- |
| `ID` | `null` |
| `Author` | `''` |
| `Avatar` | `''` |
| `Text` | `''` |
| `Time` | `''` |
| `Own` | `false` |
| `Position` | `'single'` |
| `Status` | `''` |
| `Sticker` | `''` |
| `Reactions` | `[]` |
| `React` | `false` |
| `Edited` | `false` |
| `Views` | `0` |
| `Viewers` | `[]` |
| `Actions` | `[]` |
| `Selecting` | `false` |
| `Selected` | `false` |
| `Hold` | `500` |

## Events

- `react`: A reaction was pressed or picked: {ID, Emoji, Mine}, Mine the state it asks for.
- `select`: The message was selected or let go: {ID, Selected}.
- `action`: An item of its menu was chosen: {ID, Action, Item}.

## Slots

default

## Example

```example
<div class="docs-stack">
	<ChatMessage Author="Grace Hopper" Text="The build is green again." Time="10:02" Position="first" />
	<ChatMessage Author="Grace Hopper" Text="Can you check the new table?" Time="10:03" Position="last" Edited="Edited at 10:04" />
	<ChatMessage Author="Me" Text="Looks good, merging it now." Time="10:05" Own="true" Status="read" React="true" [reactions]="Reactions" [actions]="Actions" [viewers]="Viewers" (react)="Reacted" (action)="Acted" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Right click the last message for its menu; press a reaction.',
	Reactions: [{Emoji: '🎉', Count: 2, Mine: false, Users: [{Name: 'Grace Hopper'}, {Name: 'Alan Turing'}]}, {Emoji: '👍', Count: 1, Mine: true, Users: [{Name: 'Me'}]}],
	Viewers: [{Name: 'Grace Hopper', Time: '10:06'}, {Name: 'Alan Turing', Time: '10:11'}],
	Actions: [
		{ID: 'reply', Label: 'Reply', Icon: 'reply'},
		{ID: 'copy', Label: 'Copy', Icon: 'copy'},
		{ID: 'summary', Label: 'Reactions and views', Icon: 'eye'},
		{Separator: true, ID: 'separator'},
		{ID: 'delete', Label: 'Delete', Icon: 'delete', Danger: true}
	],

	Reacted: function (event) {
		this.Note = 'Reacted with ' + event.Emoji;
	},

	Acted: function (event) {
		this.Note = 'Action: ' + (event.Item ? event.Item.ID : event.ID);
	}
})
</script>
```
