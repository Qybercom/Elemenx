<!-- generated -->
# Window

Окно поверх страницы или своего контейнера: шапка с Title (и Overline над ним, Icon), тело (слот по умолчанию) и подвал (слот footer); слот header добавляет элементы управления в шапку.

- Шапка перемещает окно (Draggable), края и углы меняют его размер (Resizable; MinWidth, MinHeight, MaxWidth, MaxHeight). Шапка в фокусе принимает стрелки: они двигают окно, с Shift — меняют размер.
- Minimize сворачивает его до шапки (Minimizable; повторно — разворачивает), Maximize заполняет границы (Maximizable; также двойное нажатие на шапку), Close скрывает его (Closable; событие close, Open false).
- X, Y, Width и Height размещают его (в пикселях); без X и Y оно встаёт в каскад новых окон. Bounds: 'parent' (позиционированный элемент, в котором оно находится; по умолчанию) или 'viewport' (закреплено в окне браузера). Persist именует окно, чьё место, размер и состояние запоминаются.
- Нажатие или фокус поднимают его над другими окнами (сервис Windows) и делают активным (класс active).
- Variant: 'default' или 'game' — вид игровой темы (токены --elemenx-game-*). Level: 'primary' (главные окна), 'secondary' (меньшие) или 'plain' (диалог, сообщение): тема рисует каждое по-своему.
- HeaderShape 'trapezoid' делает окно папкой: Icon и заголовки на вкладке шириной с заголовок, её конец скошен вниз к телу; слот header и кнопки стоят за скосом, а шапка по-прежнему перемещает окно.
- PopOut добавляет кнопку, переносящую тело в отдельное окно поверх других окон системы (Document Picture-in-Picture: Chrome и Edge; сервис PictureInPicture), и обратно; Popped сообщает, что оно там.
- События: move ({X, Y}), resize ({Width, Height}), minimize, maximize, restore, close, front, popout, popin.
- Методы: Front(), Minimize(), Maximize(), Restore(), Close(), Center().

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Overline` | `''` |
| `Icon` | `''` |
| `Open` | `true` |
| `X` | `null` |
| `Y` | `null` |
| `Width` | `360` |
| `Height` | `null` |
| `MinWidth` | `200` |
| `MinHeight` | `120` |
| `MaxWidth` | `null` |
| `MaxHeight` | `null` |
| `Bounds` | `'parent'` |
| `Draggable` | `true` |
| `Resizable` | `true` |
| `Minimizable` | `true` |
| `Maximizable` | `true` |
| `Closable` | `true` |
| `Minimized` | `false` |
| `Maximized` | `false` |
| `Persist` | `''` |
| `Variant` | `'default'` |
| `Level` | `'primary'` |
| `PopOut` | `false` |
| `Popped` | `false` |
| `HeaderShape` | `'default'` |

## События

- `front`: Окно вышло поверх других окон.
- `restore`: Окно вернулось из свёрнутого или развёрнутого вида.
- `close`: Нажата кнопка закрытия (Open становится false).
- `resize`: Изменился размер: {Width, Height}.
- `move`: Окно сдвинулось: {X, Y}.

## Слоты

`header`, по умолчанию, `footer`

## Методы

- `Front()`
- `Minimize()`
- `Maximize()`
- `Restore()`
- `Close()`
- `Center()`

## Пример

```example
<div class="docs-frame" style="height: 320px;">
	<div style="position: relative; flex: 1 1 auto;">
		<Window *if="Shown" Title="Properties" Overline="Project" Icon="settings" X="16" Y="16" Width="300" Height="220" (close)="Close" (move)="Moved">
			<Properties>
				<Property Label="Name" Value="Elemenx" />
				<Property Label="Files" Value="128" />
			</Properties>
			<Button slot="footer" Label="OK" Variant="primary" (click)="Close" />
		</Window>
		<Window Title="Notes" Icon="edit" HeaderShape="trapezoid" X="340" Y="40" Width="280" Height="180">
			<p class="elemenx-text small">Drag a window by its header, resize it by its edges; a double press on the header maximizes it.</p>
		</Window>
	</div>
</div>
<Button Label="Show Properties" [disabled]="Shown" (click)="Show" />
<span class="elemenx-text small muted">{{Note}}</span>
<script>
({
	Shown: true,
	Note: '',

	Show: function () {
		this.Shown = true;
	},

	Close: function () {
		this.Shown = false;
	},

	Moved: function (place) {
		this.Note = 'Moved to ' + place.X + ', ' + place.Y;
	}
})
</script>
```
