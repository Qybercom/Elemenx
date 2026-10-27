<!-- generated -->
# DesignerDocument

The document a designer of pages edits (the Designer Service), what the inspector shows with no element selected: a page has its Name and its Title, and in an application lists its routes (set in the settings of the Application); a component its Name, its Description, its public props (a row each: name, type, default value, the options of a choice, description; added, removed) and its slots, those its Slot elements make. Those props and slots are what the inspector offers where the component is used. A name or a route that cannot be (taken, or not the name of a Component) is said under its field. Remove takes the document away, unless it is the last one or another one holds it (then it names them).

## Example

```example
<div style="height: 360px; overflow: auto; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius);">
	<DesignerDocument />
</div>
<script>
({
	/* The project of the example: a component of the Designer, made once and kept in the storage of the browser. */
	$OnCreate: function () {
		var designer = this.$Service('Designer');

		designer.Load(function (error) {
			var found;

			if (error) return;

			found = designer.Projects().filter(function (project) {
				return project.Mode === 'component' && project.Name === 'PriceTag';
			})[0];

			if (found) designer.Switch(found.ID);
			else designer.Create('component', 'PriceTag');
		});
	}
})
</script>
```
