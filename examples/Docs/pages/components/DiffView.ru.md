<!-- generated -->
# DiffView

Различия двух текстов для чтения (сервис Diff): Before и After построчно, с отмеченными словами, изменившимися в изменённой строке. Mode: unified (удалённые строки, затем добавленные, в одну колонку) или split (текст до — слева, текст после — справа). Context строк вокруг каждого изменения (3); неизменённые участки между ними сворачиваются, а нажатие на свёртку показывает её. В заголовке — число добавленных и удалённых строк и Title (имя файла). LineNumbers показывает номера строк каждой стороны.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Before` | `''` |
| `After` | `''` |
| `Mode` | `'unified'` |
| `Context` | `3` |
| `LineNumbers` | `true` |
| `Title` | `''` |

## Пример

```example
<DiffView Title="sum.js" [before]="Before" [after]="After" [mode]="Mode" Context="1" />
<RadioGroup Variant="segmented" Label="Mode" [options]="[{Value: 'unified', Label: 'Unified'}, {Value: 'split', Label: 'Side by side'}]" [value]="Mode" (change)="Moded" />
<script>
({
	Mode: 'unified',
	Before: 'function sum (list) {\n\tvar total = 0;\n\n\tfor (var i = 0; i < list.length; i++)\n\t\ttotal += list[i];\n\n\treturn total;\n}\n\nmodule.exports = sum;',
	After: 'function sum (list) {\n\tvar total = 0;\n\n\tlist.forEach(function (value) {\n\t\ttotal += value;\n\t});\n\n\treturn total;\n}\n\nmodule.exports = sum;',

	Moded: function (value) {
		this.Mode = value;
	}
})
</script>
```
