<!-- generated -->
# Section

A titled section. Collapsible lets the user fold its body; Collapsed is the state and the toggle event reports it. Slots: default (the body), before and after (controls on each side of the title), actions (controls at the right end of the header), note (extra content next to the caption). NotePlacement: end (the caption at the right of the header, by default) or below (under the header line).

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Note` | `''` |
| `NotePlacement` | `'end'` |
| `Level` | `2` |
| `Collapsible` | `false` |
| `Collapsed` | `false` |

## Events

- `toggle`: It was folded or unfolded: Collapsed.

## Slots

`before`, `after`, `note`, `actions`, default

## Example

```example
<Section Title="Settings" Collapsible="true" [collapsed]="Folded" (toggle)="Toggled">
	<Button slot="actions" Icon="refresh" Title="Reload" Size="small" Variant="ghost" />
	<span slot="note" class="elemenx-text small muted">{{Folded ? 'folded' : 'open'}}</span>
	<p class="elemenx-text">The body of the section: press the title to fold it.</p>
</Section>
<Section Title="Account" Icon="user" Note="Note with NotePlacement below: the caption goes under the header line." NotePlacement="below">
	<p class="elemenx-text">A section that does not fold.</p>
</Section>
<script>
({
	Folded: false,

	Toggled: function (value) {
		this.Folded = value;
	}
})
</script>
```

## Tests

- [keeps the structure in view, runs the page at the width of a phone from its header and speaks Russian](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L632) — `tests/examples/designer.spec.js`
- [section folds its body and keeps its actions](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4595) — `tests/examples/ui-kit.spec.js`
- [Accordion keeps one section open: opening one folds the others, each with its toggle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L76) — `tests/regression/library-new.test.js`
