<!-- generated -->
# *badge

*badge="value" puts a badge over the corner of any element: an item of a toolbar, of a list, a picture. The value is read by the Badges Service: a number (a count), 'dot' (something new), 'busy' (a task that runs: a ring that turns), another text, or {Value, Tone, Max, Label}; a false or an empty value shows none. The element keeps its layout (it is positioned, unless it is already). A Button takes its badge by its own Badge.

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<span *badge="Count" style="padding: 8px;"><Icon Name="mail" Size="24" /></span>
	<span *badge="'dot'" style="padding: 8px;"><Icon Name="bell" Size="24" /></span>
	<span *badge="'busy'" style="padding: 8px;"><Icon Name="cloud" Size="24" /></span>
	<img src="/data/cards/sea.svg" width="64" height="48" alt="" *badge="{Value: 'new', Tone: 'success'}" />
</div>
<Button Label="+1" (click)="More" />
<Button Label="Read all" Variant="ghost" (click)="Read" />
<script>
({
	Count: 3,

	More: function () {
		this.Count++;
	},

	Read: function () {
		this.Count = 0;
	}
})
</script>
```

## Tests

- [shows a page of the guide and a page of the Docs with its live example](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/docs.spec.js#L30) — `tests/examples/docs.spec.js`
- [breadcrumbs lead back, fold the middle into a menu; avatars are made of names; presence, badges and pictures](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L2586) — `tests/examples/ui-kit.spec.js`
