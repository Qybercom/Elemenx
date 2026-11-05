<!-- generated -->
# SceneBehaviour

SceneBehaviour: a Component that adds to what the Scene it is declared in does (a game, a tour, a tool of an editor), none of which the scene knows: <Scene> ... <GameStrategy Team="blue" /> </Scene>. Inside a Scene it attaches itself as it is ready, its element in the scene (Scene.AddBehaviour), and detaches as it goes; its methods SceneStart(scene), SceneStep(elapsed, now), ScenePointer(kind, event), SceneKey(event), SceneKeyUp(event) and SceneStop() are the hooks, those it has: true from ScenePointer, SceneKey or SceneKeyUp takes the press from the scene. ParentScene() is the Scene, null outside one.

## Methods

- `ParentScene()`
