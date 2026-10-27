<!-- generated -->
# DesignerProject

The project of a designer of pages (the Designer Service), as the explorer of an editor of code: the settings of the Application on top, then its pages (with their routes) and its components, each pressed to edit it, and a button to add a page or a component. Settings marks the settings as the open item, in place of the document being edited. Events: open ({ID}, a document opened), settings (the settings pressed).

## Properties

| Property | Default |
| --- | --- |
| `Settings` | `false` |

## Events

- `open`: A page or a component was opened: {ID}.
- `settings`: The settings of the Application were pressed.

## Example

```example
<div style="display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 8px; height: 360px;">
	<div style="overflow: auto; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius);">
		<DesignerProject [settings]="Settings" (open)="Opened" (settings)="Configure" />
	</div>
	<div style="overflow: auto; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius);">
		<DesignerSettings *if="Settings" />
		<DesignerDocument *if="!Settings" />
	</div>
</div>
<script>
({
	Settings: false,

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
	},

	Opened: function () {
		this.Settings = false;
	},

	Configure: function () {
		this.Settings = true;
	}
})
</script>
```
