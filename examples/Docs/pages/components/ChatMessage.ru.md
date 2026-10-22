<!-- generated -->
# ChatMessage

Одно сообщение Chat. Text или слот по умолчанию для богатого содержимого. Own ставит сообщение на сторону читателя. Avatar — адрес картинки; без него показываются инициалы Author. Position ставит сообщение в серию от одного автора: single, first, middle или last. Имя автора показывается на первом сообщении серии, аватар — на последнем (самом новом). Status: sending (часы), sent (галочка), delivered (две галочки), read (две галочки в акцентном цвете) или error. Edited помечает сообщение, изменённое после отправки («изменено»; текст, например время изменения, — его подсказка). Sticker — адрес стикера, отправленного сообщением. Reactions: [{Emoji, Count, Mine, Users: [{Name, Avatar}]}] под пузырём; нажатие на реакцию отправляет react. React добавляет кнопку выбора эмодзи для реакции (EmojiPicker). Actions — меню сообщения ([{ID, Label, Icon, Shortcut, Disabled, Danger, Separator}], как в MenuList): открывается правым щелчком (долгим нажатием на сенсорном экране), клавишей Menu или Shift+F10 и кнопкой с тремя точками; выбор отправляет action. Пункт с ID 'summary' открывает сводку. На телефоне меню — лист снизу экрана. Сводка: кто чем отреагировал (Users в Reactions) и кто видел сообщение (Viewers: [{Name, Avatar, Time}]; Views — их число, когда список неизвестен), на вкладках. Глаз с числом просмотров в углу пузыря тоже её открывает. Выбор нескольких сообщений: на сенсорном экране касание открывает меню, а долгое нажатие (Hold миллисекунд) выбирает сообщение; мышью — Shift со щелчком, а пункт меню с ID 'select' выбирает его с клавиатуры. Пока чат в режиме Selecting, касание, щелчок или галочка в начале сообщения переключают выбор; Selected помечает выбранное сообщение. Chat вокруг хранит выбор (Selection) и полосу действий. События: react ({ID, Emoji, Mine}): Mine — реагирует ли читатель (true) или снимает реакцию (false); action ({ID, Action, Item}); select ({ID, Selected}): сообщение просит выбрать его или снять выбор. ID — ID сообщения.

## Свойства

| Свойство | По умолчанию |
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

## События

`react`, `select`, `action`

## Слоты

по умолчанию

## Пример

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
