<!-- generated -->
# RibbonGroup

Группа команд RibbonTab: <RibbonGroup Title="Clipboard" Icon="paste">. Её команды заполняют колонки по три строки: большая RibbonButton занимает целую колонку, маленькие кнопки и другие элементы — по три в колонке. Когда ленте тесно, она постепенно сжимает группы — сначала с наименьшим Priority, из равных — правые: большие кнопки становятся маленькими, затем пропадают подписи, затем группа становится одной кнопкой (Icon и Title), открывающей свои команды на панели. Launcher добавляет маленькую кнопку в углу заголовка, открывающую полные настройки группы: событие launch.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Priority` | `0` |
| `Launcher` | `false` |

## События

`launch`

## Слоты

по умолчанию

## Пример

```example
<div class="docs-frame" style="height: 220px;">
	<Workspace Variant="ribbon">
		<div slot="header" class="elemenx-container fill" style="gap: 8px;"><Icon Name="files:docx" Size="16" /><span class="elemenx-spacer"></span><span class="elemenx-label">Report.docx — Writer</span><span class="elemenx-spacer"></span></div>
		<Ribbon slot="ribbon" [tab]="Tab" (tab)="TabChanged" (command)="Command">
			<RibbonButton slot="quick" ID="save" Label="Save" Icon="save" Size="icon" />
			<RibbonButton slot="quick" ID="undo" Label="Undo" Icon="undo" Size="icon" />
			<RibbonButton slot="end" ID="share" Label="Share" Icon="share" />

			<RibbonTab ID="home" Title="Home" KeyTip="H">
				<RibbonGroup Title="Clipboard" Icon="paste" Launcher="true" Priority="2" (launch)="Launched">
					<RibbonButton ID="paste" Label="Paste" Icon="paste" Size="large" Split="true" [items]="[{ID: 'paste-text', Label: 'Paste as text'}, {ID: 'paste-special', Label: 'Paste special...'}]" />
					<RibbonButton ID="cut" Label="Cut" Icon="cut" />
					<RibbonButton ID="copy" Label="Copy" Icon="copy" />
				</RibbonGroup>
				<RibbonGroup Title="Font" Icon="text-color" Priority="1">
					<div class="elemenx-ribbon-row">
						<RibbonButton ID="bold" Label="Bold" Icon="bold" Size="icon" Toggle="true" [pressed]="Bold" (click)="BoldToggled" />
						<RibbonButton ID="italic" Label="Italic" Icon="italic" Size="icon" Toggle="true" />
						<RibbonButton ID="underline" Label="Underline" Icon="underline" Size="icon" Toggle="true" />
					</div>
				</RibbonGroup>
				<RibbonGroup Title="Styles" Icon="color" Priority="3">
					<RibbonGallery ID="style" Label="Styles" Columns="3" [items]="Styles" [value]="Style" (select)="StyleChosen" />
				</RibbonGroup>
			</RibbonTab>
			<RibbonTab ID="insert" Title="Insert" KeyTip="N">
				<RibbonGroup Title="Illustrations" Icon="image">
					<RibbonButton ID="picture" Label="Pictures" Icon="image" Size="large" />
					<RibbonButton ID="chart" Label="Chart" Icon="chart" Size="large" />
				</RibbonGroup>
			</RibbonTab>
			<RibbonTab ID="table" Title="Table design" Contextual="true" Context="Table tools" Color="#3f6c9e" *if="TableSelected">
				<RibbonGroup Title="Rows" Icon="table">
					<RibbonButton ID="row-above" Label="Insert above" Icon="arrow-up" />
					<RibbonButton ID="row-below" Label="Insert below" Icon="arrow-down" />
				</RibbonGroup>
			</RibbonTab>
		</Ribbon>
		<div slot="main" class="elemenx-column fill" style="padding: 12px;"><p class="elemenx-text small">Last command: {{Last}} · Alt shows the key tips</p><p class="elemenx-text small muted">Narrow the window: the groups shrink, Styles first (Priority 3), Font last.</p></div>
	</Workspace>
</div>
<script>
({
	Tab: 'home',
	Bold: false,
	Last: '—',
	Style: 'normal',
	TableSelected: false,
	Styles: [
		{ID: 'normal', Label: 'Normal', Preview: 'AaBbCc'},
		{ID: 'heading', Label: 'Heading', Preview: 'AaBb', Style: 'font-size: 16px; font-weight: 600; color: var(--elemenx-info)'},
		{ID: 'title', Label: 'Title', Preview: 'Aa', Style: 'font-size: 20px'},
		{ID: 'quote', Label: 'Quote', Preview: 'AaBbC', Style: 'font-style: italic'}
	],

	TabChanged: function (event) {
		this.Tab = event.ID;
	},

	Command: function (event) {
		this.Last = event.ID + (event.Item && event.Item.ID ? ' / ' + event.Item.ID : '');
	},

	BoldToggled: function (event) {
		this.Bold = event.Pressed;
	},

	StyleChosen: function (event) {
		this.Style = event.ID;
	},

	Launched: function () {
		this.Last = 'the dialog of the group Clipboard';
	},

	TableToggled: function (value) {
		this.TableSelected = value;
	}
})
</script>
```
