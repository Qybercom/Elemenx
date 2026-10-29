<!-- generated -->
# Properties

Список свойств: дочерние Property, у каждого название и значение, в одну колонку или две (Columns). Label называет список для экранных читалок. Внешний вид задают токены темы --elemenx-property-*.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Columns` | `1` |
| `Label` | `''` |

## Слоты

по умолчанию

## Пример

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

## Тесты

- [sets the layout of an element above its props: its box, its sizes and the alignment of a flex container by icons](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L506) — `tests/examples/builder.spec.js`
- [properties set a value apart from its name, in one column or two, with tones and values of their own](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4768) — `tests/examples/ui-kit.spec.js`
- [windows move, resize, come to the front, minimize, maximize, follow the keys, close and remember their place](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6548) — `tests/examples/ui-kit.spec.js`
