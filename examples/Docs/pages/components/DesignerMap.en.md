<!-- generated -->
# DesignerMap

The map of the pages of an application of the Designer Service: each page a frame on a Board (Bounds content), as it runs (its template as the canvas shows it in a preview; the pointer does not reach it), in the order of the routes, at the width of a desktop, a tablet or a phone (Width). Over the board each frame is named with its paths, and an arrow goes from every element whose Href a route of another page matches (a link, a button) to that page: the ways through the application. A press on a frame or on its name opens the page (open, its ID). Controls shows the buttons of the zoom. The map follows the project as it changes; it starts with all of it in view.

## Properties

| Property | Default |
| --- | --- |
| `Width` | `'desktop'` |
| `Controls` | `true` |

## Events

- `open`: A frame or its name was pressed: the ID of its page.

## Example

```example
<div style="display: flex; height: 420px; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius); overflow: hidden;">
	<DesignerMap Width="desktop" (open)="Opened" />
</div>
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Text: 'Press a page to open it.',

	/* An application of three pages of its own, kept apart from the projects of the Designer of the reader (Scope). */
	$OnCreate: function () {
		var designer = this.$Service('Designer');

		designer.Scope('reference-map');

		designer.Load(function (error) {
			var about;

			if (error || designer.Project().Name === 'Shop') return;

			designer.Create('application', 'Shop');
			designer.Import('<div class="elemenx-column" style="padding: 24px">\n\t<h2>Welcome</h2>\n\t<a class="elemenx-link" href="/about">About us</a>\n</div>');
			designer.AddDocument('page', 'Contacts');

			about = designer.AddDocument('page', 'About');

			designer.Open(about);
			designer.Import('<div class="elemenx-column" style="padding: 24px">\n\t<h2>About us</h2>\n\t<a class="elemenx-link" href="/">Back home</a>\n\t<Card Title="Write to us" Text="We answer within a day." Href="/contacts" />\n</div>');
		});
	},

	$OnDestroy: function () {
		this.$Service('Designer').Scope('');
	},

	Opened: function (id) {
		var page = this.$Service('Designer').Project().Documents.filter(function (item) {
			return item.ID === id;
		})[0];

		this.Text = 'Opened: ' + (page ? page.Name : id);
	}
})
</script>
```
