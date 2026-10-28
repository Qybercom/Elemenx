<!-- generated -->
# Consents

The consents the user gave, of any kind: cookies and analytics, the terms of a service, mail of news, the use of the camera. A consent has a Key and a Version, and the choice for each of its purposes: Get(key) is the decision kept ({Version, Choices: {purpose: true or false}, Time}) or null, Granted(key, purpose) whether that purpose is allowed, Set(key, version, choices) keeps a decision, Clear(key) forgets it (the Consent asks again), Valid(key, version) whether a decision of that version is kept. OnChange(callback) / OffChange(callback) report every decision (callback(key, decision or null)), also from another tab of the site. They are kept in localStorage (in memory where the page may not use it), under StorageKey and the key.

## Methods

- `Get(key)`
- `Granted(key, purpose)`
- `Valid(key, version)`
- `Set(key, version, choices)`
- `Clear(key)`
- `OnChange(callback)`
- `OffChange(callback)`

## Example

```example
<Button Label="Allow analytics" Size="small" (click)="Allow" />
<Button Label="Forget" Variant="ghost" Size="small" (click)="Forget" />
<p class="elemenx-text">Analytics allowed: {{Allowed ? 'yes' : 'no'}}</p>
<script>
({
	Allowed: false,

	$OnCreate: function () {
		var self = this;
		var consents = this.$Service('Consents');

		this.Allowed = consents.Granted('docs-service', 'analytics');

		this.Listener = function () {
			self.Allowed = consents.Granted('docs-service', 'analytics');
		};

		consents.OnChange(this.Listener);
	},

	$OnDestroy: function () {
		this.$Service('Consents').OffChange(this.Listener);
	},

	Allow: function () {
		this.$Service('Consents').Set('docs-service', '1', {analytics: true});
	},

	Forget: function () {
		this.$Service('Consents').Clear('docs-service');
	}
})
</script>
```

## Tests

- [Consent asks while no decision of its version is kept, keeps the choices in Consents and asks again for a new version](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L146) — `tests/regression/library-new.test.js`
