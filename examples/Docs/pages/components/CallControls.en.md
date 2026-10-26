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

`mute`, `camera`, `share`, `hand`, `chat`, `people`, `leave`, `react`, `layout`, `device`
