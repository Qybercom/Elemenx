<!-- generated -->
# Radio

Одиночная радиокнопка для своих раскладок; RadioGroup рисует весь набор из Options. Checked отмечает её, Value — то, что она означает, Name объединяет её с радиокнопками того же имени (браузер держит отмеченной одну), Label и Description стоят рядом. Variant: default или tile (выбираемая плитка с описанием); Size: small, medium или large; Disabled, Invalid. События: change (Value, когда она отмечена).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Checked` | `false` |
| `Label` | `''` |
| `Description` | `''` |
| `Variant` | `'default'` |
| `Size` | `'medium'` |
| `Name` | `null` |
| `Value` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## События

- `change`: Выбран: Value.

## Слоты

по умолчанию

## Пример

```example
<div class="docs-stack">
	<Radio Name="docs-ship" Value="post" Label="By post" Description="5 to 7 days" [checked]="Ship === 'post'" (change)="Picked" />
	<Radio Name="docs-ship" Value="courier" Label="By courier" Description="Tomorrow" [checked]="Ship === 'courier'" (change)="Picked" />
	<Radio Name="docs-ship" Value="pickup" Label="Pick it up" Disabled="true" />
</div>
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Radio Name="docs-plan" Value="free" Label="Free" Description="One project" Variant="tile" Checked="true" />
	<Radio Name="docs-plan" Value="pro" Label="Pro" Description="Every project" Variant="tile" />
</div>
<p class="elemenx-text small muted">Delivery: {{Ship}}</p>
<script>
({
	Ship: 'post',

	Picked: function (value) {
		this.Ship = value;
	}
})
</script>
```
