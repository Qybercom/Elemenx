<!-- generated -->
# Properties

A list of properties: Property children, a name and its value each, in one column or two (Columns). Label names the list for screen readers. Its look comes from the --elemenx-property-* tokens of the theme.

## Properties

| Property | Default |
| --- | --- |
| `Columns` | `1` |
| `Label` | `''` |

## Slots

default

## Example

```example
<Properties Label="Battle" Columns="2">
	<Property Label="Attack" Value="1017" Tone="success" />
	<Property Label="Defense" Value="1162" />
	<Property Label="Speed" Value="4.2" Unit="m/s" />
	<Property Label="Critical" Value="12" Unit="%" Tone="warning" />
	<Property Label="Weight" [value]="Weight" Unit="kg" Tone="danger" />
	<Property Label="Level" Value="27" />
</Properties>
<Button Label="Add armor" Size="small" (click)="Armor" />
<script>
({
	Weight: 18,

	Armor: function () {
		this.Weight += 6;
	}
})
</script>
```

## Tests

- [sets the layout of an element above its props: its box, its sizes and the alignment of a flex container by icons](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L506) — `tests/examples/builder.spec.js`
- [properties set a value apart from its name, in one column or two, with tones and values of their own](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4692) — `tests/examples/ui-kit.spec.js`
- [windows move, resize, come to the front, minimize, maximize, follow the keys, close and remember their place](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6419) — `tests/examples/ui-kit.spec.js`
