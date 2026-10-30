<!-- generated -->
# EmojiPicker

Выбор эмодзи Unicode (сервис Emoji): поиск по названиям и ключевым словам, группы — каждая на своей вкладке, недавние эмодзи первыми, тон кожи для эмодзи, которые его поддерживают, и название эмодзи под указателем. Эмодзи, которые система не может нарисовать одной картинкой, не показываются. Клавиши: ввод ищет, стрелка вниз переходит от поиска к эмодзи, стрелки двигают между ними, Enter выбирает, Escape отправляет dismiss. Columns — число эмодзи в строке. События: pick ({Emoji, Name, Base}), dismiss.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Label` | `''` |
| `Placeholder` | `''` |
| `Nothing` | `''` |
| `Columns` | `9` |
| `Tones` | `true` |
| `Recent` | `true` |
| `Autofocus` | `true` |

## События

- `pick`: Выбрано эмодзи: {Emoji (с оттенком кожи), Name, Base}.
- `dismiss`: Нажат Escape: закрыть.

## Пример

```example
<div class="elemenx-card"><EmojiPicker Autofocus="false" (pick)="Picked" /></div>
<p class="elemenx-text">Picked: <span class="elemenx-title">{{Emoji || '—'}}</span> {{Name}}</p>
<script>
({
	Emoji: '',
	Name: '',

	Picked: function (event) {
		this.Emoji = event.Emoji;
		this.Name = event.Name;
	}
})
</script>
```

## Тесты

- [is served by elemenx docs with the answers of its examples of the network](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/docs-site.test.js#L127) — `tests/regression/docs-site.test.js`
- [builds the Docs with all of the framework and every pack, without the tools that write its pages, and with its server](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/docs-site.test.js#L89) — `tests/regression/docs-site.test.js`
