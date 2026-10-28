<!-- generated -->
# Designer

The document of a designer of pages, shared by its components (DesignerPalette, DesignerCanvas, DesignerTree, DesignerInspector): a tree of nodes under a root (the page), each a kind of the palette with its props, its text, its layout (Style) and its children, and the selected node. It changes through its methods only, each change kept in the history (Undo, Redo) and in the storage of the browser (StorageKey), and listeners hear of every change (OnChange).

- The kinds are the classes of the layouts of ElemenxUI (a screen, a row, a heading, a table...), their modifiers as fields, and every Component of the Library from what it declares in $Meta: data/meta.json of the Library, made by elemenx meta. Load(callback) reads it once (Ready() tells it is there); Use(meta) gives it instead.
- A node is {ID, Kind, Props, Text, Slot, Style, Children}: Slot is the named slot of its parent it goes to, '' for the default one; Style holds its layout (padding, margin, the size with its least and greatest and, in a flex container, its direction, its wrap, align-items, justify-content and gap), set inline: on its element, or on a div around a Component. SetStyle(id, property, value) sets one of Layout.
- A Component whose $Meta names its Children (Tab in Tabs) holds them as nodes: a child inserted gets an ID and a name (tab-2, Tab 2), and on the canvas the component shows the child the selection is in (its Current prop).
- A prop its Component declares Body (the Value of a Markdown, of a CodeView) is a text of many lines, written as the body of the element (indented as the template, a tag in it as &lt;) and read back from it.
- Literal(value) writes a value as the source of an expression ({ID: 'a'}); Parse(expression) reads it back.
- Kinds() lists the kinds by group; Kind(id) is one: {ID, Group, Icon, Tag, Component, Container, Flex, Text, Description, Props (the first values), Fields ([{Name, Type, Options, Default, Description}]), Slots}. Label(kind) and GroupLabel(group) name them in the language of the page; Slots(id) are the named slots of the parent of a node.
- Insert(kind, parent, index), Move(id, parent, index), Remove(id), Duplicate(id), Set(id, name, value), SetStyle(id, property, value), Clear(); Select(id) and Selected() for the selected node.
- The rules of CSS of the page, by context: Rules(); Rule(context) the one of {Who: node, kind or within, Node, Class, Parent, State, Width, Theme}; SetRule(context, property, value) sets a property of it (the rule comes with its first property and goes with its last); RootClass(id) is the class of the element of a node (elemenx-button), what a rule of its kind names. A node with rules of its own takes the class page-<its ID> (on a div around a Component).
- Template() is the document as a template of Elemenx, its rules first in a <style> (@media for the widths); Template(true, empty) the same for a canvas, every node in an element that names it (data-designer-id), a container marked (data-designer-container, data-designer-gap), an empty one holding the text empty (none when it is ''), and the rules inside the page of the canvas (@container for the widths).
- Import(text) reads a template back: the kinds of the palette where an element is one, any other element as it is, and the rules of its <style> (those it does not understand kept as they are).
- Projects, the one being edited among them, each kept in the storage of the browser (ProjectsKey): Projects() lists them, Create(mode, name) makes one of a mode that stays its own, template (one page), component (a Component with its public props and slots) or application (pages and components, routes, guards and the settings of the Application), Switch(id) edits another, RemoveProject(id) takes one away; ExportProject() is the one being edited as the text of a file, ImportProject(text) reads one back as a new project.
- Project() is the project being edited: {ID, Mode, Name, Settings, Current, Tabs, Documents, Routes, Guards}. A document is {ID, Type (page or component), Name, Title (a page), Description and Props ([{Name, Type, Default, Options, Description}], a component), Slots (those its Slot elements make, '' the default one), Outlet (whether it holds the place of the pages)}; Opened() is the ID of the one being edited, Tabs those open. AddDocument(type, name), RemoveDocument(id) (not a component another document holds: Used(id) names them), Open(id) (in a tab; each document keeps its own history), Close(id) (its tab), SetDocument(id, name, value); Source(id) is the template of a document.
- The routes of an application: [{ID, Path, Page, Guards, Failed}], AddRoute(path, page), SetRoute(id, name, value), RemoveRoute(id); its guards, [{Name, Description, Code}] (Code the body of the function of the guard), AddGuard(name), SetGuard(name, field, value), RemoveGuard(name); its settings, SetSetting(name, value): Name, Title, Description, Icon, Language, Theme, Router, Component (the component that holds the pages), NotFound and the splash of its page: Splash ('true' or ''), SplashImage, SplashBackground, SplashColor, SplashText, SplashSpinner, SplashMinTime and SplashHTML (its own content); and its install as an application of the system: PWA ('true' or ''), PWAShortName, PWAIcon, PWATheme, PWADisplay, PWAOffline ('true' or '') and PWAUpdate (auto, prompt or manual).
- In an application the components of the project are kinds of the palette (group project) the document being edited may take, but itself and those holding it; on the canvas each runs as a Component made of its document. The kind slot (a component only) marks where the component puts what it is given, the kind outlet (a component of an application) where the pages of the routes go.

## Methods

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

## Example

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

## Tests

- [keeps data/meta.json of ElemenxUI, where the Designer Service reads it, as elemenx meta makes it now](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cli-meta.test.js#L202) — `tests/regression/cli-meta.test.js`
- [takes a project kept before as the first of the projects, its routes from its pages](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L22) — `tests/regression/designer-project.test.js`
- [makes a project of a mode that stays its own: an application of a page on /, a component, a template](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L37) — `tests/regression/designer-project.test.js`
- [opens documents in tabs, each with its tree, and closes them, never the last one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L65) — `tests/regression/designer-project.test.js`
- [adds a component with a slot: the slot is a kind of a component only, its name what the component makes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L91) — `tests/regression/designer-project.test.js`
- [declares the props of a component, which become the fields of its kind on the pages](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L115) — `tests/regression/designer-project.test.js`
- [shows a component of the project on the canvas as a Component made of its document](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L144) — `tests/regression/designer-project.test.js`
- [never puts a component into itself, nor into one it holds; renames it where it is held, and keeps one that is held](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L162) — `tests/regression/designer-project.test.js`
- [keeps a history for each document](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L187) — `tests/regression/designer-project.test.js`
- [routes the pages of an application, guarded by the guards of the project, a refusal shown by a page](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L204) — `tests/regression/designer-project.test.js`
- [sets the component of the Application, one that holds the place of the pages, and the other settings](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L253) — `tests/regression/designer-project.test.js`
- [writes the project into the text of a file and reads it back as a project of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L285) — `tests/regression/designer-project.test.js`
