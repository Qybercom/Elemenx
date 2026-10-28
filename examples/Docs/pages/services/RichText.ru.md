<!-- generated -->
# RichText

Документ форматированного текста: HTML, который хранит RichEditor, и Markdown, который он читает и пишет.

- Sanitize(html) оставляет только схему документа: абзацы, заголовки h1–h4, цитаты, предформатированный код, списки, линии, таблицы, изображения и ссылки, а внутри — strong, em, u, s, code и переносы строк. Другие теги отдают свой текст (b становится strong, i — em, strike и del — s, h5 и h6 — h4); скрипты, стили, фреймы, формы и их содержимое удаляются. Атрибуты тоже удаляются, кроме href и title ссылки (http, https, mailto, tel или относительный URL), src и alt изображения (а также data: URL картинки), colspan и rowspan ячейки и start списка. Текст вне блока попадает в абзац.
- ToMarkdown(html) и FromMarkdown(text): документ в виде Markdown (CommonMark с таблицами, зачёркиванием и блоками кода GitHub) и обратно. У подчёркивания нет Markdown: оно остаётся <u>.
- Text(html) — простой текст документа, по строке на блок.
- Плагины: то, для чего в схеме нет элемента, рисует компонент или своя функция. Extend(plugin) добавляет плагин (см. Extend ниже); в Markdown это блок кода своего языка (```mermaid), блок директивы (::: warning title="Осторожно" ... :::) или вставка в строке (:name[текст]{key=value}), в HTML — узел с его данными (data-elemenx-plugin, data-elemenx-data), который Sanitize сохраняет, а ToMarkdown записывает обратно как был. Mount(container, options) рисует плагины документа (так делают Markdown и RichEditor), {Destroy()} убирает их. Встроенные: diagram (```mermaid или ```diagram, компонент Diagram), chart (```chart, JSON свойств Chart), qrcode (```qr), barcode (```barcode format=ean13) и callout (::: info, note, tip, success, warning, danger; title=...). Plugins() перечисляет их имена.

HTML читается в инертном шаблоне: при чтении ничего из него не выполняется и не загружается.

## Методы

- `Extend(plugin)`
- `Plugins()`
- `Mount(container, options)`
- `Sanitize(html)`
- `Text(html)`
- `ToMarkdown(html)`
- `FromMarkdown(text)`

## Пример

```example
<TextArea Rows="4" [value]="Html" (input)="Typed" />
<Properties>
	<Property Label="Sanitized" [value]="Clean(Html)" />
	<Property Label="Markdown" [value]="Markdown(Html)" />
	<Property Label="Text" [value]="Text(Html)" />
</Properties>
<script>
({
	Html: '<h2 onclick="alert(1)">Title</h2><p>Some <b>bold</b> and <a href="javascript:alert(1)">a link</a>.</p><script>alert(1)<\/script>',

	$OnCreate: function () {
		var rich = this.$Service('RichText');

		this.Clean = function (html) {
			return rich.Sanitize(html);
		};

		this.Markdown = function (html) {
			return rich.ToMarkdown(html);
		};

		this.Text = function (html) {
			return rich.Text(html);
		};
	},

	Typed: function (value) {
		this.Html = value;
	}
})
</script>
```
