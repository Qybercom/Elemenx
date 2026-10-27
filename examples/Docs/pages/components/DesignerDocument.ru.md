<!-- generated -->
# DesignerDocument

Документ, который правит конструктор страниц (сервис Designer), — то, что показывает инспектор без выбранного элемента: у страницы её Name и Title, а в приложении — список её маршрутов (они задаются в настройках приложения); у компонента — Name, Description, публичные свойства (по строке на каждое: имя, тип, значение по умолчанию, варианты выбора, описание; добавляются и удаляются) и слоты, которые делают его элементы Slot. Эти свойства и слоты инспектор предлагает там, где компонент используется. Имя или маршрут, которые нельзя задать (заняты или не годятся как имя компонента), отмечаются под полем. Удаление убирает документ, если он не последний и его не держит другой документ (тогда они названы).

## Пример

```example
<div style="height: 360px; overflow: auto; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius);">
	<DesignerDocument />
</div>
<script>
({
	/* The project of the example: a component of the Designer, made once and kept in the storage of the browser. */
	$OnCreate: function () {
		var designer = this.$Service('Designer');

		designer.Load(function (error) {
			var found;

			if (error) return;

			found = designer.Projects().filter(function (project) {
				return project.Mode === 'component' && project.Name === 'PriceTag';
			})[0];

			if (found) designer.Switch(found.ID);
			else designer.Create('component', 'PriceTag');
		});
	}
})
</script>
```
