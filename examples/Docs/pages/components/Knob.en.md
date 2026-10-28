<!-- generated -->
# Knob

A knob: a rotary input with the look of the dial Meter, an open ring of three quarters around a cap with a pointer. Value between Min and Max, in steps of Step. The ring fills from Origin (Min when null; the middle of a range from -100 to 100 for a pan, say) to the value. Ticks puts that many ticks along the ring; ShowValue shows the value and Unit under the cap. Dragging up or to the right turns it up (Sensitivity pixels for the whole range); the arrows (Step), Page Up/Down (ten steps), Home and End turn it from the keyboard, and so does the wheel while it has the focus. A double click sets it back to Default, when there is one. Events: input while turning, change on release.

## Properties

| Property | Default |
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

## Events

- `input`: The value changed while turning: Value.
- `change`: The value was committed (released): Value.

## Example

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

## Tests

- [Knob turns by its keys in Steps within Min and Max, tells input and change, and goes back to Default on a double click](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L37) — `tests/regression/library-controls.test.js`
