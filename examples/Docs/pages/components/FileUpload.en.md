<!-- generated -->
# FileUpload

Picks files by dialog or drag and drop; it does not upload them. Variant: dropzone, inline, gallery or avatar. Files: [{ID, Name, Size, Type, URL, File}], URL is an object URL preview for images. Events: change (Array of File), reject ([{Name, Reason}]) for files refused by Accept, MaxSize or MaxFiles.

## Properties

| Property | Default |
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

## Events

- `reject`: Files were refused by Accept, MaxSize or MaxFiles: [{Name, Reason}].
- `change`: The files changed: the list of File.

## Example

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
