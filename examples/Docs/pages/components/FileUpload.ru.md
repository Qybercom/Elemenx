<!-- generated -->
# FileUpload

Выбирает файлы через диалог или перетаскиванием; сам их не загружает. Variant: dropzone, inline, gallery или avatar. Files: [{ID, Name, Size, Type, URL, File}], URL — превью изображения (object URL). События: change (массив File), reject ([{Name, Reason}]) для файлов, отклонённых по Accept, MaxSize или MaxFiles.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Variant` | `'dropzone'` |
| `Accept` | `''` |
| `Multiple` | `true` |
| `MaxSize` | `null` |
| `MaxFiles` | `null` |
| `Label` | `''` |
| `Hint` | `''` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `Files` | `[]` |

## События

- `reject`: Файлы отклонены по Accept, MaxSize или MaxFiles: [{Name, Reason}].
- `change`: Файлы изменились: список File.

## Пример

```example
<FileUpload Multiple="true" Accept="image/*,.pdf" MaxSize="5000000" (change)="Changed" (reject)="Rejected" />
<FileUpload Variant="inline" />
<ul class="elemenx-ul"><li *for="line of Lines" *key="$index">{{line}}</li></ul>
<script>
({
	Lines: [],

	Changed: function (files) {
		this.Lines = files.map(function (item) {
			var file = item.File || item;

			return file.name + ' · ' + Math.round(file.size / 1024) + ' KB';
		});
	},

	Rejected: function (errors) {
		this.Lines = errors.map(function (error) {
			return 'Refused: ' + (error.Name || '') + ' ' + (error.Reason || '');
		});
	}
})
</script>
```
