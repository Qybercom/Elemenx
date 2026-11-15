<!-- generated -->
# ViewTouch

ViewTouch: пальцы на виде редактора (SceneEditor, ModelEditor, PlanetEditor). Один палец правит так же, как левая кнопка мыши; два пальца двигают камеру (сдвиг, щипок, поворот, наклон — как их распознаёт Gestures) и ничего не правят. Мышь и перо уходят редактору как есть.

- Make(options) — {Down(event), Move(event), Up(event), Reset()} для событий указателя вида. Опции: Edit {Down, Move, Up} (обработчики редактора), Camera(gesture) (жест пальцев, что двигают камеру), Abort() (правка, к которой поздно пришёл второй палец: редактор её отпускает), OneFinger() (true: один палец тоже двигает камеру), Wait (сколько мс палец ждёт второго, прежде чем править: 120), Slop (на сколько px он может сдвинуться за это время: 8). Палец, который ждал, приходит к редактору своим событием: координаты, target и currentTarget первого, button 0.
- Orbit(scene, gesture, options) — двигает камеру Scene вокруг того, на что она смотрит: один палец (или поворот, наклон) вращает, два несут в сторону, щипок приближает. Опции: Near (ближайшее расстояние, 0.3), Far (100000).

## Методы

- `Make(options)`
- `Orbit(scene, gesture, options)`

## Тесты

- [gives a mouse to the editor as it comes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L57) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
- [lets one finger edit after it waited for a second one, at once when it moves or lifts](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L68) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
- [gives two fingers to the camera, the editor never seeing the first when the second came soon](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L97) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
- [lets an edit go when a second finger comes late to it, and the camera has the fingers till all lift](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L116) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
- [gives one finger to the camera too when OneFinger says so](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L132) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
- [Orbit turns the camera of a scene round what it looks at, carries it aside and brings it nearer](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js#L154) — `libraries/ElemenxGraphics/services/ViewTouch/ViewTouch.test.js`
