<!-- generated -->
# *glyph

*glyph="reference" draws a sprite symbol inside an <svg>. A reference to a symbol of the page ('#elemenx-icon-add') copies the shapes of the symbol into the element, with its viewBox: no <use>, so a restyle of the page (a theme change) does not rebuild one shadow tree per icon, which blanks every icon while the developer tools are open. The fill and stroke attributes of the symbol go to a <g> around the shapes, so a filled or a colored set draws as it is made. Any other reference ('sprite.svg#add') is drawn with <use>. Used by Icon. A symbol that is not in the page yet draws nothing: a reference that waits for Icons.Ready('') (as Icon does) draws once the sprite is in.

## Example

```example
<svg class="elemenx-icon" width="32" height="32" *glyph="Ready ? '#elemenx-icon-save' : ''"></svg>
<svg class="elemenx-icon" width="32" height="32" *glyph="Ready ? '#elemenx-icon-' + Name : ''" style="color: var(--elemenx-accent);"></svg>
<Select [options]="[{Value: 'star', Label: 'star'}, {Value: 'heart', Label: 'heart'}, {Value: 'trophy', Label: 'trophy'}]" [value]="Name" (change)="Chose" />
<p class="elemenx-text small muted">The symbols are those of the page: the reference waits for Icons.Ready(''), as Icon does, and draws once the sprite of the library is in.</p>
<script>
({
	Name: 'star',
	Ready: false,

	$OnCreate: function () {
		var self = this;
		var icons = this.$Service('Icons');

		this.Ready = icons.Ready('');

		this.Listener = icons.OnChange(function () {
			self.Ready = icons.Ready('');
		});

		icons.Load('');
	},

	$OnDestroy: function () {
		this.$Service('Icons').OffChange(this.Listener);
	},

	Chose: function (value) {
		this.Name = value;
	}
})
</script>
```
