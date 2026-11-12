<!-- generated -->
# SceneBehaviour

SceneBehaviour: a Component that adds to what the Scene it is declared in does (a game, a tour, a tool of an editor), none of which the scene knows: <Scene> ... <GameStrategy Team="blue" /> </Scene>. Inside a Scene it attaches itself as it is ready, its element in the scene (Scene.AddBehaviour), and detaches as it goes; its methods SceneStart(scene), SceneStep(elapsed, now), ScenePointer(kind, event), SceneGesture(gesture) (a gesture of fingers, Gestures: a finger gives no ScenePointer), SceneKey(event), SceneKeyUp(event) and SceneStop() are the hooks, those it has: true from ScenePointer, SceneGesture, SceneKey or SceneKeyUp takes the press from the scene. SceneCard(object, rows) adds what the game tells of an object to its card (rows: [{Key, Label, Value}]); SceneTarget(object) says whether a weapon of the scene may aim at it and its blast hurt it (true or false; undefined: as the scene would). ParentScene() is the Scene, null outside one.

## Methods

- `ParentScene()`
