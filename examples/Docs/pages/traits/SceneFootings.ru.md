<!-- generated -->
# SceneFootings

Площадки под зданиями: земля подстраивается под то, что стоит на ней. Если в графе мира земли есть шаг Footings, каждое здание (объект, чья модель типа building, или любой объект с Footing: true; Footing: false оставляет землю как есть) получает ровную площадку: его отпечаток (коробка модели над землёй с учётом Size и Facing, плюс Margin метров вокруг) на высоте земли в этом месте (Mode: mean — средняя, low — нижняя, high — верхняя), а земля плавно подходит к ней в пределах Edge метров. Площадки — слой эскиза земли (области plateau, поверх дорог), поэтому передвинутое здание перестраивает землю только там, где оно было и куда встало. FootingsOf() возвращает сделанные площадки: [{ID, Points, Height}].

## Методы

- `FootingsOf()`

## Тесты

- [levels the ground under each building of a World with Footings, softly round it, and nowhere else](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFootings/SceneFootings.test.js#L59) — `libraries/ElemenxGraphics/traits/SceneFootings/SceneFootings.test.js`
- [takes no footing without the step, and follows a building moved](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFootings/SceneFootings.test.js#L104) — `libraries/ElemenxGraphics/traits/SceneFootings/SceneFootings.test.js`
