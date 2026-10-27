<!-- generated -->
# DesignerSettings

The settings of the Application a designer of pages makes (the Designer Service), as the properties of a project in an editor of code. General: its Name (of its files), its Title (of the window), its Language, its Theme (as the system, light or dark), how its Router keeps the route (the address, after # or in the history only), its Icon and its Description. Structure: the component of the Application (a component of the project around the pages, with the place of the page; said when it has none) and the page of a path no route has. Routes: a row each, its path (/product/:id), its page, its guards (asked in their order), the page shown when one refuses; added and removed. Guards: their names, descriptions and code (the body of the function of each), added and removed. Every change goes to the Designer at once; a name or a path that cannot be is said under its field.

## Example

```example
<div style="height: 420px; overflow: auto; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius);">
	<DesignerSettings />
</div>
<script>
({
	/* The project of the example: an application of the Designer, made once and kept in the storage of the browser. */
	$OnCreate: function () {
		var designer = this.$Service('Designer');

		designer.Load(function (error) {
			var found;

			if (error) return;

			found = designer.Projects().filter(function (project) {
				return project.Mode === 'application' && project.Name === 'Docs shop';
			})[0];

			if (found) designer.Switch(found.ID);
			else designer.Create('application', 'Docs shop');
		});
	}
})
</script>
```
