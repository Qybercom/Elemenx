<!-- generated -->
# ThemeSwitch

Switches the policy of the Theme Service: system (follows the operating system), light or dark; the choice is remembered. Three buttons (system, light, dark), or with Compact one button that shows the policy and moves to the next one. Size: small (the default) or medium. It follows changes made elsewhere (another switch, the code).

## Properties

| Property | Default |
| --- | --- |
| `Size` | `'small'` |
| `Compact` | `false` |
| `Policy` | `'system'` |

## Example

```example
<ThemeSwitch />
<ThemeSwitch Compact="true" />
<span class="elemenx-text small muted">Both switch the policy of the page: system, light or dark.</span>
```

## Tests

- [ThemeSwitch shows the policy of the Theme Service and sets it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L390) — `tests/regression/library-controls.test.js`
