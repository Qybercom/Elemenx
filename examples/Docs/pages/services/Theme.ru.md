<!-- generated -->
# Theme

Тема страницы: политика цветовой схемы и именованная тема. Политика — 'system' (следует за операционной системой), 'light' или 'dark'. Тема — 'default' (index.css) или именованная: библиотека приносит 'contrast', 'darcula', 'soft', 'fantasy' и 'scifi' (themes/), а Register добавляет темы приложения. Тема — простой CSS, правила которого начинаются с её атрибута: [data-theme][data-theme='ocean'] { ... } для обеих схем, [data-theme][data-theme='ocean'][data-scheme='dark'] { ... } для тёмной; такое правило специфичнее правила компонента, которое оно переопределяет, поэтому порядок таблиц стилей не важен. body[data-theme] хранит политику при теме по умолчанию (так index.css применяет её ещё до запуска скриптов) и имя именованной темы; body[data-scheme] всегда хранит показанную схему, 'light' или 'dark'. Scope(element, name, callback) задаёт тему части страницы: элемент и всё в нём получают свою именованную тему или политику ('light', 'dark', 'system'), что бы ни показывала страница; null возвращает элемент странице. Политика и тема запоминаются в localStorage (StorageKey, Persist), о изменениях сообщается, включая изменения системы при 'system'. Первая политика берётся из localStorage, затем из data-theme страницы, затем из Default.

## Методы

- `Scope(element, name, callback)`

## Пример

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

## Тесты

- [ThemeSwitch shows the policy of the Theme Service and sets it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L390) — `tests/regression/library-controls.test.js`
- [a part of the page takes a theme of its own, by its attribute or Theme.Scope, whatever the page shows](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L423) — `tests/examples/ui-kit.spec.js`
- [keeps Local and Session in memory, one store for every facade](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L83) — `tests/regression/headless.test.js`
- [knows the references of a template (#Name): completes, tells and finds them from $Ref, and marks a $Ref of none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L121) — `tests/regression/language-server.test.js`
- [gives the parts of the system in a program the scheme of the theme: its policy, or the one scheme of a theme](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L98) — `tests/regression/title-bar.test.js`
- [themes switch the tokens and the rules of the Components, keep to their schemes and are remembered](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L469) — `tests/examples/ui-kit.spec.js`
