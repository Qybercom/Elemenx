<!-- generated -->
# Panels

Панели, которые компонент объявляет в своём шаблоне, как вкладки Tabs (Tab) и Ribbon (RibbonTab): дочерний компонент рисует элемент с классом (свою панель), чьи атрибуты data-* его описывают, а владелец их читает. Read(root, selector, owner) возвращает панели root (элементы selector внутри него, но не внутри другого элемента селектора owner в нём: панели вложенного Tabs принадлежат ему). Data(panel) отдаёт атрибуты data-* панели как {Name: текст}, имена в PascalCase (data-key-tip — KeyTip). Watch(root, selector, callback) вызывает callback, когда панель появляется, исчезает или меняется один из её атрибутов data-*, не чаще раза в кадр, и возвращает функцию, которая это прекращает.

## Методы

- `Read(root, selector, owner)`
- `Data(panel)`
- `Watch(root, selector, callback)`

## Пример

```example
<div #Root>
	<div class="docs-panel" data-id="general" data-label="General" data-key-tip="G"></div>
	<div class="docs-panel" data-id="privacy" data-label="Privacy"></div>
	<div class="docs-panel" *if="Extra" data-id="advanced" data-label="Advanced"></div>
</div>
<Button [label]="Extra ? 'Take a panel away' : 'Add a panel'" (click)="Toggle" />
<ul>
	<li *for="panel of Found">{{panel.Label}} ({{panel.Id}}){{panel.KeyTip ? ', key tip ' + panel.KeyTip : ''}}</li>
</ul>
<p class="elemenx-text small muted">What Tabs and Ribbon do with their Tab and RibbonTab: the children render elements whose data-* attributes describe them, and the owner reads them, and hears them change.</p>
<script>
({
	Extra: false,
	Found: [],

	$OnReady: function () {
		var self = this;
		var panels = this.$Service('Panels');

		function read () {
			self.Found = panels.Read(self.$Ref('Root'), '.docs-panel').map(function (panel) {
				return panels.Data(panel);
			});
		}

		read();

		this.Unwatch = panels.Watch(this.$Ref('Root'), '.docs-panel', read);
	},

	$OnDestroy: function () {
		if (this.Unwatch) this.Unwatch();
	},

	Toggle: function () {
		this.Extra = !this.Extra;
	}
})
</script>
```
