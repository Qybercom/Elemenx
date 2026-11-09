<!-- generated -->
# *infinite

*infinite asks for more when the end of a list comes near: on an element that scrolls (or on one inside the page, the page scrolling), *infinite, *infinite="{Margin: 300, Direction: 'down' or 'up', Busy: false, Done: false}". The element dispatches more ({Direction}) when its end (up: its start, as the older messages of a chat) is within Margin pixels of the view, and when it is too short to scroll at all; once a time: again only when it grew, or the view went away from the end and came back. Busy: what was asked is coming; Done: there is no more. Up keeps what the reader sees in its place when rows come above it; it asks only once the list was scrolled (a chat opens at its top before it goes to its end), or when there is nothing to scroll.

## Tests

- [*infinite asks once near the end, again when the list grew, never while Busy or Done, and at once when too short](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L297) — `tests/regression/library-directives.test.js`
- [*infinite up asks at the start, and keeps what the reader sees when rows come above](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L405) — `tests/regression/library-directives.test.js`
- [InfiniteList shows a spinner while busy and a word at its end, and tells more; up its spinner takes no room](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L446) — `tests/regression/library-directives.test.js`
- [VirtualList asks for more when its last rows are drawn, once for each length; Chat asks for its history at its start](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L490) — `tests/regression/library-directives.test.js`
