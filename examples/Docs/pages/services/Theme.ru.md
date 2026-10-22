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
