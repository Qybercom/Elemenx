<!-- generated -->
# Card

Карточка: медиа у края (Image или слот media), шапка, тело (Title, Text и слот по умолчанию) и подвал (слот footer, затем слот actions в его конце). Variant: outlined (по умолчанию), elevated, flat или filled (в цвете Color, по умолчанию — акцентном). Orientation: vertical или horizontal (медиа рядом с содержимым; на узком окне снова над ним). Ratio — пропорции медиа ('16:9' по умолчанию, '1:1', '4:3'...). Href делает всю карточку ссылкой (Target), а кнопки внутри остаются кнопками. Loading показывает скелетон вместо Title и Text. Карточки библиотеки (PostCard, ProfileCard, CommentCard, ProductCard, PlanCard) построены так же.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Variant` | `'outlined'` |
| `Orientation` | `'vertical'` |
| `Title` | `''` |
| `Text` | `''` |
| `Image` | `''` |
| `Ratio` | `''` |
| `Color` | `''` |
| `Href` | `''` |
| `Target` | `''` |
| `Label` | `''` |
| `Loading` | `false` |

## Слоты

`media`, `header`, по умолчанию, `footer`, `actions`

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="width: 280px;"><Card Title="Mountains" Text="The northern range at dawn." Image="/data/cards/mountains.svg" Ratio="16:9" Variant="elevated">
		<p class="elemenx-text small">Three days of hiking, two huts.</p>
		<Button slot="actions" Label="Book" Variant="primary" Size="small" />
	</Card></div>
	<div style="width: 420px;"><Card Title="Sea" Image="/data/cards/sea.svg" Orientation="horizontal" Variant="outlined" Href="#sea">
		<p class="elemenx-text small">A calm bay in the south. The whole card is a link.</p>
	</Card></div>
	<div style="width: 200px;"><Card Title="Loading" Loading="true" Variant="filled" /></div>
</div>
```

## Тесты

- [collects the $Meta of every definition of a library, normalized as Elemenx.Meta gives it, and its classes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cli-meta.test.js#L56) — `tests/regression/cli-meta.test.js`
- [opens documents in tabs, each with its tree, and closes them, never the last one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L65) — `tests/regression/designer-project.test.js`
- [adds a component with a slot: the slot is a kind of a component only, its name what the component makes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L91) — `tests/regression/designer-project.test.js`
- [declares the props of a component, which become the fields of its kind on the pages](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L115) — `tests/regression/designer-project.test.js`
- [never puts a component into itself, nor into one it holds; renames it where it is held, and keeps one that is held](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L162) — `tests/regression/designer-project.test.js`
- [knows the Components, Services and Directives of the Libraries and of the project](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L46) — `tests/regression/language-server.test.js`
- [completes the tags, props, bindings, events, directives and options of a template, and the fields of its Component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L63) — `tests/regression/language-server.test.js`
- [goes to the sources the extension carries in a project that has only builds of dist, and reads no bundle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L190) — `tests/regression/language-server.test.js`
- [puts what one route alone uses into its part, and keeps the first screen, the shared and what the rest uses](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/split.test.js#L17) — `tests/regression/split.test.js`
- [adds components from the Insert tab of its Ribbon, edits their props and text, and undoes and redoes the changes](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L142) — `tests/examples/builder.spec.js`
- [has rulers along the canvas that mark the selected element, and makes nothing of a press on them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L1066) — `tests/examples/builder.spec.js`
- [zooms the page on its board, keeps the view to the page, and marks and measures in pixels of the page at any zoom](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L1098) — `tests/examples/builder.spec.js`

+9 ещё в тех же файлах
