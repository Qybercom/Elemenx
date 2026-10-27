<!-- generated -->
# ChatComposer

Поле сообщения в Chat. Enter отправляет (событие send несёт текст), Shift+Enter начинает новую строку. Поле растёт с текстом до MaxRows. Attach показывает кнопку, отправляющую событие attach. Emoji показывает кнопку ExpressionPicker: эмодзи вставляется в текст на место курсора, стикер отправляется сразу (событие sticker несёт {Sticker}); Stickers выключает вкладку стикеров. Подсказки над полем: Suggest 'always' (по умолчанию) предлагает эмодзи для слова у курсора (от 2 букв) и для :слова, 'colon' — только для :слова, 'never' — никогда; нажатый эмодзи заменяет слово (для :слова стрелки вверх и вниз выбирают, Enter или Tab берут). SuggestStickers (true) предлагает стикеры к сообщению из одного эмодзи (Emoji сервиса Stickers): нажатый стикер отправляется вместо сообщения. Escape прячет подсказки.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Placeholder` | `''` |
| `MaxRows` | `8` |
| `Attach` | `true` |
| `Emoji` | `true` |
| `Stickers` | `true` |
| `Disabled` | `false` |
| `Suggest` | `'always'` |
| `SuggestStickers` | `true` |

## События

- `input`: Текст изменился: Value.
- `sticker`: Отправлен стикер: {Sticker}.
- `send`: Enter (или кнопка отправки): текст.
- `attach`: Нажата кнопка вложения.

## Пример

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
