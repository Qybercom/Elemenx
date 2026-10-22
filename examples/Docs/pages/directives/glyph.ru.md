<!-- generated -->
# *glyph

*glyph="reference" рисует символ спрайта внутри <svg>. Ссылка на символ страницы ('#elemenx-icon-add') копирует фигуры символа в элемент вместе с его viewBox: без <use>, так что смена стилей страницы (смена темы) не перестраивает по теневому дереву на каждую иконку, из-за чего при открытых инструментах разработчика пропадают все иконки. Атрибуты fill и stroke символа переходят на <g> вокруг фигур, так что залитый или цветной набор рисуется таким, каким сделан. Любая другая ссылка ('sprite.svg#add') рисуется через <use>. Используется Icon. Символ, которого ещё нет на странице, ничего не рисует: ссылка, которая ждёт Icons.Ready('') (как в Icon), рисуется, как только спрайт появится.

## Пример

```example
<svg class="elemenx-icon" width="32" height="32" *glyph="Ready ? '#elemenx-icon-save' : ''"></svg>
<svg class="elemenx-icon" width="32" height="32" *glyph="Ready ? '#elemenx-icon-' + Name : ''" style="color: var(--elemenx-accent);"></svg>
<Select [options]="[{Value: 'star', Label: 'star'}, {Value: 'heart', Label: 'heart'}, {Value: 'trophy', Label: 'trophy'}]" [value]="Name" (change)="Chose" />
<p class="elemenx-text small muted">The symbols are those of the page: the reference waits for Icons.Ready(''), as Icon does, and draws once the sprite of the library is in.</p>
<script>
({
	Name: 'star',
	Ready: false,

	$OnCreate: function () {
		var self = this;
		var icons = this.$Service('Icons');

		this.Ready = icons.Ready('');

		this.Listener = icons.OnChange(function () {
			self.Ready = icons.Ready('');
		});

		icons.Load('');
	},

	$OnDestroy: function () {
		this.$Service('Icons').OffChange(this.Listener);
	},

	Chose: function (value) {
		this.Name = value;
	}
})
</script>
```
