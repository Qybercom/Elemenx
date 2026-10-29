<!-- generated -->
# *layer

*layer помещает свой элемент в верхний слой страницы (popover браузера), пока он на странице; *layer="Open" — только пока выражение истинно. Часть, закреплённая на экране (хост уведомлений, тур, окно страницы, точка, у которой открывается меню), ставится там по экрану, где бы она ни была в странице: иначе блок вокруг неё с containment (content-visibility, contain), transform или filter ставил бы её по себе, а overflow или контекст наложения обрезали бы или скрыли её. Элемент сохраняет своё место, размер и вид (elemenx-layer снимает стили браузера для popover), остаётся в DOM на своём месте, поэтому берёт тему и стили своей части страницы, а его события всплывают как прежде. Элемент, попавший на страницу позже (часть *if, компонент, вставленный после построения, возвращённый Elemenx.Cache), уходит в слой, когда оказывается на ней. Вне верхнего слоя это прежний элемент (без popover: панель группы, которая, пока не открыта, — часть своей ленты). Последний показанный — сверху, а новое истинное значение снова поднимает его наверх (*layer="Z": окна в порядке их стопки), фокус внутри сохраняется. Браузер без popover оставляет его закреплённым, как было.

## Тесты

- [*layer puts its element in the top layer, placed by the viewport inside a box with containment and a transform](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L211) — `tests/regression/library-directives.test.js`
- [*layer="Open" is a popover only while it is true, and a new value brings it on top of the others again, the focus kept](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L222) — `tests/regression/library-directives.test.js`
- [*layer on a part of a *if is in the top layer at the end of the task that opened it, not a frame later](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L262) — `tests/regression/library-directives.test.js`
