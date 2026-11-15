<!-- generated -->
# ElemenxHelpers

The helpers the Components and the Services of ElemenxUI share, so each is written once: the text of a body without the indentation of its template (BodyText), the first day of a week (FirstDay), a list of listeners that tells each of them apart (Listeners), the focus moved among elements by the arrow keys (Rove), and whether a value changes on and on (Live). An Application may use them too; its own Services keep their names.

## Tests

- [Rove moves the focus by the arrows round a list, to its ends by Home and End, and lets other keys be](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L38) — `tests/regression/library-game-controls.test.js`
- [numbers the tabs of Tabs when it is told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L66) — `tests/regression/library-game-controls.test.js`
- [GameMenu: its items are Buttons, the arrows go round them, a press tells select and Escape back](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L77) — `tests/regression/library-game-controls.test.js`
- [GameDialogue: its choices and its next are Buttons that tell choose and next](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L111) — `tests/regression/library-game-controls.test.js`
- [GameTabs: Tabs of ElemenxUI, numbered, that open another by a press or the arrows and tell change](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L133) — `tests/regression/library-game-controls.test.js`
- [ElemenxHelpers: Live tells a value that changes on and on from one that changes now and then](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L41) — `tests/regression/library-services.test.js`
- [ElemenxHelpers: the text of a body without its indentation, the first day of a week, and listeners that throw apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L58) — `tests/regression/library-services.test.js`
