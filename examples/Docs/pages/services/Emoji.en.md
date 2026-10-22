<!-- generated -->
# Emoji

The emoji of Unicode, drawn by the fonts of the system: their groups, names and keywords for search, skin tones and the emoji used last. The data loads once, when it is first needed: data/emoji.json (the groups of emoji-test.txt of Unicode, with the English names) and the names and keywords of CLDR in English and in the language of the user, data/emoji-<locale>.json (Locales lists the ones there are; Locale, the language of the page by default). Load(callback) calls back (error, groups). A group is {ID, Label, Icon, Emoji: [{Char, Name, Version, Tone, Region}]}; Version is the version of Emoji that brought it, Tone is true for an emoji that takes a skin tone, Region is the region of a flag. Name(emoji) is its name in Locale. Search(text, limit) finds emoji by every word of the text: the names and the keywords of the loaded languages (LoadLanguage(locale, callback) adds the keywords of one more language of Locales; Keywords(locale, map) adds any: {'😀': 'words'}). Tone(value) is the skin tone of the user, 0 (none) to 5, remembered; Toned(char, tone) applies it. Recent(limit) lists the emoji used last, Used(char) records one (remembered as well). Supported(char) tells whether the system draws an emoji as one picture: a font without it draws a box or its parts (flags on Windows, the newest emoji on older systems), and the pickers leave such emoji out.

## Methods

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

## Example

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
