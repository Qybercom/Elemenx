<!-- generated -->
# SceneMaterials

SceneMaterials: библиотека материалов сцены — из чего сделана поверхность. Каждый материал рисуется собственным узором на GLSL в метрах мира, без картинки: он не повторяется, остаётся чётким как угодно близко и плавно переходит в свой цвет там, где детали уже меньше пикселя. Материал меняет цвет поверхности (её цвет остаётся основным тоном), шероховатость, металличность и высоту: свет ложится на неровности.

- Names(group), Has(name), Get(name), Define(name, material) — материалы. Материал: {Title, Group (ground, road, build или other), Land (true — из него может быть сделана земля), Code (тело функции GLSL)}. В Code доступны q (vec2, метры вдоль поверхности), px (сколько метров покрывает пиксель), c (цвет), r (шероховатость), m (металличность), h (высота в метрах) и помощники: enx_mh/enx_mh2 (хеш), enx_mn (шум), enx_mf (его октавы), enx_mc (ячейки: f1, f2 и два хеша ближайшей), enx_ms(px, size) (1, где детали размера size видны, 0 — где они меньше пикселя).
- Chunk(names) — GLSL этих материалов и функция enx_material(id, q, px, c, r, m, h), рисующая материал с номером id в списке; enx_bump(position, normal, h) наклоняет нормаль по высоте.
- LandNames() — материалы, из которых может быть сделана земля, в порядке номеров её шейдера.
- Surface(name) — материал, написанный вручную, для Blueprint материала модели: узор на её теле (в метрах тела), по стороне, куда больше всего смотрит нормаль.

Встроенные материалы:
- земля — lawn (газон: травинки в два тона), soil (почва с пятнами мха, опавшими листьями и камешками), gravel (песчаный гравий с цветными зёрнами), clay (глина с комьями, ямками и трещинами), sand (песок с рябью), rock (скала с лишайником), snow;
- дороги — dirt (утоптанная земля), asphalt (свежий зернистый асфальт, изредка соломинки), terrazzo (серый асфальт с белыми и тёмными крапинками), concrete (бетон с порами и швами через 4 м), paving (плитка по полметра со смещёнными рядами), cobbles (брусчатка), ballast (щебень железной дороги);
- постройки и прочее — brick (кирпич), stone (каменные блоки), plaster (штукатурка с потёками), wood (доски с волокнами), metal (шлифованный металл), glass (стекло), fabric (ткань).

Земля сцены сделана из материалов своих палитр. Каждая часть палитры (Sand, Low, High, Rock, Snow, Deep, Road) берёт материал из Materials палитры, иначе по умолчанию: песок — sand, низины — lawn, возвышенности — soil, скалы — rock, снег — snow, дно — sand, дороги — dirt. То, что кладёт эскиз, берёт Material элемента, иначе по его типу: дорога — dirt, улица и площадь — paving, река — gravel, пляж и дюны — sand, болото — clay, пойма — soil, каньон, обрыв и кратер — rock. Одна земля держит до 12 материалов (слоты шейдера), их веса хранятся в каждой вершине. Полоса дороги рисуется материалом своего покрытия (SceneRoads: Material покрытия), модель — по Pattern своего материала.

Texture материала называет текстуру SceneTextures: на земле материал рисуется её запечённой плиткой (резкой вблизи, гладкой вдали, без повторов), сверху на ровном месте и с боков на склоне (три проекции по нормали, без размазывания по обрыву), чуть подкрашенной цветом земли в этом месте; его Code остаётся тем, что рисует модель из этого материала. Textured(names) — текстуры материалов земли в порядке её слоёв (SceneTextures.Array). С текстурой: lawn (плитка lawn), asphalt (asphalt) и grassy — земля с травой местами (grassy-soil).

Покрытия дорог (Along: по UV дороги — поперёк и вдоль, в метрах) с текстурой рисуются её запечённой плиткой, так что плитка тротуара поворачивает вместе с дорогой. Асфальт дороги, кроме плитки, несёт износ крупнее неё (RoadWear): поперечные трещины через каждые несколько метров, часть залита битумом, продольную трещину на отрезке и заплатки — темнее и глаже, со швом по краю. Тонкие линии гаснут там, где пиксель шире них.

## Методы

- `Names(group)`
- `Has(name)`
- `Get(name)`
- `Define(name, material)`
- `Chunk(names)`
- `Land(names)`
- `Textured(names)`
- `LandNames()`
- `Surface(name, along)`

## Тесты

- [takes a wall of ground as steep, and a skirt (its normals half as long) as the ground over it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js#L87) — `libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js`
- [has the materials of the references and the common ones, by group, and the ground may be made of those of land](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js#L122) — `libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js`
- [draws each of its materials as a pattern: it compiles, it varies near, and fades to its color where it is too small to see](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js#L142) — `libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js`
- [defines a material of its own, in the chunk of materials and as the surface of a model](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js#L155) — `libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js`
- [defines the materials and the textures of their resources, one of an Application in the place of one of them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L910) — `tests/regression/blueprints.test.js`
- [draws the materials of a ground that name a texture with their tiles, a layer each, bound to its land](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js#L189) — `libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js`
