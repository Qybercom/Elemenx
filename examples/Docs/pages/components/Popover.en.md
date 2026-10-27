<!-- generated -->
# Popover

Floating content next to a trigger. Slots: trigger (the anchor: a Button, a link...) and default (the content). Trigger: click (default) or hover. Open may be set by the owner; the toggle event reports every change. Placement: bottom-start, bottom-end, top-start, right-start.

## Properties

| Property | Default |
| --- | --- |
| `Open` | `false` |
| `Trigger` | `'click'` |
| `Placement` | `'bottom-start'` |
| `Title` | `''` |
| `Width` | `''` |

## Events

- `toggle`: It opened or closed: true or false.

## Slots

`trigger`, default

## Example

```example
<Popover Title="Popover">
	<Button slot="trigger" Label="Open a popover" Icon="info" />
	<p class="elemenx-text">Any content: text, a form, a list.</p>
	<Button Label="An action" Size="small" Variant="primary" />
</Popover>
<Popover Trigger="hover" Placement="top-start">
	<span slot="trigger" class="elemenx-link">Hover here</span>
	<p class="elemenx-text small">A hint shown on hover.</p>
</Popover>
```
