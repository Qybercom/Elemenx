<!-- generated -->
# DesignerProject

Проект конструктора страниц (сервис Designer), как обозреватель в редакторе кода: сверху настройки приложения, затем его страницы (с маршрутами) и компоненты — нажатие открывает документ для правки, — и кнопки, добавляющие страницу или компонент. Settings отмечает настройки как открытый пункт вместо редактируемого документа. События: open ({ID}, открыт документ), settings (нажаты настройки).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Settings` | `false` |

## События

- `open`: Открыта страница или компонент: {ID}.
- `settings`: Нажаты настройки приложения.

## Пример

```example
<div style="display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 8px; height: 360px;">
	<div style="overflow: auto; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius);">
		<DesignerProject [settings]="Settings" (open)="Opened" (settings)="Configure" />
	</div>
	<div style="overflow: auto; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius);">
		<DesignerSettings *if="Settings" />
		<DesignerDocument *if="!Settings" />
	</div>
</div>
<script>
({
	Settings: false,

	/* The project of the example: an application of the Designer, made once and kept in the storage of the browser. */
	$OnCreate: function () {
		var designer = this.$Service('Designer');

		designer.Load(function (error) {
			var found;

			if (error) return;

			found = designer.Projects().filter(function (project) {
				return project.Mode === 'application' && project.Name === 'Docs shop';
			})[0];

			if (found) designer.Switch(found.ID);
			else designer.Create('application', 'Docs shop');
		});
	},

	Opened: function () {
		this.Settings = false;
	},

	Configure: function () {
		this.Settings = true;
	}
})
</script>
```
