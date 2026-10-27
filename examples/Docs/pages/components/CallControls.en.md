<!-- generated -->
# CallControls

The bar of a call: the microphone, the camera (each with the menu of its devices), the screen, the hand, the reactions, the chat, the people, the layout and leaving. It shows the state it is given (Muted, Camera, Sharing, Hand, Chat, People, Layout) and tells what is pressed: mute ({Muted}), camera ({Camera}), share ({Sharing}), hand ({Hand}), chat and people ({Open}), each with the state it asks for; react ({Emoji}), layout ({Layout}), device ({Kind: microphone, speaker or camera, ID}) and leave. Devices: {Microphones, Speakers, Cameras: [{ID, Label}], Microphone, Speaker, Camera (the IDs chosen)}. Reactions: the emoji of its menu. Hide: the buttons left out.

## Properties

| Property | Default |
| --- | --- |
| `Muted` | `false` |
| `Camera` | `true` |
| `Sharing` | `false` |
| `Hand` | `false` |
| `Chat` | `false` |
| `People` | `false` |
| `Layout` | `'grid'` |
| `Devices` | `null` |
| `Reactions` | `['👍', '👏', '😂', '❤️', '🎉', '😮']` |
| `Hide` | `[]` |

## Events

- `mute`: The microphone button: {Muted}, the state it asks for.
- `camera`: The camera button: {Camera}, the state it asks for.
- `share`: The screen button: {Sharing}, the state it asks for.
- `hand`: The hand button: {Hand}, the state it asks for.
- `chat`: The chat button: {Open}, the state it asks for.
- `people`: The people button: {Open}, the state it asks for.
- `leave`: The leave button was pressed.
- `react`: A reaction was chosen: {Emoji}.
- `layout`: Another layout was chosen: {Layout}.
- `device`: Another device was chosen: {Kind (microphone, speaker or camera), ID}.

## Example

```example
<CallControls [muted]="State.Muted" [camera]="State.Camera" [sharing]="State.Sharing" [hand]="State.Hand" (mute)="Set" (camera)="Set" (share)="Set" (hand)="Set" (react)="Reacted" (leave)="Left" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Press the buttons',
	State: {Muted: false, Camera: true, Sharing: false, Hand: false},

	Set: function (change) {
		this.State = Object.assign({}, this.State, change);
		this.Note = JSON.stringify(change);
	},

	Reacted: function (event) {
		this.Note = 'Reaction ' + event.Emoji;
	},

	Left: function () {
		this.Note = 'Left the call';
	}
})
</script>
```
