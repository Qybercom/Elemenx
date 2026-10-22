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
