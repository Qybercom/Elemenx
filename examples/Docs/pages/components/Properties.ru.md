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
