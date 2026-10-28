<!-- generated -->
# Consents

Согласия, которые дал пользователь, любого рода: cookie и аналитика, условия сервиса, рассылка новостей, использование камеры. У согласия есть Key и Version, а также выбор для каждой из его целей: Get(key) — сохранённое решение ({Version, Choices: {purpose: true или false}, Time}) или null, Granted(key, purpose) — разрешена ли эта цель, Set(key, version, choices) сохраняет решение, Clear(key) забывает его (Consent спрашивает снова), Valid(key, version) — сохранено ли решение этой версии. OnChange(callback) / OffChange(callback) сообщают о каждом решении (callback(key, решение или null)), в том числе из другой вкладки сайта. Они хранятся в localStorage (в памяти, где странице им нельзя пользоваться) под StorageKey и ключом.

## Методы

- `Get(key)`
- `Granted(key, purpose)`
- `Valid(key, version)`
- `Set(key, version, choices)`
- `Clear(key)`
- `OnChange(callback)`
- `OffChange(callback)`

## Пример

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

## Тесты

- [Consent asks while no decision of its version is kept, keeps the choices in Consents and asks again for a new version](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L146) — `tests/regression/library-new.test.js`
