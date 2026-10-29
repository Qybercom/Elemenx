<!-- generated -->
# TileGrid

Группы плиток на сетке ячеек по 48px, как на начальном экране. Groups: [{ID, Title, Tiles, Locked, Actions, Element, Render}]. Шапка группы показывает Actions ([{ID, Icon, Label, Title, Run}], кнопки, отправляющие groupaction с {Group, Action} и вызывающие Run(group)) и своё содержимое: Element (узел DOM) или Render(container, group). Locked-группа сохраняет свои плитки и не принимает чужие. Плитка — {ID, Title, Icon, Size (small 1x1, medium 2x2, wide 4x2, tall 2x4, large 4x4, xlarge 6x4), Width и Height (любое число ячеек, поверх Size), Row, Column, Color, Badge, Text, Class, Locked, Element, Render}. Row и Column ставят плитку на ячейки её группы (с 0); плитка без них занимает первое свободное место. Element или Render(container, tile) заменяют иконку и текст своим содержимым, Class добавляет классы, Locked закрепляет плитку на месте.

Columns — ширина группы в ячейках; у группы могут быть свои Columns и Rows (наименьшая высота), а с Editable маркеры на её правом крае, нижнем крае и в углу растягивают её (указателем или стрелками, целыми ячейками, от самой широкой плитки до MaxColumns (0 — без ограничения), от самой нижней плитки вниз); об этом сообщает change. Fit даёт группе не больше столбцов, чем помещается в сетке: на узком экране не поместившиеся плитки занимают свободные места ниже и возвращаются при расширении. Direction 'horizontal' ставит группы в один ряд, как на начальном экране; 'columns' складывает их в колонки, как меню «Пуск» Windows: у группы есть Stack (число) её колонки, а колонки целиком переносятся на новый ряд, когда сетка уже их; плитка, перетащенная над группой или под неё, или рядом с колонкой, начинает там группу (если GroupPolicy не 'none'). В wrap (по умолчанию) стопки переносятся так же, группа — стопка сама по себе, пока над ней или под ней не встанет другая: при GroupPolicy 'between' плитка, перетащенная над группой или под неё, начинает группу в её стопке (место под её нижней плиткой остаётся за группой), а рядом со стопкой — новую стопку. Scroll делает сетку прокручиваемой (задайте ей высоту), а плитка, подтащенная к её краю, прокручивает её. На сенсорном экране палец прокручивает поверх плиток, а неподвижное удержание берёт плитку.

Arrangement() возвращает места плиток и размеры групп ([{ID, Title, Columns, Rows, Stack, Tiles: [{ID, Row, Column, Size, Width, Height}]}]); Restore(arrangement) возвращает их (не названные в нём плитки и группы остаются как есть); Persist (ключ) хранит раскладку в хранилище браузера и восстанавливает её при следующем посещении. Плитка, перетащенная за правый край группы, расширяет её на столбец через GrowDelay миллисекунд (край это показывает), и снова, пока она там остаётся. События: open (плитка, по щелчку или Enter).

Editable позволяет перетаскивать плитки: плитка встаёт на ячейку под левым верхним углом своего призрака и сдвигает вниз плитки на пути — прямо во время движения, так, как сетка будет выглядеть после отпускания; освободившиеся места остаются пустыми. GroupPolicy решает, где перетаскиваемая плитка может начать новую группу: 'end' (рядом с последней группой), 'between' (также между группами) или 'none'; новая группа получает имя NewGroupTitle, о ней сообщает groupcreate ({Group, Tile}). Группа, опустевшая после перетаскивания, исчезает. Событие change несёт новые Groups, каждую плитку изменённой группы с её Row и Column; Escape возвращает всё обратно.

Группы и плитки можно объявить и в шаблоне: <TileGroup ID Title Locked> с дочерними <Tile>, принимающими свойства плитки; разметка внутри <Tile> — её собственное содержимое, привязанное к странице, как любая разметка. Объявления дополняют Groups (<Tile> с ID плитки из Groups передаёт ей свои свойства и содержимое) и следуют за шаблоном: новый <Tile> входит в свою группу, удалённый уходит, изменённое свойство отображается; места плиток, однажды заданные, остаются за сеткой.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Groups` | `[]` |
| `Editable` | `false` |
| `Columns` | `4` |
| `MaxColumns` | `12` |
| `Fit` | `false` |
| `Direction` | `'wrap'` |
| `Scroll` | `false` |
| `Persist` | `''` |
| `GrowDelay` | `500` |
| `GroupPolicy` | `'end'` |
| `NewGroupTitle` | `''` |

## События

- `open`: Нажата плитка: сама плитка.
- `groupaction`: Нажато действие в заголовке группы: {Group, Action}.
- `change`: Плитки или группы перемещены или изменили размер: Groups в текущем виде.
- `groupcreate`: Плитка, брошенная рядом с группами, создала новую группу: {Group, Tile}.

## Слоты

по умолчанию

## Методы

- `Arrangement()`
- `Restore(arrangement)`

## Пример

```example
<TileGrid [groups]="Groups" Editable="true" Fit="true" GroupPolicy="between" (open)="Opened" (change)="Changed" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Drag the tiles; drop one between the groups to start a new group.',
	Groups: [
		{ID: 'work', Title: 'Work', Tiles: [
			{ID: 'mail', Title: 'Mail', Icon: 'mail', Size: 'wide', Badge: 4, Color: '#3f6c9e'},
			{ID: 'calendar', Title: 'Calendar', Icon: 'calendar', Size: 'medium', Color: '#b4483f'},
			{ID: 'tasks', Title: 'Tasks', Icon: 'check', Size: 'medium', Color: '#3d7a54'},
			{ID: 'chat', Title: 'Chat', Icon: 'send', Size: 'small', Color: '#c2477f'}
		]},
		{ID: 'tools', Title: 'Tools', Tiles: [
			{ID: 'terminal', Title: 'Terminal', Icon: 'terminal', Size: 'medium'},
			{ID: 'settings', Title: 'Settings', Icon: 'settings', Size: 'small', Color: '#5f5a54', Locked: true},
			{ID: 'cloud', Title: 'Deployments', Icon: 'cloud', Size: 'wide', Text: 'All 12 services are healthy.', Color: '#3f6c9e'}
		]}
	],

	Opened: function (tile) {
		this.Note = 'Opened: ' + tile.Title;
	},

	Changed: function (groups) {
		this.Groups = groups;
		this.Note = 'Arranged: ' + groups.length + ' groups';
	}
})
</script>
```
