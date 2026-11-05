<!-- generated -->
# SceneBehaviour

SceneBehaviour: компонент, который добавляет что-то к тому, что делает сцена Scene, в которой он объявлен (игра, экскурсия, инструмент редактора), — сама сцена ничего о нём не знает: <Scene> ... <GameStrategy Team="blue" /> </Scene>. Внутри Scene он подключается, как только готов (его элемент внутри сцены, Scene.AddBehaviour), и отключается, когда уходит; его методы SceneStart(scene), SceneStep(elapsed, now), ScenePointer(kind, event), SceneKey(event), SceneKeyUp(event) и SceneStop() — это точки подключения, какие у него есть: true из ScenePointer, SceneKey или SceneKeyUp забирает нажатие у сцены. ParentScene() — сама Scene, null вне её.

## Методы

- `ParentScene()`
