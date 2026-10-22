<!-- generated -->
# Spinner

A busy indicator: a turning ring. Size: small (16 pixels), medium (24) or large (40). Label is what screen readers say of it ('Loading', by default the phrase of the language); ShowLabel shows it beside the ring too.

## Properties

| Property | Default |
| --- | --- |
| `Size` | `'medium'` |
| `Label` | `''` |
| `ShowLabel` | `false` |

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Spinner Size="small" />
	<Spinner />
	<Spinner Size="large" />
	<Spinner Label="Saving" ShowLabel="true" />
</div>
<Button [label]="Loading ? 'Loading...' : 'Load'" (click)="Load" />
<Spinner *if="Loading" Label="Loading the list" ShowLabel="true" />
<script>
({
	Loading: false,

	Load: function () {
		var self = this;

		this.Loading = true;

		setTimeout(function () {
			self.Loading = false;
		}, 1500);
	}
})
</script>
```
