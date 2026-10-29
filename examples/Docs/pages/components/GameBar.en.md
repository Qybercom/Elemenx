<!-- generated -->
# GameBar

A bar of a game: health, mana, experience, stamina or any other amount. Value of Max; Kind (health, mana, experience, stamina, or any name: its color is --elemenx-game-<Kind>, or Color); Label and ShowValue; Segments draws that many parts; Size (small, medium, large). A loss leaves a trail that follows a moment later (the damage), a gain fills at once.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `0` |
| `Max` | `100` |
| `Kind` | `'health'` |
| `Label` | `''` |
| `ShowValue` | `true` |
| `Segments` | `0` |
| `Size` | `'medium'` |
| `Color` | `''` |

## Example

```example
<div class="elemenx-game-panel docs-stack" style="max-width: 320px;">
	<GameBar Kind="health" [value]="Health" Max="100" Label="Health" />
	<GameBar Kind="mana" Value="30" Max="80" Label="Mana" Segments="8" />
	<GameBar Kind="experience" Value="640" Max="1000" Label="Experience" Size="small" />
</div>
<Button Label="Hit for 15" Variant="danger" (click)="Hit" />
<Button Label="Heal" (click)="Heal" />
<script>
({
	Health: 82,

	Hit: function () {
		this.Health = Math.max(0, this.Health - 15);
	},

	Heal: function () {
		this.Health = Math.min(100, this.Health + 25);
	}
})
</script>
```

## Tests

- [has every component of ElemenxUI from its $Meta and the classes of its layouts on the Insert tab, with a search](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L360) — `tests/examples/designer.spec.js`
