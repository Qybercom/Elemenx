<!-- generated -->
# Icons

The icon sets of the page. The library sprite (index.svg) is the set without a name: <Icon Name="save" />. Another set is named before the icon name: <Icon Name="weather:rain" />. The library sets 'brands', 'files', 'music', 'weather', 'sport', 'racing', 'science', 'art', 'cinema' and 'games' are known already; Register(name, source) adds a set from a sprite file (a URL, relative to the page) or from the markup of a sprite ('<svg>...</svg>'). A set is a sprite of <symbol id> elements; a symbol keeps its own fill and stroke attributes, so a filled or a colored set draws as it is made. A set loads once, when an icon first needs it (or by Load). Its symbols are copied into the hidden <svg id="elemenx-icons"> of the page: elemenx-icon-<name> for the library sprite, elemenx-icon-<set>-<name> for a set. Every Icon draws the shapes of its symbol itself (*glyph), so a set needs the same origin or CORS. Override('save', 'brand:disk') makes every icon named save draw another symbol; Override('save') restores it. Load(set, callback) calls back (error, names). Ready(set) tells whether a set is in the page ('' the library sprite). Names(set) lists the names of a loaded set. Href(name) is the reference an Icon draws. OnChange(callback) reports {Set} when a set loads and {Override: name} when an override changes. The state is kept on the hidden <svg>, so every Application of the page shares the sets.

## Methods

- `Register(name, source)`
- `Href(name)`
- `Ready(name)`
- `Names(name)`
- `Load(name, callback)`
- `Override(name, target)`
- `OnChange(callback)`

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Icon Name="save" Size="24" />
	<Icon Name="files:pdf" Size="24" />
	<Icon Name="brands:github" Size="24" Colored="true" />
	<Icon Name="weather:storm" Size="24" Colored="true" />
	<Icon Name="docs:dot" Size="24" />
	<Icon Name="bell" Size="24" />
</div>
<Button [label]="Overridden ? 'Restore the bell' : 'Draw every bell as a star'" (click)="Toggle" />
<script>
({
	Overridden: false,

	$OnCreate: function () {
		this.$Service('Icons').Register('docs', '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="dot" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#e5484d" /></symbol></svg>');
	},

	Toggle: function () {
		this.Overridden = !this.Overridden;

		if (this.Overridden) this.$Service('Icons').Override('bell', 'star');
		else this.$Service('Icons').Override('bell');
	},

	$OnDestroy: function () {
		this.$Service('Icons').Override('bell');
	}
})
</script>
```

## Tests

- [icon sets load on demand, paint with the theme colors, come from markup and override library icons](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L255) — `tests/examples/ui-kit.spec.js`
- [the six themed icon sets load as packs and draw every icon of theirs](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3344) — `tests/examples/ui-kit.spec.js`
- [money input formats the amount of its currency and file icons follow the format](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5139) — `tests/examples/ui-kit.spec.js`
