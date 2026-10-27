<!-- generated -->
# Checkbox

A check box. Checked is its state, Indeterminate shows a dash for a set that is partly checked (a parent of a list), Label and Description stand beside it, Icon goes before the label. Variant: default (a box and its label), chip (a toggle chip) or tile (a selectable tile with its description). Size: small, medium or large. Name and Value are those of a field of a form; Disabled, Invalid. Events: change (Checked).

## Properties

| Property | Default |
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

## Events

- `change`: It was checked or unchecked: Checked.

## Slots

default

## Example

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
