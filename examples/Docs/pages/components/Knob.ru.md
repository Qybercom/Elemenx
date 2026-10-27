<!-- generated -->
# Knob

Крутилка: поворотный регулятор в виде Meter-циферблата — открытое кольцо в три четверти вокруг колпачка с указателем. Value между Min и Max с шагом Step. Кольцо заполняется от Origin (Min, если null; например, середина диапазона от −100 до 100 для панорамы) до значения. Ticks ставит столько делений вдоль кольца; ShowValue показывает значение и Unit под колпачком. Перетаскивание вверх или вправо прибавляет (Sensitivity пикселей на весь диапазон); стрелки (Step), Page Up/Down (десять шагов), Home и End крутят с клавиатуры, как и колесо мыши в фокусе. Двойной щелчок возвращает Default, если он задан. События: input при вращении, change при отпускании.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `0` |
| `Min` | `0` |
| `Max` | `100` |
| `Step` | `1` |
| `Origin` | `null` |
| `Default` | `null` |
| `Ticks` | `0` |
| `Label` | `''` |
| `Unit` | `''` |
| `ShowValue` | `true` |
| `Size` | `'medium'` |
| `Sensitivity` | `200` |
| `Disabled` | `false` |

## События

- `input`: Значение изменилось при вращении: Value.
- `change`: Значение зафиксировано (отпущено): Value.

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Knob Label="Gain" [value]="Gain" Min="0" Max="100" Unit="%" ShowValue="true" Default="50" (input)="Gained" />
	<Knob Label="Pan" [value]="Pan" Min="-100" Max="100" Origin="0" Default="0" ShowValue="true" (input)="Panned" />
	<Knob Label="Mode" Value="2" Min="0" Max="4" Step="1" Ticks="5" ShowValue="true" Size="small" />
</div>
<p class="elemenx-text small muted">Gain {{Gain}}%, pan {{Pan}}. Drag up or right, use the arrows or the wheel; a double click resets.</p>
<script>
({
	Gain: 70,
	Pan: -20,

	Gained: function (value) {
		this.Gain = value;
	},

	Panned: function (value) {
		this.Pan = value;
	}
})
</script>
```
