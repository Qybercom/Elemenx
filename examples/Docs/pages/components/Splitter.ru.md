<!-- generated -->
# Splitter

Две панели с перетаскиваемым разделителем. Direction: horizontal (рядом) или vertical (одна над другой). Size — размер первой панели в пикселях; Min и Max ограничивают его. Слоты: first, second. Событие resize сообщает новый Size, когда разделитель отпущен.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Direction` | `'horizontal'` |
| `Size` | `240` |
| `Min` | `64` |
| `Max` | `null` |

## События

`resize`

## Слоты

`first`, `second`

## Пример

```example
<div class="docs-frame" style="height: 200px;">
	<Splitter Size="180" Min="80" Max="400" (resize)="Resized">
		<div slot="first" style="padding: 12px;"><strong>Files</strong><p class="elemenx-text small muted">Drag the divider.</p></div>
		<div slot="second" style="padding: 12px;"><strong>Editor</strong><p class="elemenx-text small muted">The first pane is {{Size}} pixels wide.</p></div>
	</Splitter>
</div>
<script>
({
	Size: 180,

	Resized: function (size) {
		this.Size = size;
	}
})
</script>
```
