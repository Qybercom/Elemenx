<!-- generated -->
# Emoji

Эмодзи Unicode, нарисованные шрифтами системы: их группы, названия и ключевые слова для поиска, оттенки кожи и недавно использованные эмодзи. Данные загружаются один раз, когда впервые нужны: data/emoji.json (группы из emoji-test.txt Unicode с английскими названиями) и названия и ключевые слова CLDR на английском и на языке пользователя, data/emoji-<locale>.json (Locales перечисляет имеющиеся; Locale — по умолчанию язык страницы). Load(callback) вызывает callback (error, groups). Группа — {ID, Label, Icon, Emoji: [{Char, Name, Version, Tone, Region}]}; Version — версия Emoji, в которой он появился, Tone — true для эмодзи с оттенком кожи, Region — регион флага. Name(emoji) — название на языке Locale. Search(text, limit) ищет эмодзи по каждому слову текста: по названиям и ключевым словам загруженных языков (LoadLanguage(locale, callback) добавляет ключевые слова ещё одного языка из Locales; Keywords(locale, map) добавляет любые: {'😀': 'слова'}). Tone(value) — оттенок кожи пользователя, от 0 (нет) до 5, запоминается; Toned(char, tone) применяет его. Recent(limit) перечисляет недавно использованные эмодзи, Used(char) записывает одно (тоже запоминается). Supported(char) сообщает, рисует ли система эмодзи одной картинкой: шрифт без него рисует квадрат или составные части (флаги в Windows, новейшие эмодзи в старых системах), и выбор эмодзи такие пропускает.

## Методы

- `Load(callback)`
- `LoadLanguage(locale, callback)`
- `Keywords(locale, map)`
- `Name(emoji)`
- `Search(text, limit)`
- `Tone(value)`
- `Toned(char, tone)`
- `Recent(limit)`
- `Used(char)`
- `Supported(char)`

## Пример

```example
<span class="elemenx-input"><input class="elemenx-input-control" [(value)]="Query" placeholder="Search emoji" /></span>
<Button Label="Search" Variant="primary" (click)="Search" />
<p class="elemenx-title">{{Found}}</p>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Query: 'cat',
	Found: '',
	Note: 'The data loads on the first use.',

	Search: function () {
		var self = this;
		var emoji = this.$Service('Emoji');

		emoji.Load(function (error) {
			var found;

			if (error) {
				self.Note = error.message;

				return;
			}

			found = emoji.Search(self.Query, 12);

			self.Found = found.map(function (item) {
				return item.Char;
			}).join(' ');
			self.Note = found.length ? found[0].Char + ' is ' + emoji.Name(found[0].Char) : 'Nothing found';
		});
	}
})
</script>
```
