<!-- generated -->
# CallControls

Панель звонка: микрофон и камера (у каждого меню устройств), показ экрана, рука, реакции, чат, участники, раскладка и выход. Показывает состояние, которое ей дали (Muted, Camera, Sharing, Hand, Chat, People, Layout), и сообщает о нажатиях: mute ({Muted}), camera ({Camera}), share ({Sharing}), hand ({Hand}), chat и people ({Open}) — каждое с состоянием, о котором просит; react ({Emoji}), layout ({Layout}), device ({Kind: microphone, speaker или camera, ID}) и leave. Devices: {Microphones, Speakers, Cameras: [{ID, Label}], Microphone, Speaker, Camera} — выбранные ID. Reactions — эмодзи меню реакций, Hide — кнопки, которых не будет.

## Свойства

| Свойство | По умолчанию |
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

## События

`mute`, `camera`, `share`, `hand`, `chat`, `people`, `leave`, `react`, `layout`, `device`
