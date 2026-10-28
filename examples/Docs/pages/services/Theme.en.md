<!-- generated -->
# Theme

The theme of the page: a policy of the color scheme and a named theme. The policy is 'system' (follows the operating system), 'light' or 'dark'. The theme is 'default' (index.css) or a named one: the Library brings 'contrast', 'darcula', 'soft', 'fantasy' and 'scifi' (themes/), and Register adds the themes of the Application. A theme is plain CSS whose rules start with its attribute: [data-theme][data-theme='ocean'] { ... } for both schemes, [data-theme][data-theme='ocean'][data-scheme='dark'] { ... } for the dark one; such a rule is more specific than the rule of a Component it overrides, so the order of the stylesheets does not matter. body[data-theme] holds the policy under the default theme (so index.css applies it before any script runs) and the name of a named theme; body[data-scheme] always holds the scheme shown, 'light' or 'dark'. Scope(element, name, callback) themes one part of the page: the element and everything in it take a named theme or a policy ('light', 'dark', 'system') of their own, whatever the page shows; null gives the element back to the page. The policy and the theme are remembered in localStorage (StorageKey, Persist) and changes are reported, including system changes under 'system'. The first policy comes from localStorage, then from the data-theme of the page, then from Default. In a native program the parts of the system (dialogs, menus, the buttons of the window) take the scheme too (Platform.Scheme).

## Methods

- `Scope(element, name, callback)`

## Example

```example
<Properties>
	<Property Label="Policy" [value]="State.Policy" />
	<Property Label="Scheme shown" [value]="State.Scheme" />
	<Property Label="Theme" [value]="State.Theme" />
</Properties>
<RadioGroup Variant="segmented" [options]="[{Value: 'system', Label: 'System'}, {Value: 'light', Label: 'Light'}, {Value: 'dark', Label: 'Dark'}]" [value]="State.Policy" (change)="Policy" />
<script>
({
	State: {},

	$OnCreate: function () {
		var self = this;
		var theme = this.$Service('Theme');

		this.Read = function () {
			self.State = {Policy: theme.Policy(), Scheme: theme.Resolved(), Theme: theme.Theme()};
		};

		theme.OnChange(this.Read);
		this.Read();
	},

	$OnDestroy: function () {
		this.$Service('Theme').OffChange(this.Read);
	},

	Policy: function (value) {
		this.$Service('Theme').Policy(value);
	}
})
</script>
```

## Tests

- [ThemeSwitch shows the policy of the Theme Service and sets it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L390) — `tests/regression/library-controls.test.js`
- [a part of the page takes a theme of its own, by its attribute or Theme.Scope, whatever the page shows](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L423) — `tests/examples/ui-kit.spec.js`
- [keeps Local and Session in memory, one store for every facade](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L24) — `tests/regression/headless.test.js`
- [knows the references of a template (#Name): completes, tells and finds them from $Ref, and marks a $Ref of none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L104) — `tests/regression/language-server.test.js`
- [gives the parts of the system in a program the scheme of the theme: its policy, or the one scheme of a theme](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L96) — `tests/regression/title-bar.test.js`
- [themes switch the tokens and the rules of the Components, keep to their schemes and are remembered](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L469) — `tests/examples/ui-kit.spec.js`
