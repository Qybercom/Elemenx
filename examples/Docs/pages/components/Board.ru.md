<!-- generated -->
# Board

Бесконечный холст, как в Figma. Его содержимое (слот по умолчанию) живёт в собственных координатах — мире (элементы в нём ставятся через position: absolute, left и top), а холст показывает часть мира, сдвинутую и масштабированную. Колесо двигает его (на тачпаде — двумя пальцами), Ctrl с колесом или щипок масштабируют у указателя, перетаскивание средней кнопкой, с зажатым пробелом или по пустому месту (Drag) двигает вид; в фокусе стрелки двигают его, + и - масштабируют, 0 возвращает масштаб 1, Shift+1 показывает всё содержимое. X и Y — точка мира в левом верхнем углу вида, Zoom — масштаб (MinZoom, MaxZoom); Grid — dots, lines или none с шагом GridSize пикселей мира; Controls показывает кнопки масштаба и его процент (нажатие на процент показывает всё содержимое). Событие view: {X, Y, Zoom}. Методы: ZoomTo(zoom, point), Pan(dx, dy), CenterOn(x, y), FitContent(margin), ToWorld(clientX, clientY), ToScreen(x, y).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `X` | `0` |
| `Y` | `0` |
| `Zoom` | `1` |
| `MinZoom` | `0.1` |
| `MaxZoom` | `8` |
| `Grid` | `'dots'` |
| `GridSize` | `24` |
| `Drag` | `true` |
| `Controls` | `true` |

## События

- `view`: Вид сдвинулся или изменил масштаб: {X, Y, Zoom}.

## Слоты

по умолчанию

## Методы

- `ToWorld(clientX, clientY)`
- `ToScreen(x, y)`
- `ZoomTo(zoom, point)`
- `Pan(dx, dy)`
- `CenterOn(x, y)`
- `FitContent(margin)`

## Пример

```example
<div style="height: 320px; border: 1px solid var(--elemenx-border); border-radius: 8px; overflow: hidden;">
	<Board Grid="dots" Controls="true" (view)="Viewed">
		<div class="elemenx-card" style="position: absolute; left: 40px; top: 40px; width: 180px; padding: 12px;">Drag the empty place to move</div>
		<div class="elemenx-card" style="position: absolute; left: 320px; top: 160px; width: 180px; padding: 12px;">Ctrl and the wheel zoom</div>
		<div class="elemenx-card" style="position: absolute; left: 900px; top: 600px; width: 180px; padding: 12px;">Far away: Shift+1 fits all</div>
	</Board>
</div>
<p class="elemenx-text small muted">X {{View.X}}, Y {{View.Y}}, zoom {{View.Zoom}}</p>
<script>
({
	View: {X: 0, Y: 0, Zoom: 1},

	Viewed: function (view) {
		this.View = {X: Math.round(view.X), Y: Math.round(view.Y), Zoom: Math.round(view.Zoom * 100) / 100};
	}
})
</script>
```

## Тесты

- [moves its world by the wheel, zooms at the pointer with Ctrl, and keeps the point of the world under it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/board.test.js#L54) — `tests/regression/board.test.js`
- [moves by a drag on an empty place, keeps its zoom in bounds, converts its points and fits its content](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/board.test.js#L94) — `tests/regression/board.test.js`
- [asks for a device, opens and claims it, and transfers data in, out and by control](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L178) — `tests/regression/devices.test.js`
- [knows the Components, Services and Directives of the Libraries and of the project](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L46) — `tests/regression/language-server.test.js`
- [goes from $T to elemenx.js and from its key to the phrase of the nearest locales, and tells the phrase in each language](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L234) — `tests/regression/language-server.test.js`
- [tells of a Component, a prop, a directive and a Service on hover, and finds their definitions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L89) — `tests/regression/language-server.test.js`
- [goes from a directive to its definition (the core ones in elemenx.js), and from a prop or an event to its Component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L170) — `tests/regression/language-server.test.js`
