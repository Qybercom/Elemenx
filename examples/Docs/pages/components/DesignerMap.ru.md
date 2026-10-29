<!-- generated -->
# DesignerMap

Карта страниц приложения сервиса Designer: каждая страница — кадр на Board (Bounds content), такой, какой она работает (её шаблон, как его показывает холст в Preview; указатель до неё не доходит), в порядке маршрутов, шириной компьютера, планшета или телефона (Width). Над доской каждый кадр подписан именем и путями, а от каждого элемента, Href которого совпадает с маршрутом другой страницы (ссылки, кнопки), к ней идёт стрелка — пути по приложению. Нажатие на кадр или его подпись открывает страницу (open, её ID). Controls показывает кнопки масштаба. Карта следует за проектом, когда он меняется, и вначале показывает его целиком.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Width` | `'desktop'` |
| `Controls` | `true` |

## События

- `open`

## Пример

```example
<div style="display: flex; height: 420px; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius); overflow: hidden;">
	<DesignerMap Width="desktop" (open)="Opened" />
</div>
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Text: 'Press a page to open it.',

	/* An application of three pages of its own, kept apart from the projects of the Designer of the reader (Scope). */
	$OnCreate: function () {
		var designer = this.$Service('Designer');

		designer.Scope('reference-map');

		designer.Load(function (error) {
			var about;

			if (error || designer.Project().Name === 'Shop') return;

			designer.Create('application', 'Shop');
			designer.Import('<div class="elemenx-column" style="padding: 24px">\n\t<h2>Welcome</h2>\n\t<a class="elemenx-link" href="/about">About us</a>\n</div>');
			designer.AddDocument('page', 'Contacts');

			about = designer.AddDocument('page', 'About');

			designer.Open(about);
			designer.Import('<div class="elemenx-column" style="padding: 24px">\n\t<h2>About us</h2>\n\t<a class="elemenx-link" href="/">Back home</a>\n\t<Card Title="Write to us" Text="We answer within a day." Href="/contacts" />\n</div>');
		});
	},

	$OnDestroy: function () {
		this.$Service('Designer').Scope('');
	},

	Opened: function (id) {
		var page = this.$Service('Designer').Project().Documents.filter(function (item) {
			return item.ID === id;
		})[0];

		this.Text = 'Opened: ' + (page ? page.Name : id);
	}
})
</script>
```
