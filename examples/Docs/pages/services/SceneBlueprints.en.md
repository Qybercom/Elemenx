<!-- generated -->
# SceneBlueprints

SceneBlueprints: what a Scene adds to Blueprints, declared in $Provides: Blueprints makes it as a graph of an effect or one of its blocks is met, so a Scene calls nothing first.

- The kind effect: a graph of the layers of an effect of a scene, ending at Effect (it takes the blocks of a generator too). Make(parameters) of what Compile gives is the type of the effect. Its blocks: Layer (each of a Kind, its numbers as inputs a Parameter can take, else its properties; each one after the layers under it) and Effect, the end (its lamp, heat, aim and flight, the layers given).
- The blocks of the passes of the picture of a render graph (of BlueprintShaders): Scene, Clouds, Occlusion, Air, Frames, Mirror, Rays, Exposure, Bokeh, Bloom, Picture and Shader; each one runs the step of the scene that runs it (frame.Steps).
- The kind water: the water of a Scene as a graph (blueprintWater in its shader of water), its blocks the parts of the water of the library (Waters).
