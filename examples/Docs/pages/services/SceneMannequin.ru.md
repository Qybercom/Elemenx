<!-- generated -->
# SceneMannequin

SceneMannequin: человек, сделанный целиком кодом, подробный, как модель из файла. На нём будет строиться генератор персонажей: пропорции заданы числами, кожа — поверхность этих чисел, скелет назван по Mixamo, клипы собраны из поз. Сервис отдаёт ассет в том же виде, что Gltf, поэтому Scene рисует его, скинит и проигрывает клипы, как любую модель из файла.

- Options(options) — человек: Height (рост в метрах, 1.78), Build (0 — худой, 1 — полный, 0.5), Muscle (0..1, 0.5), Sex (0 — мужчина, 1 — женщина, 0), Head, Legs, Shoulders, Hips (множители около 1), Detail (размер ячейки кожи в метрах, 0.008: мельче — больше треугольников), Color (цвет кожи, '#c9b9a6'), Eyes (цвет радужки, '#4a5a6a'). Числа вне границ прижимаются к ним.
- Skeleton(options) — кости в покое (стоя буквой T, лицом к +Z, левая сторона +X): [{Name (mixamorig:...), Parent (индекс, -1), At [x, y, z] (метры в мире)}]. 68 костей: таз, три позвонка, шея, голова с макушкой, глаза и челюсть, ключицы, руки, кисти с пятью пальцами по три фаланги и концу, ноги, стопы, пальцы ног. Find(bones, name) — индекс кости по имени без префикса.
- Shapes(options, bones) — из чего сделано тело: [{Kind (cone — скруглённый конус From To, R1 R2; ball — At, R; ellipsoid — At, Radii; box — At, Half, Round), Bone (индекс кости), Blend (насколько мягко сливается с остальным), Cut (true — вырезается: глазницы), Hand (форма кисти)}]. Таз и ягодицы, живот, рёбра, грудь и грудные мышцы (у женщины — грудь), трапеции и лопатки, шея, череп, челюсть и подбородок, надбровье, скулы, нос, губы, уши, плечи с бицепсом и трицепсом, предплечья, ладонь с возвышением большого пальца, фаланги, бёдра, колени, икры, пятка, свод стопы и пять пальцев ног.
- Distance(shapes, point) — насколько точка вне тела (внутри — меньше 0): формы слиты гладким объединением, вырезанные вычтены. Near(shapes, point) — формы рядом с точкой и расстояния до них, для весов кожи.
- Skin(shapes, detail) — кожа форм: surface nets по сетке ячеек размера detail, построенной только там, где проходит поверхность. {Positions, Normals, Indices}, замкнутая и смотрящая наружу. Body(shapes, options) — кожа всего человека: тело в его Detail, каждая кисть — отдельной замкнутой кожей с ячейкой не больше 3 мм (пальцы круглые) поверх чуть уменьшенной ладони тела; запястье — естественная складка.
- Weights(shapes, positions, height) — веса вершин: 4 кости, чьи формы ближе всего, по близости; сумма весов — 1.
- Asset(options) — {Nodes, Meshes, Materials, Images, Skins, Animations, Motions, Scene}: кости узлами, кожа (материал Skin), глаза — шары на костях глаз из трёх частей: белок, радужка (цвет Eyes) и зрачок.
- Clips(bones, options) — клипы: t-pose, idle, attention, walk, jog, sprint, strafe-left, strafe-right, walk-back, run-back, crouch, crouch-walk, lie-front, lie-back, lie-left, lie-right, crawl, aim-hip, aim-shoulder, aim-bow, sit, drive, jump, jump-forward, hang, pull-up, swim-breaststroke, swim-back, swim-crawl. У походок есть Stride — шаг за цикл, по нему Scene подбирает скорость клипа. Pose(bones, pose) — повороты костей позы: {Кость: [x, y, z] градусов} по именам без префикса, L и R вместо Left и Right (LArm), LFingers и RFingers (насколько согнуты пальцы), LThumb и RThumb, Body (поворот всего тела в тазу), Root ([x, y, z] метров — сдвиг таза).
- Define(name, options) — модель SceneModels с этим именем, которая делается при первом запросе (Load), как загружается файл. Клип run — это jog.

В SceneModels уже есть модель mannequin (Options по умолчанию). Модель SceneModels, у рецепта которой есть Generate(callback (error, asset)), делается этой функцией вместо загрузки файла — так же можно подключить любой свой генератор.

Те же функции работают в Node: страницу они не читают. Человек по умолчанию — около 120 тысяч треугольников и 3 секунды на создание.

## Методы

- `Options(options)`
- `Skeleton(options)`
- `Shapes(options, bones)`
- `Distance(shapes, p)`
- `Near(shapes, p)`
- `Asset(options)`
- `Pose(bones, pose)`
- `Clips(bones, options)`
- `Define(name, options)`

## Тесты

- [has the bones Mixamo names, the fingers, the eyes and the jaw among them, each of a parent before it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L20) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [takes its proportions of options: taller, shorter legs, its numbers kept within their bounds](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L35) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [makes a skin closed and facing out, standing on the ground, of weights that add to one](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L47) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [skins a fingertip to its finger and the eyes to the bones of the eyes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L99) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [has its clips, the gaits of them strides, and turns a pose of degrees into the turns of the bones](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L122) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [is a model of SceneModels, loaded as a file is, and others of options are defined of it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L140) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [is made by Make at once, with no Load before, as the models of code are](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L160) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
