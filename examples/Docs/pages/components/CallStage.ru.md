<!-- generated -->
# CallStage

Сцена видеозвонка; сами медиа — дело Приложения. Слоты: main (видео впереди: докладчик, показанный экран), participants (их CallTile), self (своё видео в углу поверх сцены; перетаскивается в другой угол — событие corner), controls (CallControls), side (боковая панель: чат, участники; видна при Side), status (время, запись). Layout: grid (столько колонок, сколько нужно плиткам; больше PerPage — страницы: Page, кнопки по бокам, событие page), speaker (main крупно, участники полосой под ним) или screen (main крупно, участники колонкой сбоку).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Layout` | `'grid'` |
| `Side` | `false` |
| `PerPage` | `0` |
| `Page` | `0` |

## События

- `page`: Показана другая страница сетки: {Page}.
- `corner`: Своё видео перетащено в другой угол: {Corner}.

## Слоты

`status`, `main`, `participants`, `self`, `side`, `controls`

## Пример

```example
<RadioGroup Variant="segmented" Label="Layout" [options]="Layouts" [value]="Layout" (change)="Laid" />
<div style="height: 360px; margin-top: 12px;">
	<CallStage [layout]="Layout">
		<CallTile slot="main" Name="Ada Lovelace" Camera="false" Speaking="true" Pinned="true" />
		<CallTile slot="participants" *for="person of People" [name]="person" Camera="false" />
		<CallTile slot="self" Name="Me" Self="true" Camera="false" />
		<CallControls slot="controls" [hide]="['chat', 'people']" />
	</CallStage>
</div>
<script>
({
	Layout: 'speaker',
	Layouts: [{Value: 'grid', Label: 'Grid'}, {Value: 'speaker', Label: 'Speaker'}, {Value: 'screen', Label: 'Screen'}],
	People: ['Alan Turing', 'Grace Hopper', 'Edsger Dijkstra'],

	Laid: function (value) {
		this.Layout = value;
	}
})
</script>
```
