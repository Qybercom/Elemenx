<!-- generated -->
# AppIcon

Иконка приложения, где бы оно ни работало: фавиконка вкладки в вебе, иконка окон (панель задач, док) и трея в нативной программе (сервис Native). Каждый вызов в конце вызывает callback(error).
- Set(icon, callback): иконка — URL (или путь в приложении), текст SVG, data URL или {Light, Dark}, по одной для каждой схемы системы (вкладка браузера следует схеме системы, а не страницы); null возвращает иконку страницы. В программе её получают окна (нарисованной в PNG).
- Badge(count, callback): число над иконкой: бейдж системы в программе и в установленном веб-приложении и красный круг с числом, нарисованный поверх фавиконки (99+ после 99; 'dot' — круг без числа; 0 убирает его).
- Progress(value, callback): часть от 0 до 1, кольцо вокруг фавиконки и полоса на кнопке окна в программе; null убирает его.
- Attention(on, callback): окно мигает в программе; в вебе фавиконка и заголовок мигают, пока страница скрыта.
- Tray(icon, tooltip, callback): картинка (иконка в том виде, в каком её принимает Set) и подсказка иконки трея программы (её создал Native.Tray): в сети, не в сети, число...
- Reset(callback): иконка страницы, без бейджа и прогресса. Current() — {Icon, Badge, Progress}.

## Методы

- `Set(icon, callback)`
- `Badge(count, callback)`
- `Progress(value, callback)`
- `Attention(on, callback)`
- `Tray(icon, tooltip, callback)`
- `Reset(callback)`
- `Current()`

## Пример

```example
<div class="docs-stack">
	<p class="elemenx-text small muted">Look at the icon of this tab while you press the buttons.</p>
	<div class="docs-row">
		<Button Label="A new icon" (click)="Changed" />
		<Button Label="One more message" Icon="comment" (click)="Counted" />
		<Button Label="Upload" Icon="upload" (click)="Uploaded" />
		<Button Label="As it was" Variant="ghost" (click)="Reset" />
	</div>
	<p class="elemenx-text small">Messages: {{Count}}, upload: {{Part === null ? 'none' : Math.round(Part * 100) + '%'}}.</p>
</div>
<script>
({
	Count: 0,
	Part: null,

	Changed: function () {
		this.$Service('AppIcon').Set({
			Light: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1a73e8"/><path d="M18 34l10 10 18-22" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/></svg>',
			Dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#8ab4f8"/><path d="M18 34l10 10 18-22" stroke="#202124" stroke-width="7" fill="none" stroke-linecap="round"/></svg>'
		});
	},

	Counted: function () {
		this.Count++;

		this.$Service('AppIcon').Badge(this.Count);
	},

	Uploaded: function () {
		var self = this;
		var timer;

		this.Part = 0;

		timer = window.setInterval(function () {
			self.Part = Math.min(1, self.Part + 0.1);

			self.$Service('AppIcon').Progress(self.Part);

			if (self.Part >= 1) {
				window.clearInterval(timer);

				window.setTimeout(function () {
					self.Part = null;

					self.$Service('AppIcon').Progress(null);
				}, 600);
			}
		}, 300);
	},

	Reset: function () {
		this.Count = 0;
		this.Part = null;

		this.$Service('AppIcon').Reset();
	}
})
</script>
```
