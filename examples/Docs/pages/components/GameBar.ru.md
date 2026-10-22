<!-- generated -->
# GameBar

Полоса игры: здоровье, мана, опыт, выносливость или любая другая величина. Value из Max; Kind (health, mana, experience, stamina или любое имя: его цвет — --elemenx-game-<Kind> или Color); Label и ShowValue; Segments делит полосу на столько частей; Size (small, medium, large). Потеря оставляет след, который догоняет через мгновение (урон), прибавка заполняется сразу.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `0` |
| `Max` | `100` |
| `Kind` | `'health'` |
| `Label` | `''` |
| `ShowValue` | `true` |
| `Segments` | `0` |
| `Size` | `'medium'` |
| `Color` | `''` |

## Пример

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
