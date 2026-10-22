<!-- generated -->
# Hotkeys

Keyboard shortcuts of the page. Bind(keys, callback, options) returns the ID of the binding; Unbind(id) removes it. keys: modifiers and a key joined by '+' ('Mod+K', 'Ctrl+Shift+P', 'Alt+ArrowUp', 'Escape', 'F2', '?'); Mod is Ctrl, or Command on macOS. A space makes a sequence pressed one after another ('g i', within a second). Letters and digits also match by their place on the keyboard, so 'Mod+K' works with any keyboard layout. Options: Scope (an element: the binding works only while the focus is inside it, and wins over the bindings without a Scope), Inputs (true: also while typing in a field; by default a shortcut without Ctrl, Alt or Command does not fire in a field), Prevent (false keeps the default action of the key), Description and Group (shown by List and by CommandPalette). callback(event, binding). List() returns the bindings [{ID, Keys, Label, Description, Group}]; Format(keys) is the label of keys on this system ('Ctrl+K', '⌘K'). Trigger(id) runs a binding as if its keys were pressed (callback(null, binding)). Pause() and Resume() turn every binding off and on (a nested Pause counts). OnChange(callback) / OffChange(callback): callback() after a binding is added or removed (a part of the page that renders later, *lazy, binds its keys then).

## Methods

- `Bind(keys, callback, options)`
- `Unbind(id)`
- `OnChange(callback)`
- `OffChange(callback)`
- `List()`
- `Trigger(id)`
- `Pause()`
- `Resume()`
- `Format(keys)`

## Example

```example
<p class="elemenx-text">Press <kbd class="elemenx-kbd">{{Keys}}</kbd> or the sequence <kbd class="elemenx-kbd">g</kbd> <kbd class="elemenx-kbd">h</kbd>: {{Note}}</p>
<ul class="elemenx-ul"><li *for="binding of List" *key="binding.ID">{{binding.Label}} — {{binding.Description}}</li></ul>
<script>
({
	Note: 'nothing yet',
	Keys: '',
	List: [],

	$OnCreate: function () {
		var self = this;
		var hotkeys = this.$Service('Hotkeys');

		this.Keys = hotkeys.Format('Mod+Shift+L');
		this.Bindings = [
			hotkeys.Bind('Mod+Shift+L', function () {
				self.Note = 'Mod+Shift+L at ' + new Date().toLocaleTimeString();
			}, {Description: 'An example shortcut', Group: 'Docs'}),
			hotkeys.Bind('g h', function () {
				self.Note = 'the sequence g h';
			}, {Description: 'An example sequence', Group: 'Docs'})
		];

		this.List = hotkeys.List().filter(function (binding) {
			return binding.Group === 'Docs';
		});
	},

	$OnDestroy: function () {
		var hotkeys = this.$Service('Hotkeys');

		this.Bindings.forEach(function (id) {
			hotkeys.Unbind(id);
		});
	}
})
</script>
```
