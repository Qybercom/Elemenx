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

`pin`
