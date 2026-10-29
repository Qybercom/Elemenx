<!-- generated -->
# Checkbox

Флажок. Checked — его состояние, Indeterminate показывает чёрточку для частично отмеченного набора (родитель списка), Label и Description стоят рядом, Icon — перед подписью. Variant: default (флажок и подпись), chip (переключаемый чип) или tile (выбираемая плитка с описанием). Size: small, medium или large. Name и Value — как у поля формы; Disabled, Invalid. События: change (Checked).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Checked` | `false` |
| `Indeterminate` | `false` |
| `Label` | `''` |
| `Description` | `''` |
| `Icon` | `''` |
| `Variant` | `'default'` |
| `Size` | `'medium'` |
| `Name` | `null` |
| `Value` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## События

- `change`: Отмечен или снят: Checked.

## Слоты

по умолчанию

## Пример

```example
<div class="docs-stack">
	<Checkbox Label="Remember me" [checked]="Remember" (change)="Remembered" />
	<Checkbox Label="All files" [checked]="All" [indeterminate]="Some" (change)="ToggleAll" />
	<div class="docs-stack" style="padding-inline-start: 24px;">
		<Checkbox *for="file of Files" *key="file.Name" [label]="file.Name" [checked]="file.Checked" [value]="file.Name" (change)="Toggled" />
	</div>
</div>
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Checkbox Label="Chip" Variant="chip" Icon="star" />
	<Checkbox Label="A tile" Description="With a description" Variant="tile" Checked="true" />
	<Checkbox Label="Disabled" Disabled="true" />
</div>
<script>
({
	Remember: true,
	Files: [{Name: 'a.txt', Checked: true}, {Name: 'b.txt', Checked: false}, {Name: 'c.txt', Checked: false}],
	All: false,
	Some: true,

	Remembered: function (value) {
		this.Remember = value;
	},

	Count: function () {
		var checked = this.Files.filter(function (file) {
			return file.Checked;
		}).length;

		this.All = checked === this.Files.length;
		this.Some = checked > 0 && !this.All;
	},

	Toggled: function (value, box) {
		this.Files = this.Files.map(function (file) {
			return file.Name === box.Value ? {Name: file.Name, Checked: value} : file;
		});

		this.Count();
	},

	ToggleAll: function (value) {
		this.Files = this.Files.map(function (file) {
			return {Name: file.Name, Checked: value};
		});

		this.Count();
	}
})
</script>
```

## Тесты

- [keeps the structure in view, runs the page at the width of a phone from its header and speaks Russian](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L632) — `tests/examples/designer.spec.js`
- [shows the example of the page it goes to through the contents, not the one of the page before](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/docs.spec.js#L111) — `tests/examples/docs.spec.js`
