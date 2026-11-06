<!-- generated -->
# RichText

Документ форматированного текста: HTML, который хранит RichEditor, и Markdown, который он читает и пишет.

- Sanitize(html) оставляет только схему документа: абзацы, заголовки h1–h4, цитаты, предформатированный код, списки, линии, таблицы, изображения и ссылки, а внутри — strong, em, u, s, code и переносы строк. Другие теги отдают свой текст (b становится strong, i — em, strike и del — s, h5 и h6 — h4); скрипты, стили, фреймы, формы и их содержимое удаляются. Атрибуты тоже удаляются, кроме href и title ссылки (http, https, mailto, tel или относительный URL), src и alt изображения (а также data: URL картинки), colspan и rowspan ячейки и start списка. Текст вне блока попадает в абзац.
- ToMarkdown(html) и FromMarkdown(text): документ в виде Markdown (CommonMark с таблицами, зачёркиванием и блоками кода GitHub) и обратно. У подчёркивания нет Markdown: оно остаётся <u>.
- Text(html) — простой текст документа, по строке на блок.
- Плагины: то, для чего в схеме нет элемента, рисует компонент или своя функция. Extend(plugin) добавляет плагин (см. Extend ниже); в Markdown это блок кода своего языка (```mermaid), блок директивы (::: warning title="Осторожно" ... :::) или вставка в строке (:name[текст]{key=value}), в HTML — узел с его данными (data-elemenx-plugin, data-elemenx-data), который Sanitize сохраняет, а ToMarkdown записывает обратно как был. Mount(container, options) рисует плагины документа (так делают Markdown и RichEditor), {Destroy()} убирает их. Встроенные: diagram (```mermaid или ```diagram, компонент Diagram), chart (```chart, JSON свойств Chart), qrcode (```qr), barcode (```barcode format=ean13) и callout (::: info, note, tip, success, warning, danger; title=...). Plugins() перечисляет их имена.

HTML читается в инертном шаблоне: при чтении ничего из него не выполняется и не загружается.

Плагин topology (```topology или ```network) рисует граф компонентом Topology. Строка — узел или связь. Узел: ID, двоеточие, подпись и [ключ=значение ...] (icon, status, kind; остальные ключи — строки Details): web: Web server [icon=server status=ok]. Связь: два ID через -> (или --, <- в обратную сторону), затем : подпись и [status=... kind=...]. Узел, упомянутый только в связи, создаётся по ID. Всё после # — комментарий. Атрибуты ограды: layout, direction, center, directed. TopologyOf(text) возвращает {Nodes, Links}.

## Методы

- `FileTree(text)`
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

## Тесты

- [reads fences, directives and inlines of plugins into their nodes, keeps them through Sanitize and writes them back as they were](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L33) — `tests/regression/rich-plugins.test.js`
- [Markdown draws its plugins by their Components and functions, highlights the other fences, and takes them away again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L75) — `tests/regression/rich-plugins.test.js`
- [Markdown in an Application draws a plugin whose Component its Library has not loaded yet](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L102) — `tests/regression/rich-plugins.test.js`
- [RichEditor draws its plugins as blocks the caret does not enter, puts one in by Command, edits its text in place, and writes it in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L132) — `tests/regression/rich-plugins.test.js`
- [reads a tree of files by its indents, of spaces or of the lines of tree, and Markdown draws it by FileBrowser as a tree](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L203) — `tests/regression/rich-plugins.test.js`
- [reads a topology of nodes and links, their icons, statuses and details, and Markdown draws it by Topology](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L238) — `tests/regression/rich-plugins.test.js`
- [takes away a link and an image whose URL hides javascript: behind %s](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-text.test.js#L28) — `tests/regression/rich-text.test.js`
- [keeps the URLs it allows, without the characters a browser drops](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-text.test.js#L34) — `tests/regression/rich-text.test.js`
