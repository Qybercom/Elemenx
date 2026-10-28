<!-- generated -->
# EmptyState

What a list, a table or a panel shows when it has nothing: an icon, a title, a description and actions (the actions slot), the default slot for more. Variant: empty (default), search (nothing found), error (could not load), offline; each has its icon unless Icon names another. Size: small (inside a list or a table) or medium.

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Description` | `''` |
| `Icon` | `''` |
| `Variant` | `'empty'` |
| `Size` | `'medium'` |

## Slots

default, `actions`

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: stretch;">
	<EmptyState Icon="search" Title="Nothing found" Description="Try another word.">
		<Button Label="Clear the search" Size="small" />
	</EmptyState>
	<EmptyState Icon="folder-open" Title="No projects yet" Description="Create a project to start." Variant="empty" />
	<EmptyState Icon="warning" Title="Something went wrong" Description="The server did not answer." Variant="error" Size="small" />
</div>
```

## Tests

- [the cards of posts, profiles, comments and products tell their buttons, and a comment makes buttons of its mentions and tags](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L454) — `tests/regression/library-controls.test.js`
