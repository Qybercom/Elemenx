<!-- generated -->
# Avatar

The picture of a person, a team or a product. Image shows a picture; without one, or when it does not load, the avatar is made of the Name (or of Seed): Generate initials (the first letters of the first two words, or Initials of its own: a logo of letters), pattern (a symmetric figure of five by five cells, as code hosts give their users) or shapes (an abstract composition of circles, squares and triangles) or suprematism (a picture of the Suprematist Service), always the same for the same name, in a color of the name; Color sets the color of its own. Shape circle, rounded or square; Size small, medium, large, xlarge or a number of pixels. Status puts the dot of a Presence (online, away, busy, dnd, offline, connecting) on its corner.

## Properties

| Property | Default |
| --- | --- |
| `Name` | `''` |
| `Image` | `''` |
| `Initials` | `''` |
| `Generate` | `'initials'` |
| `Seed` | `''` |
| `Color` | `''` |
| `Shape` | `'circle'` |
| `Size` | `'medium'` |
| `Status` | `''` |

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Avatar Name="Ada Lovelace" Status="online" Size="large" />
	<Avatar Name="Alan Turing" Generate="pattern" Size="large" />
	<Avatar Name="Grace Hopper" Generate="shapes" Size="large" Status="away" />
	<Avatar Initials="EX" Shape="rounded" Size="large" Color="#3f6c9e" />
	<Avatar Name="Mountains" Image="/data/cards/mountains.svg" Size="large" />
	<Avatar Name="Broken image" Image="/data/missing.png" Size="large" />
</div>
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Avatar Name="Ada Lovelace" Size="small" />
	<Avatar Name="Ada Lovelace" Size="medium" />
	<Avatar Name="Ada Lovelace" Size="large" />
</div>
<p class="elemenx-text small muted">The initials take a color of the name; an image that does not load falls back to them.</p>
```

## Tests

- [draws it in the page as a component, again when its seed changes, and as an avatar](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/suprematism.test.js#L74) — `tests/regression/suprematism.test.js`
