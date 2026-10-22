<!-- generated -->
# NumberInput

Числовое поле. Value — число или null. Min и Max ограничивают его, Step — шаг стрелок (с Shift — десять шагов) и кнопок рядом с полем (Controls false их скрывает), Precision — сколько знаков после запятой сохраняется. Ввести можно только цифры, одну точку (запятая становится точкой) и минус в начале; при подтверждении значение ограничивается и округляется. Prefix и Suffix стоят внутри поля ('$', 'кг'). Size, Shape, Placeholder, Name, Disabled, ReadOnly и Invalid — как в Input. События: input (Value, при вводе), change (Value, при подтверждении).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `null` |
| `Min` | `null` |
| `Max` | `null` |
| `Step` | `1` |
| `Precision` | `null` |
| `Placeholder` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Prefix` | `''` |
| `Suffix` | `''` |
| `Name` | `null` |
| `Controls` | `true` |
| `Disabled` | `false` |
| `ReadOnly` | `false` |
| `Invalid` | `false` |

## События

`input`, `change`

## Пример

```example
<Field Label="Price"><NumberInput [value]="Price" Prefix="$" Precision="2" Step="0.5" Min="0" (change)="Priced" /></Field>
<Field Label="Weight"><NumberInput Value="70" Suffix="kg" Min="1" Max="300" /></Field>
<Field Label="Quantity" Hint="Without the buttons"><NumberInput Value="3" Controls="false" /></Field>
<p class="elemenx-text small muted">Price: {{Price === null ? 'empty' : Price}} · the arrows step, Shift ten steps.</p>
<script>
({
	Price: 19.99,

	Priced: function (value) {
		this.Price = value;
	}
})
</script>
```
