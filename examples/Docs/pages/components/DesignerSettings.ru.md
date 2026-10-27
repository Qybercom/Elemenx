<!-- generated -->
# DesignerSettings

Настройки приложения, которое делает конструктор страниц (сервис Designer), как свойства проекта в редакторе кода. Общие: Name (имя файлов), Title (заголовок окна), Language, Theme (как в системе, светлая или тёмная), где Router хранит маршрут (в адресе, после # или только в истории), Icon и Description. Устройство: компонент приложения (компонент проекта вокруг страниц, с местом страницы; если места нет, это сказано) и страница адреса, которого нет среди маршрутов. Маршруты — строка на каждый: путь (/product/:id), страница, гварды (спрашиваются по порядку) и страница, которую показывает отказ; добавляются и удаляются. Гварды — их имена, описания и код (тело функции каждого), добавляются и удаляются. Каждое изменение сразу идёт в Designer; имя или путь, которые нельзя задать, отмечаются под полем.

## Пример

```example
<div style="height: 420px; overflow: auto; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius);">
	<DesignerSettings />
</div>
<script>
({
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
	}
})
</script>
```
