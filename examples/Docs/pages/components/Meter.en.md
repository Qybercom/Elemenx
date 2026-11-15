<!-- generated -->
# Meter

A measurement within a known range, like <meter>: Value between Min and Max. Low and High split the range into zones; Optimum tells which zone is good. The good zone shows success, the next one warning, the far one danger. Shape 'bar' draws a bar, across or upwards (Orientation 'vertical'); Shape 'dial' an open ring of three quarters, with a Needle, Ticks along it, and its middle the default slot (or the value when the slot is empty). Marks shows the marks of Low and High (not the Ticks), ShowRange the Min and the Max at the ends, ValuePlacement puts the value on a plate below the meter or in its corner (over the end of a bar; a dial gives the corner up: its ring is shorter, of five eighths).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `0` |
| `Min` | `0` |
| `Max` | `100` |
| `Low` | `null` |
| `High` | `null` |
| `Optimum` | `null` |
| `Label` | `''` |
| `Unit` | `''` |
| `Size` | `'medium'` |
| `ShowValue` | `true` |
| `Orientation` | `'horizontal'` |
| `Shape` | `'bar'` |
| `Needle` | `false` |
| `Ticks` | `0` |
| `Marks` | `true` |
| `ShowRange` | `false` |
| `ValuePlacement` | `'auto'` |

## Slots

default

## Example

```example
<Slider Label="Load" [Min]="0" [Max]="100" [Value]="Number(Load)" (input)="Load = $event" />
<Meter [value]="Number(Load)" Label="CPU" Unit="%" Low="50" High="80" Optimum="20" ShowValue="true" Marks="true" ShowRange="true" />
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Meter [value]="Number(Load)" Shape="dial" Needle="true" Ticks="11" Label="Speed" Unit="km/h" Max="100" Low="60" High="85" Optimum="30" ShowValue="true" />
	<Meter [value]="Number(Load)" Shape="dial" Label="Battery" Unit="%" Low="20" High="60" Optimum="90" ShowValue="true" Size="small" />
	<div style="height: 140px;"><Meter [value]="Number(Load)" Orientation="vertical" Label="Level" Low="30" High="70" Optimum="50" /></div>
</div>
<script>
({
	Load: '42',

	$OnCreate: function () {
		this.Number = function (value) {
			return Number(value);
		};
	}
})
</script>
```

## Tests

- [puts the share of its range on the parts that draw it, its zone and its value told as before](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-meter.test.js#L60) — `tests/regression/library-meter.test.js`
- [shows a value fed on and on at once, with no transition, and glides again when it changes now and then](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-meter.test.js#L85) — `tests/regression/library-meter.test.js`
