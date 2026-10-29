<!-- generated -->
# Card

A card: media at the edge (Image, or the media slot), a header, a body (Title, Text and the default slot) and a footer (the footer slot, then the actions slot at its end). Variant: outlined (default), elevated, flat or filled (in Color, the accent by default). Orientation: vertical or horizontal (the media beside the content; under it again on a narrow window). Ratio is the shape of the media ('16:9' by default, '1:1', '4:3'...). Href makes the whole card a link (Target), and the buttons inside it stay buttons. Loading shows skeleton lines in place of Title and Text. The cards of the Library (PostCard, ProfileCard, CommentCard, ProductCard, PlanCard) are built the same way.

## Properties

| Property | Default |
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

## Slots

`media`, `header`, default, `footer`, `actions`

## Example

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

## Tests

- [collects the $Meta of every definition of a library, normalized as Elemenx.Meta gives it, and its classes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cli-meta.test.js#L56) — `tests/regression/cli-meta.test.js`
- [opens documents in tabs, each with its tree, and closes them, never the last one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L65) — `tests/regression/designer-project.test.js`
- [adds a component with a slot: the slot is a kind of a component only, its name what the component makes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L91) — `tests/regression/designer-project.test.js`
- [declares the props of a component, which become the fields of its kind on the pages](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L115) — `tests/regression/designer-project.test.js`
- [never puts a component into itself, nor into one it holds; renames it where it is held, and keeps one that is held](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L162) — `tests/regression/designer-project.test.js`
- [knows the Components, Services and Directives of the Libraries and of the project](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L46) — `tests/regression/language-server.test.js`
- [completes the tags, props, bindings, events, directives and options of a template, and the fields of its Component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L63) — `tests/regression/language-server.test.js`
- [goes to the sources the extension carries in a project that has only builds of dist, and reads no bundle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L190) — `tests/regression/language-server.test.js`
- [adds components from the Insert tab of its Ribbon, edits their props and text, and undoes and redoes the changes](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L142) — `tests/examples/builder.spec.js`
- [has rulers along the canvas that mark the selected element, and makes nothing of a press on them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L1066) — `tests/examples/builder.spec.js`
- [tells of a Component, a prop, a directive and a Service on hover, and finds their definitions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L95) — `tests/regression/language-server.test.js`
- [knows the references of a template (#Name): completes, tells and finds them from $Ref, and marks a $Ref of none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L110) — `tests/regression/language-server.test.js`

+6 more in the same files
