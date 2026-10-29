<!-- generated -->
# Designer

Документ конструктора страниц, общий для его компонентов (DesignerPalette, DesignerCanvas, DesignerTree, DesignerInspector): дерево узлов под корнем (страницей), каждый — вид палитры со своими свойствами, текстом, размещением (Style) и детьми, и выбранный узел. Он меняется только своими методами; каждое изменение сохраняется в истории (Undo, Redo) и в хранилище браузера (StorageKey), а слушатели узнают о каждом изменении (OnChange).

- Виды — классы раскладок ElemenxUI (экран, строка, заголовок, таблица...) с их модификаторами в виде полей и каждый компонент библиотеки по тому, что он объявляет в $Meta: data/meta.json библиотеки, который делает elemenx meta. Load(callback) читает его один раз (Ready() говорит, что он на месте); Use(meta) даёт его вместо этого.
- Узел — {ID, Kind, Props, Text, Slot, Style, Children}: Slot — именованный слот родителя, куда он попадает ("" — слот по умолчанию); Style хранит его размещение (padding, margin, размер с наименьшим и наибольшим, а во flex-контейнере ещё направление, перенос, align-items, justify-content и gap), которое задаётся в строке: у его элемента или у div вокруг компонента. SetStyle(id, property, value) задаёт одно из свойств Layout.
- Компонент, чьи $Meta называют его детей (Children: Tab в Tabs), держит их как узлы: вставленный ребёнок получает ID и имя (tab-2, Tab 2), а на холсте компонент показывает того ребёнка, в котором находится выделение (своё свойство Current).
- Literal(value) записывает значение как исходный код выражения ({ID: 'a'}); Parse(expression) читает его обратно.
- Kinds() перечисляет виды по группам; Kind(id) — один вид: {ID, Group, Icon, Tag, Component, Container, Flex, Text, Description, Props (первые значения), Fields ([{Name, Type, Options, Default, Description}]), Slots}. Label(kind) и GroupLabel(group) называют их на языке страницы; Slots(id) — именованные слоты родителя узла.
- Insert(kind, parent, index), Move(id, parent, index), Remove(id), Duplicate(id), Set(id, name, value), SetStyle(id, property, value), Clear(); Select(id) и Selected() — для выбранного узла.
- Template() — документ как шаблон Elemenx; Template(true, empty) — то же для холста: каждый узел в элементе, который его называет (data-designer-id), а пустой контейнер содержит текст empty.
- Правила CSS страницы по контексту: Rules(); Rule(context) — правило контекста {Who: node, kind или within, Node, Class, Parent, State, Width, Theme}; SetRule(context, property, value) задаёт его свойство (правило появляется с первым свойством и исчезает с последним); RootClass(id) — класс элемента узла (elemenx-button), который называет правило его вида. Узел со своими правилами получает класс page-<его ID> (у компонента — на div вокруг него). Template() пишет правила первыми в <style> (ширины — через @media), а для холста — внутрь его страницы (ширины — через @container).
- Import(text) читает шаблон обратно вместе с правилами его <style> (непонятные правила сохраняются как есть): виды палитры там, где элемент им соответствует, а любой другой элемент — как есть.
- Свойство, которое компонент объявляет как Body (Value у Markdown, CodeView), — многострочный текст: пишется в тело элемента (с отступом шаблона, тег в нём — как &lt;) и читается из него обратно.
- Проекты, редактируемый среди них, каждый хранится в хранилище браузера (ProjectsKey): Projects() перечисляет их, Create(mode, name) создаёт проект своего типа, который не меняется: template (одна страница), component (компонент с публичными свойствами и слотами) или application (страницы и компоненты, маршруты, гварды и настройки приложения); Switch(id) открывает другой, RemoveProject(id) удаляет; ExportProject() — редактируемый проект как текст файла, ImportProject(text) читает его обратно как новый проект.
- Project() — редактируемый проект: {ID, Mode, Name, Settings, Current, Tabs, Documents, Routes, Guards}. Документ — {ID, Type (page или component), Name, Title (у страницы), Description и Props ([{Name, Type, Default, Options, Description}], у компонента), Slots (слоты его элементов Slot, '' — по умолчанию), Outlet (есть ли в нём место страницы), Origin (компонент файлов, копией которого он сделан, '' — ничей)}; Opened() — ID редактируемого, Tabs — открытые во вкладках. AddDocument(type, name), RemoveDocument(id) (не компонент, который держит другой документ: их называет Used(id)), Open(id) (во вкладке; у каждого документа своя история), Close(id) (его вкладку), SetDocument(id, name, value); Source(id) — шаблон документа. Map() — карта страниц приложения: [{ID, Name, Paths (его маршруты), Template (как его показывает холст), Links ([{Node, Page}]: элемент, Href которого совпадает с маршрутом другой страницы)}], в порядке маршрутов.
- Маршруты приложения: [{ID, Path, Page, Guards, Failed}], AddRoute(path, page), SetRoute(id, name, value), RemoveRoute(id); его гварды — [{Name, Description, Code}] (Code — тело функции гварда), AddGuard(name), SetGuard(name, field, value), RemoveGuard(name); его настройки — SetSetting(name, value): Name, Title, Description, Icon, Language, Theme, Router, Component (компонент, внутри которого страницы), NotFound и заставка страницы: Splash ('true' или ''), SplashImage, SplashBackground, SplashColor, SplashText, SplashSpinner, SplashMinTime и SplashHTML (её собственное содержимое); и его установка как приложения системы: PWA ('true' или ''), PWAShortName, PWAIcon, PWATheme, PWADisplay, PWAOffline ('true' или '') и PWAUpdate (auto, prompt или manual).
- В приложении компоненты проекта — виды палитры (группа project), которые может взять редактируемый документ, кроме него самого и тех, что держат его; на холсте каждый работает как компонент, сделанный из своего документа. Вид slot (только в компоненте) отмечает, куда компонент помещает переданное ему содержимое, вид outlet (компонент приложения) — куда идут страницы маршрутов.
- Проект другого места (elemenx designer): Scope(name) хранит его проекты отдельно, Extend(components) даёт его компоненты (группа палитры files), а Copy(name) делает один из них компонентом проекта для правки (Origin — его имя): узлы его шаблона, тексты которого сохраняют свои выражения, а на холсте — определение, с которым он пришёл.

## Методы

- `Load(callback)`
- `Use(meta)`
- `Literal(value)`
- `Parse(expression)`
- `Ready()`
- `Kinds()`
- `Kind(id)`
- `Label(id)`
- `GroupLabel(group)`
- `Slots(id)`
- `Select(id)`
- `Selected()`
- `Insert(kind, parent, index)`
- `Move(id, parent, index)`
- `Remove(id)`
- `Duplicate(id)`
- `Set(id, name, value)`
- `SetStyle(id, property, value)`
- `Clear()`
- `Template(canvas, empty)`
- `Import(source)`
- `Rules()`
- `Rule(context)`
- `SetRule(context, property, value)`
- `RootClass(id)`
- `Project()`
- `Opened()`
- `Projects()`
- `Create(mode, name)`
- `Switch(id)`
- `RemoveProject(id)`
- `ExportProject()`
- `ImportProject(text)`
- `AddDocument(type, name)`
- `Used(id)`
- `RemoveDocument(id)`
- `Open(id)`
- `Close(id)`
- `SetDocument(id, name, value)`
- `AddRoute(path, page)`
- `SetRoute(id, name, value)`
- `RemoveRoute(id)`
- `AddGuard(name)`
- `SetGuard(name, field, value)`
- `RemoveGuard(name)`
- `SetSetting(name, value)`
- `Source(id)`
- `Map()`
- `Extend(components)`
- `Copy(name)`
- `Scope(name)`

## Пример

```example
<style>
	.designer-demo {
		display: grid;
		grid-template-columns: 240px minmax(0, 1fr) 260px;
		gap: 8px;
		height: 520px;
	}

	.designer-demo-side {
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: auto;
		border: 1px solid var(--elemenx-border);
		border-radius: var(--elemenx-radius);
	}

	.designer-demo-tree {
		flex: 0 0 auto;
		max-height: 180px;
		overflow: auto;
		border-bottom: 1px solid var(--elemenx-border);
	}

	.designer-demo-canvas {
		display: flex;
		min-width: 0;
	}
</style>
<div class="designer-demo">
	<div class="designer-demo-side">
		<div class="designer-demo-tree"><DesignerTree /></div>
		<DesignerPalette />
	</div>
	<div class="designer-demo-canvas"><DesignerCanvas Width="desktop" /></div>
	<div class="designer-demo-side"><DesignerInspector /></div>
</div>
<Button Icon="code" Size="small" Label="Template" (click)="Show" />
<CodeView *if="Code" Language="html" Fold="true" [value]="Code" />
<script>
({
	Code: '',

	/* A first page, when the Designer has none yet (it keeps its document in the storage of the browser). */
	$OnCreate: function () {
		var designer = this.$Service('Designer');

		designer.Load(function (error) {
			if (!error && !designer.Count())
				designer.Import('<div class="elemenx-column" style="padding: 16px">\n\t<h2>Sign in</h2>\n\t<Field Label="Email"><Input Placeholder="ada@example.com" /></Field>\n\t<Button Label="Continue" Variant="primary" />\n</div>');
		});
	},

	Show: function () {
		this.Code = this.$Service('Designer').Template();
	}
})
</script>
```

## Тесты

- [keeps data/meta.json of ElemenxUI, where the Designer Service reads it, as elemenx meta makes it now](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cli-meta.test.js#L202) — `tests/regression/cli-meta.test.js`
- [describes its Applications with their routes and guards, and its Components, Services and Guards from their files](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-cli.test.js#L59) — `tests/regression/designer-cli.test.js`
- [answers its description and its files, read only, and nothing outside the project or in node_modules](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-cli.test.js#L86) — `tests/regression/designer-cli.test.js`
- [gives the page of the Designer the description as a script, before the application starts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-cli.test.js#L116) — `tests/regression/designer-cli.test.js`
- [takes a project kept before as the first of the projects, its routes from its pages](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L22) — `tests/regression/designer-project.test.js`
- [makes a project of a mode that stays its own: an application of a page on /, a component, a template](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L37) — `tests/regression/designer-project.test.js`
- [opens documents in tabs, each with its tree, and closes them, never the last one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L65) — `tests/regression/designer-project.test.js`
- [adds a component with a slot: the slot is a kind of a component only, its name what the component makes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L91) — `tests/regression/designer-project.test.js`
- [declares the props of a component, which become the fields of its kind on the pages](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L115) — `tests/regression/designer-project.test.js`
- [shows a component of the project on the canvas as a Component made of its document](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L144) — `tests/regression/designer-project.test.js`
- [never puts a component into itself, nor into one it holds; renames it where it is held, and keeps one that is held](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L162) — `tests/regression/designer-project.test.js`
- [keeps a history for each document](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L187) — `tests/regression/designer-project.test.js`

+8 ещё в тех же файлах
