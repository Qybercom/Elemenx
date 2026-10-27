<!-- generated -->
# RibbonGroup

Группа команд RibbonTab: <RibbonGroup Title="Clipboard" Icon="paste">. Её команды заполняют колонки по три строки: большая RibbonButton занимает целую колонку, маленькие кнопки и другие элементы — по три в колонке. Когда ленте тесно, она постепенно сжимает группы — сначала с наименьшим Priority, из равных — правые: большие кнопки становятся маленькими, затем пропадают подписи, затем группа становится одной кнопкой (Icon и Title), открывающей свои команды на панели. Keep не даёт группе сжиматься (поле поиска — то, ради чего вкладка): когда остальные уже по одной кнопке, панель прокручивается. Launcher добавляет маленькую кнопку в углу заголовка, открывающую полные настройки группы: событие launch.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Priority` | `0` |
| `Keep` | `false` |
| `Launcher` | `false` |

## События

- `launch`: Нажата кнопка в углу заголовка: {Title}.

## Слоты

по умолчанию

## Пример

```example
<p class="elemenx-text small">Make the frame narrower (drag its corner): the group of the lowest Priority shrinks first, into one button that opens it. The arrow at the corner of Clipboard is its Launcher.</p>
<div class="docs-frame" style="height: 150px; resize: horizontal; min-width: 160px;">
	<Ribbon Collapsible="false" (command)="Command">
		<RibbonTab ID="home" Title="Home">
			<RibbonGroup Title="Clipboard" Icon="paste" Priority="3" Launcher="true" (launch)="Launched">
				<RibbonButton ID="paste" Label="Paste" Icon="paste" Size="large" />
				<RibbonButton ID="cut" Label="Cut" Icon="cut" />
				<RibbonButton ID="copy" Label="Copy" Icon="copy" />
			</RibbonGroup>
			<RibbonGroup Title="Insert" Icon="add" Priority="2">
				<RibbonButton ID="picture" Label="Picture" Icon="image" Size="large" />
				<RibbonButton ID="table" Label="Table" Icon="table" Size="large" />
			</RibbonGroup>
			<RibbonGroup Title="Share" Icon="share" Priority="1">
				<RibbonButton ID="mail" Label="Mail" Icon="mail" Size="large" />
				<RibbonButton ID="link" Label="Link" Icon="link" Size="large" />
			</RibbonGroup>
		</RibbonTab>
	</Ribbon>
</div>
<p class="elemenx-text small">Last: {{Last}}</p>
<script>
({
	Last: '—',

	Command: function (event) {
		this.Last = event.ID;
	},

	Launched: function () {
		this.Last = 'the launcher of Clipboard';
	}
})
</script>
```
