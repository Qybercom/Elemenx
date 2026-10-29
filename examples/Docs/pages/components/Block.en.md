<!-- generated -->
# Block

A block: content in a frame, with a title on a band set into the top of the frame. Note is a caption after the title, the actions slot holds controls at the end of the band, the default slot the content. Padding: medium, compact or spacious (the paddings of elemenx-block). HeaderShape 'trapezoid' makes the block a folder: the title (and the note) on a tab as wide as their text, its end sloping down to the body, the actions beyond the slope. Its look comes from the --elemenx-block-* tokens of the theme.

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Note` | `''` |
| `Level` | `3` |
| `Padding` | `'medium'` |
| `HeaderShape` | `'default'` |

## Slots

`actions`, default

## Example

```example
<Block Title="Reactor" Note="Ring B" Level="3">
	<Properties Columns="2">
		<Property Label="Core" Value="86" Unit="%" Tone="success" />
		<Property Label="Coolant" Value="412" Unit="K" />
	</Properties>
</Block>
<Block Title="Logs" HeaderShape="trapezoid" Padding="small">
	<p class="elemenx-text small">A frame whose title is a folder tab.</p>
</Block>
```

## Tests

- [puts the actions of a folder Block at the end of its header, without a padding after them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/folder-shapes.test.js#L61) — `tests/regression/folder-shapes.test.js`
- [draws the slope of a folder Block in a game panel whose band is a gradient](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/folder-shapes.test.js#L67) — `tests/regression/folder-shapes.test.js`
- [a block frames its content under a title on a band set into the frame, with a note, actions and paddings](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4779) — `tests/examples/ui-kit.spec.js`
- [properties set a value apart from its name, in one column or two, with tones and values of their own](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4829) — `tests/examples/ui-kit.spec.js`
