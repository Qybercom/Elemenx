<!-- generated -->
# InfiniteList

A list that asks for more as its end comes near (the directive *infinite): its rows in its slot, a spinner while Busy, a word at its end when Done. Direction up (a chat: the older messages above) asks at its start and keeps what the reader sees in its place when they come. Height (a CSS length or pixels) makes it scroll inside; without it the page scrolls. Margin: how near the end it asks, in pixels. Event more ({Direction}): set Busy while it comes.

## Properties

| Property | Default |
| --- | --- |
| `Busy` | `false` |
| `Done` | `false` |
| `Direction` | `'down'` |
| `Margin` | `300` |
| `Height` | `''` |
| `Label` | `''` |

## Events

- `more`: Its end (up: its start) came near, or it is too short to scroll: {Direction}.

## Slots

default

## Tests

- [*infinite asks once near the end, again when the list grew, never while Busy or Done, and at once when too short](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L387) — `tests/regression/library-directives.test.js`
- [*infinite up asks at the start, and keeps what the reader sees when rows come above](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L495) — `tests/regression/library-directives.test.js`
- [InfiniteList shows a spinner while busy and a word at its end, and tells more; up its spinner takes no room](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L536) — `tests/regression/library-directives.test.js`
- [VirtualList asks for more when its last rows are drawn, once for each length; Chat asks for its history at its start](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L580) — `tests/regression/library-directives.test.js`
