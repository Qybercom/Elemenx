<!-- generated -->
# Designer

The document of a designer of pages, shared by its components (DesignerPalette, DesignerCanvas, DesignerTree, DesignerInspector): a tree of nodes under a root (the page), each a kind of the palette with its props, its text, its layout (Style) and its children, and the selected node. It changes through its methods only, each change kept in the history (Undo, Redo) and in the storage of the browser (StorageKey), and listeners hear of every change (OnChange).

- The kinds are the classes of the layouts of ElemenxUI (a screen, a row, a heading, a table...), their modifiers as fields, and every Component of the Library from what it declares in $Meta: data/meta.json of the Library, made by elemenx meta. Load(callback) reads it once (Ready() tells it is there); Use(meta) gives it instead.
- A node is {ID, Kind, Props, Text, Slot, Style, Children}: Slot is the named slot of its parent it goes to, '' for the default one; Style holds its layout (padding, margin, the size with its least and greatest and, in a flex container, its direction, its wrap, align-items, justify-content and gap), set inline: on its element, or on a div around a Component. SetStyle(id, property, value) sets one of Layout.
- A Component whose $Meta names its Children (Tab in Tabs) holds them as nodes: a child inserted gets an ID and a name (tab-2, Tab 2), and on the canvas the component shows the child the selection is in (its Current prop).
- Literal(value) writes a value as the source of an expression ({ID: 'a'}); Parse(expression) reads it back.
- Kinds() lists the kinds by group; Kind(id) is one: {ID, Group, Icon, Tag, Component, Container, Flex, Text, Description, Props (the first values), Fields ([{Name, Type, Options, Default, Description}]), Slots}. Label(kind) and GroupLabel(group) name them in the language of the page; Slots(id) are the named slots of the parent of a node.
- Insert(kind, parent, index), Move(id, parent, index), Remove(id), Duplicate(id), Set(id, name, value), SetStyle(id, property, value), Clear(); Select(id) and Selected() for the selected node.
- The rules of CSS of the page, by context: Rules(); Rule(context) the one of {Who: node, kind or within, Node, Class, Parent, State, Width, Theme}; SetRule(context, property, value) sets a property of it (the rule comes with its first property and goes with its last); RootClass(id) is the class of the element of a node (elemenx-button), what a rule of its kind names. A node with rules of its own takes the class page-<its ID> (on a div around a Component).
- Template() is the document as a template of Elemenx, its rules first in a <style> (@media for the widths); Template(true, empty) the same for a canvas, every node in an element that names it (data-designer-id), a container marked (data-designer-container, data-designer-gap), an empty one holding the text empty (none when it is ''), and the rules inside the page of the canvas (@container for the widths).
- Import(text) reads a template back: the kinds of the palette where an element is one, any other element as it is, and the rules of its <style> (those it does not understand kept as they are).

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
