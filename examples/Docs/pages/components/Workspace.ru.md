<!-- generated -->
# Workspace

Рамка приложения в стиле IDE на основе elemenx-screen, elemenx-container и elemenx-column. Слоты: header, ribbon (Ribbon под шапкой), top-stripe (полоса под ними), left-stripe, left, main, bottom, right, right-stripe, bottom-stripe (полоса над строкой состояния) и status. Variant="ribbon" делает рамку приложения в стиле Office: шапка становится тонкой строкой заголовка, сливающейся с Ribbon. Рамка не решает, что в ней: область видна, только пока её слот что-то рисует (поставьте *if на окно инструмента, чтобы открывать и закрывать его), а размер левой, правой и нижней областей меняется перетаскиванием края; событие resize сообщает {Panel, Size}. На узком экране основная область держит 320 пикселей (--elemenx-workspace-main-min), а рамка прокручивается вбок к панелям; в рамке шириной 720 пикселей и меньше основная область занимает всю ширину, а левая и правая панели открываются поверх неё (нажатие на основную область закрывает окна инструментов, которые разместила там рамка).

Окна инструментов, которые раскладывает пользователь: WorkspaceToolWindow с ID в слоте tools размещает рамка. Его Area (left, right или bottom) — откуда оно начинает; кнопка на полосе этой стороны (его Icon, Title и Badge: счётчик, 'dot', 'busy'...) открывает и закрывает его, в области открыто одно окно инструмента за раз (Open открывает его сразу). Пока включено Customize, кнопки перетаскиваются с полосы на полосу (нижняя часть левой полосы — нижняя область) и в пределах порядка: окно инструмента следует за кнопкой. Layout — раскладка: {Areas: {id: область}, Order: [id], Open: {left, right, bottom: id или null}, Sizes: {left, right, bottom: пиксели}}; каждое её изменение (перенос, открытие, изменение размера) отправляет layout с новой раскладкой, а Persist (ключ) хранит её в хранилище браузера до следующего посещения. ResetLayout() возвращает окна инструментов в их исходные области.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Variant` | `''` |
| `Layout` | `null` |
| `Persist` | `''` |
| `Customize` | `false` |

## События

- `layout`: Изменилась раскладка панелей (перенесены, открыты, закрыты, изменён размер): Layout, {Areas, Order, Open, Sizes}.
- `resize`: Размер панели изменён её краем: {Panel, Size}.

## Слоты

`header`, `ribbon`, `top-stripe`, `left-stripe`, `left`, `main`, `bottom`, `right`, `right-stripe`, `bottom-stripe`, `status`, `tools`

## Методы

- `ResetLayout()`

## Пример

```example
<div class="docs-frame tall">
	<Workspace (resize)="Resized">
		<WorkspaceToolbar slot="header" Label="Main toolbar">
			<strong>Elemenx IDE</strong>
			<span class="elemenx-divider vertical"></span>
			<Button Icon="play" Title="Run" Variant="ghost" Size="small" />
			<Button Icon="debug" Title="Debug" Variant="ghost" Size="small" />
			<span class="elemenx-spacer"></span>
			<Button Icon="panel-left" Title="Project" Variant="ghost" Size="small" (click)="ToggleLeft" />
			<Button Icon="panel-bottom" Title="Terminal" Variant="ghost" Size="small" (click)="ToggleBottom" />
		</WorkspaceToolbar>
		<WorkspaceToolWindow slot="left" *if="Left" Title="Project" Icon="folder" Closable="true" (close)="ToggleLeft">
			<Tree [items]="Files" [expanded]="['src']" />
		</WorkspaceToolWindow>
		<div slot="main" class="elemenx-column fill"><CodeView Language="javascript" Value="Elemenx.Component('Hello', {&#10;&#9;Name: 'world'&#10;});" /></div>
		<WorkspaceToolWindow slot="bottom" *if="Bottom" Title="Terminal" Icon="terminal" Closable="true" (close)="ToggleBottom">
			<Terminal [lines]="[{ID: 1, Kind: 'success', Text: 'Test Files  52 passed (52)'}]" />
		</WorkspaceToolWindow>
		<span slot="status">main · {{Note}}</span>
	</Workspace>
</div>
<script>
({
	Left: true,
	Bottom: true,
	Note: 'UTF-8',
	Files: [
		{ID: 'src', Label: 'src', Icon: 'folder-open', Items: [
			{ID: 'app', Label: 'app.js', Icon: 'file-code'},
			{ID: 'style', Label: 'style.css', Icon: 'file-code'}
		]},
		{ID: 'readme', Label: 'README.md', Icon: 'file-text'}
	],

	ToggleLeft: function () {
		this.Left = !this.Left;
	},

	ToggleBottom: function () {
		this.Bottom = !this.Bottom;
	},

	Resized: function (event) {
		this.Note = event.Panel + ' ' + event.Size + 'px';
	}
})
</script>
```
