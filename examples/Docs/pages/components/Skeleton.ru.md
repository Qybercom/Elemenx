<!-- generated -->
# Skeleton

Заглушка загружающегося содержимого: мерцающие серые фигуры на месте и в размере того, что придёт. Shape: text (Lines строк, последняя короче), rect (картинка, карточка) или circle (аватар); Width и Height — в единицах CSS ('100%', '48px'). Сложите несколько — получится скелет карточки или строки.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Shape` | `'text'` |
| `Lines` | `3` |
| `Width` | `''` |
| `Height` | `''` |

## Пример

```example
<div class="elemenx-card docs-stack" style="padding: 12px; max-width: 360px;" *if="Loading">
	<div class="elemenx-container" style="gap: 8px;"><Skeleton Shape="circle" Width="40px" Height="40px" /><Skeleton Lines="2" Width="200px" /></div>
	<Skeleton Shape="rect" Height="120px" />
	<Skeleton Lines="3" />
</div>
<div class="elemenx-card docs-stack" style="padding: 12px; max-width: 360px;" *if="!Loading">
	<div class="elemenx-container" style="gap: 8px;"><Avatar Name="Ada Lovelace" /><strong>Ada Lovelace</strong></div>
	<img src="/data/cards/mountains.svg" alt="" style="width: 100%; height: 120px; object-fit: cover;" />
	<p class="elemenx-text">The card has loaded.</p>
</div>
<Button [label]="Loading ? 'Show the content' : 'Show the skeleton'" (click)="Toggle" />
<script>
({
	Loading: true,

	Toggle: function () {
		this.Loading = !this.Loading;
	}
})
</script>
```
