<!-- generated -->
# SceneMannequin

SceneMannequin: a person made wholly of code, as detailed as a model of a file, and the base a generator of characters builds on: its proportions are numbers, its skin a surface of them, its skeleton the bones Mixamo names, its clips made of poses. It gives an asset as Gltf reads one, so a Scene draws it, skins it and plays its clips as any model of a file.

- Options(options): the person: Height (metres, 1.78), Build (0 slim to 1 heavy, 0.5), Muscle (0 to 1, 0.5), Sex (0 a man to 1 a woman, 0), Head, Legs, Shoulders, Hips (scales round 1), Detail (the size of the cells of its skin, metres, 0.006: finer is more triangles), Color (of its skin, '#c9b9a6'), Eyes (the color of the irises, '#4a5a6a').
- Skeleton(options): its bones in their rest (standing as a T): [{Name (mixamorig:...), Parent (index, -1), At [x, y, z] (in the world, metres, facing +Z, its left side +X)}].
- Shapes(options, bones): what its body is made of: [{Kind (cone: a round cone From To, R1 R2; ball: At, R; ellipsoid: At, Radii; box: At, Half, Round), Bone (its index), Blend (how softly it melts into the rest), Cut (true: taken away)}].
- Distance(shapes, point): how far a point is out of the body (under 0 in it), and Near(shapes, point): the shapes near it with their own distances, for the weights of the skin.
- Asset(options): {Nodes, Meshes, Materials, Images, Skins, Animations, Motions, Scene}: the person as Gltf gives one, its skin a mesh of the surface of its shapes (surface nets over a grid fine only near it), its eyes balls of their own, each corner skinned to the 4 bones nearest by the shapes it is of; Clips(bones) its clips.
- Clips(bones, options): the clips of a person ([{Name, Length, Channels}]): its gaits (Gaits: idle, walk, jog, sprint, walk-back, run-back, strafe-left, strafe-right, strafe-left-run, strafe-right-run, crouch, crouch-walk, jump, jump-forward) and its poses (Poses: t-pose, attention, lie-front, lie-back, lie-left, lie-right, crawl, aim-hip, aim-shoulder, aim-bow, sit, drive, hang, pull-up, swim-breaststroke, swim-crawl, swim-back), each of its graph (a pose: Pose 1, every bone of its keys). Pose(bones, pose) the turns of the bones of a pose.
- Gait(bones, graph, options): a clip of a graph of a gait (blueprints/animation/<name> of the library by its name, an Application's of that name in its place, or a graph given): its legs of the path of the feet (GaitPose: a foot on the ground is a point of it, so it never slides; two bones reach the ankle), the rest of the body of the keys of the graph, its stride what the feet travel, fitted to the legs of the person (LegOf). Its numbers and keys were set beside clips of Mixamo (their files are not in the library): within degrees of them.
- Define(name, options): a model of SceneModels of that name, made when it is first asked for (Load), as a file is.

SceneModels has the model mannequin of it (Options of none). The same functions run in Node: they read no page.

## Methods

- `Options(options)`
- `Skeleton(options)`
- `Shapes(options, bones)`
- `Distance(shapes, p)`
- `Near(shapes, p)`
- `Asset(options)`
- `Pose(bones, pose)`
- `Gait(bones, graph, options)`
- `Clips(bones, options)`
- `Define(name, options)`

## Tests

- [makes a clip of a graph of its own: its stride of its graph, the feet still planted](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/mannequin-gaits.test.js#L270) — `tests/regression/mannequin-gaits.test.js`
- [fits a gait to the legs of the person: a shorter one strides shorter, its cycle quicker](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/mannequin-gaits.test.js#L287) — `tests/regression/mannequin-gaits.test.js`
- [has the bones Mixamo names, the fingers, the eyes and the jaw among them, each of a parent before it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L20) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [takes its proportions of options: taller, shorter legs, its numbers kept within their bounds](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L35) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [makes a skin closed and facing out, standing on the ground, of weights that add to one](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L47) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [skins a fingertip to its finger and the eyes to the bones of the eyes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L99) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [has its clips, the gaits of them strides, and turns a pose of degrees into the turns of the bones](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L122) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [is a model of SceneModels, loaded as a file is, and others of options are defined of it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L141) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [is made by Make at once, with no Load before, as the models of code are](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L161) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
