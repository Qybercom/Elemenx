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

- `mute`: Кнопка микрофона: {Muted}, запрошенное состояние.
- `camera`: Кнопка камеры: {Camera}, запрошенное состояние.
- `share`: Кнопка экрана: {Sharing}, запрошенное состояние.
- `hand`: Кнопка руки: {Hand}, запрошенное состояние.
- `chat`: Кнопка чата: {Open}, запрошенное состояние.
- `people`: Кнопка участников: {Open}, запрошенное состояние.
- `leave`: Нажата кнопка выхода.
- `react`: Выбрана реакция: {Emoji}.
- `layout`: Выбрана другая раскладка: {Layout}.
- `device`: Выбрано другое устройство: {Kind (microphone, speaker или camera), ID}.

## Пример

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

## Тесты

- [CallControls asks for the opposite of the state it shows, and leaves out the buttons of Hide](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-misc.test.js#L139) — `tests/regression/library-misc.test.js`
