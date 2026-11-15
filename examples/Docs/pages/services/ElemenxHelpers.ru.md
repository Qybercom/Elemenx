<!-- generated -->
# ElemenxHelpers

Помощники, общие для компонентов и сервисов ElemenxUI, чтобы каждый был написан один раз: текст тела без отступов его шаблона (BodyText), первый день недели (FirstDay) список слушателей, в котором каждый отделён от других (Listeners: On, Off, Tell, Count, Clear; слушатель, бросивший ошибку, не останавливает остальных — ошибка уходит странице через reportError, как у слушателя событий DOM), Rove(event, elements, options) — фокус по стрелкам среди элементов списка: вниз (вправо в ряду, Orientation horizontal; в странице справа налево — влево) к следующему, вверх к предыдущему, по кругу (Wrap: false — без), Home к первому, End к последнему; возвращает элемент, к которому перешёл, или null для другой клавиши, и Live(quiet) — функция значения, которая говорит true, пока значение меняется чаще, чем раз в quiet миллисекунд (200): прибор, который обновляют каждый кадр, показывает значение сразу, без перехода, а редко меняющееся значение по-прежнему плавно перетекает. Ими может пользоваться и приложение; его собственные сервисы сохраняют свои имена.

## Тесты

- [Rove moves the focus by the arrows round a list, to its ends by Home and End, and lets other keys be](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L38) — `tests/regression/library-game-controls.test.js`
- [numbers the tabs of Tabs when it is told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L66) — `tests/regression/library-game-controls.test.js`
- [GameMenu: its items are Buttons, the arrows go round them, a press tells select and Escape back](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L77) — `tests/regression/library-game-controls.test.js`
- [GameDialogue: its choices and its next are Buttons that tell choose and next](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L111) — `tests/regression/library-game-controls.test.js`
- [GameTabs: Tabs of ElemenxUI, numbered, that open another by a press or the arrows and tell change](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L133) — `tests/regression/library-game-controls.test.js`
- [ElemenxHelpers: Live tells a value that changes on and on from one that changes now and then](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L41) — `tests/regression/library-services.test.js`
- [ElemenxHelpers: the text of a body without its indentation, the first day of a week, and listeners that throw apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L58) — `tests/regression/library-services.test.js`
