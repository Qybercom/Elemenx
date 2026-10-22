<!-- generated -->
# Centered

A centered page for sign-in forms, errors and empty states, built on elemenx-screen and elemenx-column. Slots: brand (above the content), default (the content), actions (buttons under it), footer (at the bottom). Icon, Code, Title and Description draw a standard state (Code is a large number such as 404). Width: small (360px), medium (480px) or large (640px). Card puts the content on a surface.

## Properties

| Property | Default |
| --- | --- |
| `Icon` | `''` |
| `Code` | `''` |
| `Title` | `''` |
| `Description` | `''` |
| `Width` | `'medium'` |
| `Card` | `false` |

## Slots

`brand`, default, `actions`, `footer`

## Example

```example
<div class="docs-frame">
	<Centered Width="small" Card="true" Title="Sign in" Description="Use your work account">
		<Field Label="Email"><Input Type="email" Placeholder="you@example.com" /></Field>
		<Field Label="Password"><Input Type="password" /></Field>
		<Button slot="actions" Label="Sign in" Variant="primary" Block="true" />
		<span slot="footer" class="elemenx-text small muted">No account? <a class="elemenx-link" href="#">Create one</a></span>
	</Centered>
</div>
<div class="docs-frame">
	<Centered Code="404" Title="Page not found" Description="The page was moved or never existed.">
		<Button slot="actions" Label="Go home" Icon="home" />
	</Centered>
</div>
```
