<!-- generated -->
# CallTile

The tile of a participant of a call: their video, or their avatar while the camera is off. The video is Stream (a MediaStream, shown by a <video> of the tile) or Element (an element of your own, a <video> of another media layer say), placed in it. Name, Image (the picture of the avatar), Muted (the microphone off), Camera (on, by default), Speaking (a frame while they talk; Level 0 to 1 makes it breathe with the voice), Quality (good, fair or poor: the bars of the connection), Hand (raised), Pinned, Self (the own video, mirrored), Screen (a screen shared: the video kept whole). A double click or the pin button tells pin ({Pinned, Name}).

## Properties

| Property | Default |
| --- | --- |
| `Name` | `''` |
| `Image` | `''` |
| `Stream` | `null` |
| `Element` | `null` |
| `Muted` | `false` |
| `Camera` | `true` |
| `Speaking` | `false` |
| `Level` | `0` |
| `Quality` | `''` |
| `Hand` | `false` |
| `Pinned` | `false` |
| `Self` | `false` |
| `Screen` | `false` |

## Events

- `pin`: Its pin button or a double click: {Pinned, Name}, the state it asks for.

## Example

```example
<div class="elemenx-container wrappable" style="gap: 12px;">
	<div style="width: 240px; height: 160px;"><CallTile Name="Ada Lovelace" Camera="false" Speaking="true" Level="0.6" Quality="good" [pinned]="Pinned" (pin)="Pin" /></div>
	<div style="width: 240px; height: 160px;"><CallTile Name="Alan Turing" Camera="false" Muted="true" Hand="true" Quality="poor" /></div>
</div>
<script>
({
	Pinned: false,

	Pin: function (event) {
		this.Pinned = event.Pinned;
	}
})
</script>
```
