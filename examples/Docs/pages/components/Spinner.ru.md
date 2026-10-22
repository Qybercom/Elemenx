<!-- generated -->
# Spinner

Индикатор занятости: вращающееся кольцо. Size: small (16 пикселей), medium (24) или large (40). Label — что о нём скажут экранные читалки (по умолчанию фраза языка); ShowLabel показывает подпись и рядом с кольцом.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Size` | `'medium'` |
| `Label` | `''` |
| `ShowLabel` | `false` |

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Spinner Size="small" />
	<Spinner />
	<Spinner Size="large" />
	<Spinner Label="Saving" ShowLabel="true" />
</div>
<Button [label]="Loading ? 'Loading...' : 'Load'" (click)="Load" />
<Spinner *if="Loading" Label="Loading the list" ShowLabel="true" />
<script>
({
	Loading: false,

	Load: function () {
		var self = this;

		this.Loading = true;

		setTimeout(function () {
			self.Loading = false;
		}, 1500);
	}
})
</script>
```
