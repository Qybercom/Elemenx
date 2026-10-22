<!-- generated -->
# *badge

*badge="value" ставит значок в угол любого элемента: пункта панели инструментов, списка, картинки. Значение читает сервис Badges: число (счётчик), 'dot' (что-то новое), 'busy' (выполняется задача: вращающееся кольцо), другой текст или {Value, Tone, Max, Label}; ложное или пустое значение ничего не показывает. Раскладка элемента сохраняется (он становится позиционированным, если ещё не был). Button получает значок через собственное свойство Badge.

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<span *badge="Count" style="padding: 8px;"><Icon Name="mail" Size="24" /></span>
	<span *badge="'dot'" style="padding: 8px;"><Icon Name="bell" Size="24" /></span>
	<span *badge="'busy'" style="padding: 8px;"><Icon Name="cloud" Size="24" /></span>
	<img src="/data/cards/sea.svg" width="64" height="48" alt="" *badge="{Value: 'new', Tone: 'success'}" />
</div>
<Button Label="+1" (click)="More" />
<Button Label="Read all" Variant="ghost" (click)="Read" />
<script>
({
	Count: 3,

	More: function () {
		this.Count++;
	},

	Read: function () {
		this.Count = 0;
	}
})
</script>
```
