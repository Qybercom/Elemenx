<!-- generated -->
# SceneBehaviour

SceneBehaviour: компонент, который добавляет что-то к тому, что делает сцена Scene, в которой он объявлен (игра, экскурсия, инструмент редактора), — сама сцена ничего о нём не знает: <Scene> ... <GameStrategy Team="blue" /> </Scene>. Внутри Scene он подключается, как только готов (его элемент внутри сцены, Scene.AddBehaviour), и отключается, когда уходит; его методы SceneStart(scene), SceneStep(elapsed, now), ScenePointer(kind, event), SceneKey(event), SceneKeyUp(event) и SceneStop() — это точки подключения, какие у него есть: true из ScenePointer, SceneKey или SceneKeyUp забирает нажатие у сцены. ParentScene() — сама Scene, null вне её.

SceneCard(object, rows) добавляет в карточку выбранного объекта то, что о нём знает игра: строки {Key, Label, Value} (так GameCombat и GameStrategy показывают прочность). SceneTarget(object) решает, может ли оружие сцены взять объект в прицел и задевает ли его взрыв: true или false, undefined — как решила бы сама сцена (прицел — то, у чего есть команда Team, отличная от команды героя; взрыв — всё, что стоит рядом).

## Методы

- `ParentScene()`
