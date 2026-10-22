<!-- generated -->
# Windows

Окна страницы (компонент Window): их порядок и активное окно. Front(window) поднимает окно над остальными и делает его активным; Active() — активное окно, List() — открытые от заднего к переднему; Place() даёт следующее место нового окна без собственного места (они идут каскадом вниз и вправо). OnChange(callback) / OffChange(callback) сообщают новый порядок. Геометрия окна с Persist запоминается в localStorage под StorageKey.

## Методы

- `Front(entry)`
- `Active()`
- `List()`
- `Place()`
- `OnChange(callback)`
- `OffChange(callback)`

## Пример

```example
<div class="docs-frame" style="height: 280px;">
	<div style="position: relative; flex: 1 1 auto;">
		<Window *for="name of Names" *key="name" [title]="name" Width="220" Height="140" (front)="Fronted"><p class="elemenx-text small">Press me to bring me to the front.</p></Window>
	</div>
</div>
<p class="elemenx-text small muted">From the back to the front: {{Order}}</p>
<script>
({
	Names: ['One', 'Two', 'Three'],
	Order: '',

	$OnCreate: function () {
		var self = this;
		var windows = this.$Service('Windows');

		this.Changed = function () {
			self.Order = windows.List().map(function (window) {
				return window.Title;
			}).join(' · ');
		};

		windows.OnChange(this.Changed);
	},

	$OnDestroy: function () {
		this.$Service('Windows').OffChange(this.Changed);
	},

	Fronted: function () {
		this.Changed();
	}
})
</script>
```
