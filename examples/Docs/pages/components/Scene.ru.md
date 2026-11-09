<!-- generated -->
# Scene

Сцена игры в трёх измерениях на WebGL2 (сервис Renderer): объекты любого вида (сервис Kinds), каждый из того, что расширяет его вид, что он умеет (черты, Traits, каждую ведёт система сцены) и из чего состоит (части, Parts, — объекты, размещённые в нём). Сеттинг space (по умолчанию) приносит виды звёздной системы и их системы: звёзды и планеты на кеплеровых орбитах (сервис Astronomy), освещённые своими звёздами (ночные стороны, тени лун и планет друг на друге и на кольцах), их поверхности из шума, один раз запечённые в кубические текстуры, пояса и кольца, станции из модулей, флоты кораблей, которые держатся у тела и летят к другому. Виды space: star, planet, moon, belt, ring, module, station, outpost, fighter, cruiser, freighter, fleet; приложение определяет свои (SceneKinds.Define) и системы для своих черт (Systems: {Черта: {Update(object, context), Draw(object, context)}}). Объекты — System ({Objects: [{ID, Kind, Parent, Values, Traits, Parts, Children}]}), Seed (целая система из него) и SceneObject внутри. Time, Speed, Paused, Scale (compressed или real), Focus, Selected, Orbits, Labels, Details, Background, Team, слот hud; перетаскивание вращает вид, колесо и два пальца приближают, щелчок выбирает объект (или часть объекта вблизи), двойной щелчок перелетает к нему, Escape, стрелки, + и −, Enter, пробел. Вид рисуется относительно глаза, с разрешением по времени кадра. Land(id, {Latitude, Longitude, Altitude}) спускает вид на поверхность тела (широта и долгота — самого тела, как их сообщает Surface(), как стоят его метки и поселения) (не газового гиганта): тот же рельеф, что на запечённой поверхности (SceneTerrainGenerator.Sphere), кусками, тем мельче, чем ближе к глазу (у каждого куска своя картинка в 64 текселя — цвет, вода и нормаль рельефа, — с неровными границами биомов и без щелей между кусками; вблизи на ней массивы леса по правилам рассадки биомов, кроны, рябь и рельеф в десятки метров, а ниже 40 км — зерно тех же тайлов материалов, что у земли локаций (трава, почва, обрыв), в цвете места; мелкое считается от якоря у глаза с шагом 10 км, чтобы не дрожать в точности float; вокруг поселений — поля участками в несколько сотен метров, каждый со своей культурой (пшеница, всходы, пастбище, пар, пашня, сено), с бороздами вблизи, живыми изгородями в части земель и полевыми дорогами между ними, и дома кварталами между улицами, с тенями, черепичными или серыми крышами и садами, а у города — крупнее, с площадями и парками; всё это чётко на любой высоте и плавно уходит в средний цвет издали), под небом его атмосферы и звезды; перетаскивание осматривается, колесо поднимает и опускает, WASD и стрелки идут, Escape или TakeOff() поднимает обратно; время там идёт со скоростью SurfaceSpeed дней в секунду (1/120). Сеттинг terrain — земля и её юниты: ground (Terrain: World — граф её мира, SceneWorld: земля, рельеф, климат, биомы, эскиз и то, что на ней создаётся, единственное место, где они задаются; без графа земли нет; Swell, SwellWay — волны моря; земля из шума, SceneTerrainGenerator.Flat, с морем; объекты, созданные графом, есть в сцене с пометкой Generated, создаются заново вместе с ним и не сохраняются), sun (Sun: свет издалека), unit (Walker: Speed, MaxSlope, Swim), tree, rock, house (Model, Blocks — то, что стоит на пути); объект стоит в X и Y земли, Move(id, [x, y]) ведёт юнита в обход непроходимого, правый щелчок посылает выбранного. Каждая модель сервиса Models — вид с тем же именем на подходящей основе (knight, oak, tower…). Модели отбрасывают тени солнца друг на друга и на землю, рельеф — на поверхность планеты, части модели в фокусе — друг на друга (Shadows, true); растения гнутся на ветру; Model играет клипы своих частей: walk на пути сам, Clip в покое, Play(id, clip, callback) — остальные (attack, cast, work, die): клип с концом вызывает callback и возвращается назад, петля остаётся, die держит последнюю позу. События: ready, select ({ID, Object, Info}), focus, arrive, land, takeoff, error. Без WebGL2 (браузер его не дал) сцена сообщает error ({Reason: webgl2}) и всё равно ready, показывает, что не может рисовать (Unsupported), и не гоняет кадров; её методы отвечают (CosmosKinds, Graphics — уровень low, Sown — ничего не посеяно), но ничего не движется. Методы: Add, Change, Remove, Attach, Detach, Get, Objects, Describe, Position, Select, FocusOn, Move, Play, Now, SetTime, ToScreen, Pick, Save (каждый объект — вид и отличия от него), Load, Land, TakeOff, Surface, Supported. View top или isometric показывает землю в параллельных лучах, как двумерную игру; Add принимает и список. Стратегия, гонка и любая другая игра — компонент, объявленный внутри сцены (GameStrategy, GameRace из ElemenxGaming: трейт SceneBehaviour). Массовое наполнение: SceneObject вида с чертой Scatter (forest, grove, thicket, rocks или свой) рассаживает модели по правилам — Shapes, Density (на сто квадратных единиц), Size, MinHeight, MaxHeight, MaxSlope, Cover, Patch, Seed, Blocks; вид с чертой Grass (grass) растит траву в вершинном шейдере вокруг вида — Density, Height, Color, Root, MaxHeight, MaxSlope. Отдельного объекта на каждую вещь нет: вблизи рисуется вся модель, дальше упрощённые уровни, совсем далеко снимок, запечённый со всех сторон. Sown() сообщает {Things, Squares, Waiting, Draws, Blades}. Модели из файлов: Model у SceneObject называет модель сервиса Models или файл (Model="assets/hero.glb"): он загружается один раз, стоит на земле и имеет высоту 1, как остальные, Size масштабирует его, анимации файла становятся клипами (Clip, Play, ходьба по пути), все копии рисуются одним вызовом, кадры скелета читаются из текстуры, материалы освещаются по metal/roughness. Shapes черты Scatter принимает и файлы: они рассаживаются средним цветом своих текстур. Свет: сцена рисует в текстуру с плавающей точкой и строит из неё картинку — воздух, лучи солнца, ambient occlusion, bloom, кривая ACES; тени с мягкими краями: на high и ultra четыре каскада до ShadowFar (300 и 500 м, Graphics()), ближние рисуются каждый кадр, дальние реже, а у героя (Control) или модели в фокусе ближе 80 м — своя карта в несколько метров вокруг него, с текселем в миллиметры, которая у края переходит в каскады; на low и medium одна карта; отражённый свет того, что видит солнце (один отскок рядом с видом), а на high и ultra вокруг глаза — свет зондов (SceneProbes): воксели по метру и сетка зондов через 2 м, свет отскакивает раз за разом и не проходит сквозь стены — в комнате и в трубе темно, у окна и выхода светло; листья и травинки пропускают солнце. Quality: low, medium, high, ultra; пусто — выбор по видеокарте со снижением, пока кадры опаздывают. Graphics() сообщает, что включено. Биомы — шаг Biomes графа мира: даже один биом (['taiga']) приносит цвета, растительность и траву, несколько лягут по климату; Kind="village" с X, Y, Houses, Radius, Seed выкладывает дома и дороги, на них ничего не растёт. Soft (0–1) пропускает свет под поверхность, как в коже. Уровни детализации плавно переходят друг в друга, кадры складываются (TAA), вода отражает то, что на экране. Камера свободна в любой 3D-сцене: перетаскивание поворачивает и наклоняет, колесо приближает, средняя кнопка или перетаскивание с Shift сдвигает (двумя пальцами на экране), WASD или стрелки перемещают, Q и E поворачивают, R и F наклоняют. Land(id, {Latitude, Longitude, Altitude, Instant}) летит вниз одним движением оттуда, где стоит камера (Instant: сразу), TakeOff() возвращает к тому же виду из космоса. Небо земли: объект вида sun принимает Time (18:30) и идёт в темпе DaySeconds, Noon — азимут, через который оно проходит в полдень (180), Shade — цвет света неба. DayHours — длина суток (24); с Latitude солнце идёт как при вращении планеты: Tilt — наклон оси (23.44), DayOfYear (172) года из YearDays (365) дают длину светового дня, полярные день и ночь тоже. Ночью землю освещает луна: Moon (false — неба без луны), MoonLight, MoonSize, MoonPhase (0 — новолуние, 0.5 — полнолуние, она запаздывает на эту долю суток), MoonElevation с MoonAzimuth держат её на месте, MoonTilt с MoonNode (день года, когда её путь пересекает солнечный) дают затмения: солнечное в новолуние и лунное в полнолуние, а NightLight — свет воздуха в темноте. SkyGlow (от 0 до 1) — свет городов в воздухе, цвета SkyGlowColor, со стороны SkyGlowAzimuth или отовсюду: он подсвечивает облака снизу и скрывает слабые звёзды. Звёзды вращаются вместе с планетой вокруг полюса на высоте Latitude. Weather (clear, cloudy, overcast, rain, storm, snow, fog, changing — сама сменяется по кругу), Cosmos (nebula, pillars, galaxy, galaxies, cluster, void или {Kind, Seed, Colors, Gas, Dust, Stars}) создаёт дальнее небо по зерну: газ, пыль, скопления и диск галактики, запекается по одной грани за кадр; Galaxy у солнца — полоса галактики над ночной землёй. Exposure (число фиксирует экспозицию, пусто — она подстраивается, как глаз), Front (секунды смены), Wind и WindWay — один ветер для облаков, дождя, травы и деревьев. Облака бывают разных типов и отбрасывают настоящие тени; вода и снег копятся на земле и сходят минутами. Weather меняется за несколько секунд, а дождь мочит всё, что под ним; Flare (от 0 до 2) — насколько сильно объектив показывает солнце. На high и ultra отражает всё по своей шероховатости: гладкое (лак, стекло, полированный металл, мокрое) — чётко, шероховатое — размыто и только под скользящим углом (по Френелю), металл — в своём цвете, тёмный металл темно; то, что на экране, отражается по экрану, а то, чего на нём нет, — по карте окружения вокруг глаза из вокселей SceneProbes (в комнате и в трубе — стены, а не небо), за её краем небо. Движущееся (машина, герой) отражает без зерна; отражения считаются в полном размере вида по гладким нормалям поверхностей, так что на кузове нет ни граней, ни ступенек, а краска сохраняет свой цвет. scene.Tuned.Show = 'mirror' показывает, сколько отражает каждая точка. Вид light (Color, Power, Radius, Height, Spot, Aim, Flicker, Follow, Z) — лампа: сколько угодно, сразу светят 24 ближайшие, тени дают 2 ближайшие. Вид location (Model, Size, Without, Plane) делает землю из модели файла, полы и стены читаются из её треугольников; Control(id) отдаёт клавиши персонажу (с FreeLook стоящий персонаж не поворачивается вслед за камерой и разворачивается, только когда пошёл), То, что светится в модели файла, само освещает мир: лампы файла (KHR_lights_punctual) и светящиеся поверхности, собранные в лампы (Lights: false на объекте их отключает). Вид effect (Type: spark, torch, campfire, smoke, steam, dust, exhaust; Size, Power, Aim, Height, Light, On, Follow, Offset; вид огня: Color, Hot, Volume, Intensity, Length, Smoke) горит и дымит на месте или вместе с объектом, у огня есть свой свет, а воздух над ним дрожит; Burst(type, place, options) срабатывает один раз, как explosion, а Effects(types) добавляет свои типы. Hold: {Model, Bone, Aim, At, Turn, Size} вкладывает модель в руку, с Aim её ось идёт от одной кости к другой, а скелет без клипов получает walk и idle, созданные по именам костей (SceneModels.Gait). Правила Scatter принимают Reach и Grid: тайлы из готовых моделей и трава из модели (вид grass с Shapes).

Под землёй. Если в графе мира земли есть туннели, пещеры или нависания, по земле ходят как по локации с этажами: предмет с Z стоит на полу на этой высоте, герой ходит по туннелям (шаг вверх до 0,6 м, не круче примерно 60°, стены останавливают), камера держится уровня героя. Move(id, [x, z, y]) ведёт юнита на пол высоты y по тем же правилам, что и героя (WayUnder: путь над землёй и под ней), GroundAt попадает и в пещеру, видимую через вход. Dig(at, radius) выкапывает яму-шар во время игры: перестраиваются только куски вокруг неё, стоящее там опускается, ямы хранятся в Save (Digs) и возвращаются Load; событие dig ({At, Radius}). Под камнем темно: доля неба, видимого из каждой точки объёмной земли, ослабляет солнце, небо и отражённый свет, а лампы светят как обычно. Корабль садится и взлетает сам (признаки Entry и Flight, SceneLanding): Land(ship, {Marker} или {Latitude, Longitude}) ведёт его с орбиты через воздух в локацию точки, TakeOff(ship) поднимает его обратно на низкую орбиту; команда «Посадка» сцены показывает метки тела и выбор точки. Вылетев за контур локации планеты, корабль оказывается в соседней (через проход режима passage — за затемнением, поле Veiled), а за землёй локации виден её горизонт — дальняя земля тела.

Масштаб: Scale compressed (по умолчанию: крупные тела, короткие расстояния) или real — настоящие размеры и расстояния, а корабли и станции длиной Length в метрах (у объекта или у его Vehicle). Сцена стартует под затемнением (поле Veiled от 0 до 1), её время стоит, пока не готово всё, что нужно для вида: глобусы планет прорисованы целиком, куски земли у глаза построены, растительность вокруг посажена. Локация, в которую прилетает корабль, готовится так же; затемнение сгущается, только если она не успела.

Загрузка показывается по этапам: шейдеры, модели, реки (их расчёт для планет ScenePlanet: один раз, затем из хранилища браузера), планеты (полосы покраски глобусов), земля, растительность. Полоса только растёт, рядом подписан текущий этап. Событие loading сообщает {Part (до 100), Stage}, а событие prepared ({First}) — что всё готово и затемнение снимается: при старте и после каждой новой локации. Пока сцена готовится, поверх затемнения видна только полоса загрузки или своё содержимое слота loading. Картинка проявляется за 0,8 с. При переходах во время игры полоса появляется, только если ожидание дольше 0,5 с. Прорисованные глобусы хранятся в браузере (IndexedDB), и при следующем запуске планета появляется сразу. ToOrbit(id) уводит корабль у тела на орбиту ожидания (SceneLanding). Preload(list, callback) заранее готовит то, что понадобится сцене: имена моделей, {World} земли (её куски у середины), {Planet, Radius} планеты (глобус в хранилище браузера); callback(error, {Done}).

Планета ScenePlanet вблизи (радиус на экране больше 60 px) рисуется не текстурой глобуса, а самой своей землёй, как поверхность при спуске: кусками, тем мельче, чем ближе. Цвет каждой вершины — цвет планеты в этой точке: биомы, высота, снег, крупные реки (те, что проходят ближе полушага сетки) и светлые поймы вокруг них. Рельеф с высоты усилен для света (uRelief до 6), чтобы хребты читались светотенью. Облака — отдельным слоем над землёй, атмосфера — прежней оболочкой. Издалека планета рисуется прорисованной текстурой глобуса, где большие реки видны линиями.

После рек сцена один раз расселяет планету (ScenePlanet.Settlements, в воркере, затем из хранилища браузера) и прорисовывает огни поселений отдельной кубической текстурой. На ночной стороне они светятся тёплым светом, ярче у городов, слабее под облаками, и на глобусе издалека, и на земле вблизи. Планета с Settlements: false остаётся без поселений, а свой список или ключ Settlements берётся как есть. Этап загрузки «планеты» включает и полосы огней.

Материалы. Земля рисуется материалами SceneMaterials своих палитр и эскиза (до 12 на землю, веса в вершинах): газон, почва с мхом и листьями, гравий, глина, песок, скала и снег, а на дорогах и площадях эскиза — их материалы. Шейдер земли собирается под материалы каждой земли, каждый материал считается один раз и только там, где у него есть вес. Материал модели с Pattern (имя материала SceneMaterials) и без своего Blueprint рисуется этим узором по своему телу; так рисуются полосы дорог. Узоры с одинаковым текстом компилируются один раз для всех материалов.

Магистрали. После поселений сцена соединяет города и посёлки планеты магистралями (ScenePlanet.Highways, в воркере, затем из хранилища браузера). Глобус рисуется с ними, а в каждой локации они становятся дорогами по рельефу. Highways: false у планеты отключает их. Preload готовит глобус так же: реки, поселения, магистрали, затем прорисовка.

Свечение. Части моделей цвета больше 1 (фонари, окна киосков, огни светофоров, маяк) светятся сами: ночью в полную силу, днём на восьмую часть. Насколько сейчас ночь, земля сцены знает как Night (0–1). Свет таких частей ничего не освещает и не даёт теней.

Правка сгенерированного. Объект, сделанный World (Generated: дорога шага Roads, деревня, её дома), правится как любой другой: Change(id, changes) сохраняется переопределением и накладывается заново при каждой перегенерации мира. Unlink(id) превращает его в обычный объект сцены с его нынешними значениями: мир его больше не делает, и Save сохраняет его как любой добавленный. Посеянную вещь (дерево, дом поселения, фонарь) находят через SownNear — у неё есть Key: правило и место. ChangeSown(key, changes) правит её: {Remove, Model, X, Z, Turn, Size}, а null забывает правку. Остальные вещи сеются как были: случайные числа тратятся одинаково. UnlinkSown(key) превращает вещь в объект вида thing на её месте и убирает её из рассева. Save хранит правки рассева (Sown), а «запечённое» сохранение — ещё и правки и удаления сгенерированного (Generated); Load восстанавливает их.

Лампы. Сцену освещают 24 ближайших источника: объекты Light, лампы моделей (из файлов и из рецептов Lamps), эффекты, фары и лампы посеянных вещей (фонари вдоль улиц), от точки, за которой следит камера. Лампа с Night горит только ночью, тем ярче, чем темнее. Последние из выбранных плавно гаснут к самой дальней, поэтому при движении свет не мигает. Тени дают две ближайшие отдельные лампы; у ламп моделей и посеянных вещей теней нет.

Отладка, у каждой зоны свой цвет. Wireframe рисует каркас всей сцены: каждое ребро земли и моделей (--elemenx-scene-wire, зелёный). Edges рисует рёбра моделей: где грани сходятся под углом больше 30° и их края (--elemenx-scene-edges, пурпурный). Выделенный объект обведён контуром (--elemenx-scene-outline, оранжево-жёлтый), объект под указателем (Hovered, его ID) — своим (--elemenx-scene-hover, голубой). Origin, кроме осей, показывает коллайдеры (--elemenx-scene-collider, оранжевый). Посеянные вещи (деревья, дома поселений) в каркас пока не попадают.

Что и как помечает указатель, решает игра. HoverMark — как помечен объект под указателем: none (по умолчанию: только событие hover), ring, outline или {Look, Color (#rrggbb), Width (толщина контура в пикселях), Pulse (секунды одного удара, 0 — неподвижно), Cursor (курсор CSS над ним)}. SelectMark — так же для выделенного: outline (по умолчанию, с кольцом, пока он мал на экране), ring, none или {Look, Color, Width, Pulse}. HoverCheck(object, info) решает, что можно пометить: false пропускает объект, объект с полями HoverMark помечает его по-своему; без него помечается всё, кроме героя или машины под клавишами. Кольцо рисуется перед объектом и прячется за тем, что стоит ближе.

Что можно выделить нажатием, тоже решает игра: SelectCheck(object, info) — false пропускает объект (вызов Select(id) из кода не спрашивается). Правое нажатие на землю отправляет выделенного ходока туда только с Orders (стратегия GameStrategy отдаёт приказы сама). Прочности сцена не знает: её карточка показывает то, что добавят поведения (SceneCard), например прочность из Vitals библиотеки ElemenxGaming.

Socket(id, name) — где находится точка крепления модели объекта (часть с ролью socket, по её Name или ID): {At [x, y, z], Axis} или null. Излучатели ролей (emitter, exhaust) выпускают свой эффект через Burst; части с ролью collider останавливают всё, что на них налетает.
 Камеры: вид camera (SceneCamera) — камера с объективом настоящей (фокусное расстояние, диафрагма, ISO, выдержка, фильтры, баланс белого, LUT); свойство Camera или UseCamera(id, {Fly}) выбирает, какая показывает мир, Cameras() их перечисляет. Экраны: вид screen (SceneScreens) показывает картинку, видео, canvas, изображение камеры сцены или живой элемент страницы, по которому можно щёлкать; ScreenAt(clientX, clientY) — экран под точкой. Кино: слой затемнения, шторок, титров и субтитров поверх картинки, катсцены (Cutscenes, PlayCutscene, события cutscene и cue) и запись видео (Record) — SceneCinema. Северное сияние (блок неба SkyAurora): само на широте 55–68° ночью при ясном небе, или Aurora сцены (сила 0–1, где угодно, ночью) и AuroraColors (цвет низа и верха). Радуга (SkyRainbow): основная дуга 42° (красный снаружи) и вторая 51° (цвета наоборот), полоса Александра между ними; при слабом или уходящем дожде, где солнце светит сзади и ниже 42°, или Rainbow сцены (0–1). Молнии: в грозе — вспышки внутри облаков (подсвечивают их изнутри, по ним бегут прожилки разрядов) и удары в землю с разрядом; каждая мерцает 1–4 раза; Lightning(kind) вызывает вспышку туда, куда смотрит вид, в любую погоду: strike — удар в землю, sheet — вспышка в облаках. Видимость: Visibility() — {Distance (метеовидимость в метрах: ясно 40 км, дождь несколько км, снег и туман меньше, густой туман меньше 200 м), Light (освещённость 0–1: день, луна, облака), Sight (какую часть дальности обзора она оставляет)}; SightOf(range) — дальность обзора с учётом погоды и темноты; Visible(from, to, range) — видна ли точка из другой ([x, y] или ID): в пределах дальности и не закрыта рельефом. В тумане, дожде и снеге ореолы вокруг ярких огней шире. Брызги: в дожде вокруг глаза капли разбиваются о землю коронками (всё в шейдере: один меш, высота земли — из маленькой карты высот вокруг глаза; на medium и выше, не на воде); на мокрой дороге колёса машины поднимают водяную взвесь (эффект roadspray), шаги героя по мокрой земле брызгают. Времена года: идут по дате солнца (DayOfYear из YearDays) на его широте (Latitude; в южном полушарии наоборот, у экватора почти не меняются); Season сцены (spring, summer, autumn, winter) фиксирует одно. SeasonState() — {Warmth (от −1 — середина зимы до 1 — лета), Rising (дни растут), Bare (сколько листвы потеряли лиственные деревья), Turn (насколько она пожелтела), Blossom (цветение весной), Dry (выжженная трава), Snow (снег, который лежит сам, где зимы холодные)}. Деревья из кода и из файлов (зелёное в их цвете или текстурах — листва) осенью желтеют и краснеют, каждое своим цветом, редеют до голых веток, весной некоторые цветут; хвойные и пальмы остаются зелёными; осенью с деревьев летят листья. Трава летом выгорает, осенью буреет, под снегом становится низкой и белой; зимний снег лежит на земле, моделях и ветках, как снег погоды. Бой и магия: оружие сцены (SceneWeapons) — Fire(id, {At, Way, Weapon}), пули с трассерами, лазеры, рейлган, плазма, ракеты с захватом цели, миномёт и артиллерия по навесной, лук. Попадания определяют материал (металл, дерево, камень, стекло, земля, вода, снег, плоть) и по правилам HitRules выдают эффект, след и множитель урона; события hit, fire, lock, unlock; прицел Crosshair и метки захвата поверх вида. Здоровье и урон — в ElemenxGaming (Vitals, GameCombat): сцена только сообщает о попаданиях. Break(id) разбивает предмет на куски, стекло — на осколки (SceneDebris); Teleport(id, место) переносит лучом транспортера с растворением модели; CastOn(тип, {From, Way}) кладёт эффект — например, магический круг — на любую поверхность, куда попал луч, и прорисовывает его кольцо за кольцом (Draw), а Dispel(id) стирает. Глубокий космос (SceneDeepSpace): чёрная дыра (blackhole) — свет, изогнутый вокруг неё, тень, кольцо, диск над и под ней, доплеровская асимметрия; кротовая нора (wormhole) — сквозь неё видно небо и звезду другой системы; комета (comet) с газовым и пылевым хвостами; квазар (quasar) со струями; планетоид (planetoid), на который садятся как на планету. Наведение указателя в любой сцене: событие hover, указатель-рука и кольцо вокруг объекта; Interactive: false исключает объект.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `System` | `null` |
| `Seed` | `''` |
| `Systems` | `null` |
| `Time` | `0` |
| `Speed` | `1` |
| `DaySeconds` | `0` |
| `Capture` | `true` |
| `SurfaceSpeed` | `1 / 120` |
| `Shadows` | `true` |
| `View` | `''` |
| `Paused` | `false` |
| `Bokeh` | `0` |
| `BokehFocus` | `''` |
| `Orbits` | `true` |
| `Labels` | `true` |
| `Details` | `true` |
| `Background` | `true` |
| `Scale` | `'compressed'` |
| `Team` | `''` |
| `Label` | `''` |
| `Loader` | `true` |
| `Veiled` | `0` |

## События

- `arrive`: Объект дошёл туда, куда его послали: {ID, At}, на карте ещё X и Y.
- `shader`
- `focus`: Вид перелетел к объекту: {ID}.
- `error`: Нет WebGL2 ({Reason: webgl2}) или карту не удалось загрузить (ошибка).
- `land`: Вид спустился на поверхность тела: {ID}.
- `takeoff`: Вид поднялся обратно в космос: {ID}.
- `select`: Выделение изменилось: {ID, Object, Info, IDs, Objects} (ID пустой, когда не выбрано ничего).
- `loading`
- `prepared`
- `ready`: Сцена готова: сам компонент, чтобы вызывать его методы.
- `hover`
- `person`
- `shoulder`
- `dig`

## Слоты

`loading`, `hud`, по умолчанию, `screens`

## Методы

- `Add(kind, props)`
- `Change(id, changes)`
- `Remove(id)`
- `Attach(parent, object, place)`
- `Detach(id)`
- `Get(id)`
- `Objects(filter)`
- `Describe(id)`
- `Position(id)`
- `Select(id)`
- `Control(id)`
- `FocusOn(id)`
- `Move(id, target, callback)`
- `Play(id, clip, callback)`
- `Now()`
- `SetTime(days)`
- `ToScreen(id)`
- `Pick(clientX, clientY, all)`
- `Save(options)`
- `Load(saved, callback)`
- `Supported()`
- `Preload(list, callback)`
- `Land(id, options)`
- `TakeOff(id)`
- `Surface()`

## Пример

```example
<div style="height: 380px;">
	<Scene Speed="6" (ready)="Ready" (select)="Selected" (arrive)="Arrived">
		<SceneObject ID="sun" Kind="star" Name="Sun">
			<SceneObject ID="earth" Kind="planet" Name="Earth" Surface-Type="terran" Radius="6371" Distance="1" Tilt="23.4">
				<SceneObject ID="moon" Kind="moon" Name="Moon" Radius="1737" Distance="384400 km" />
				<SceneObject ID="gateway" Kind="station" Name="Gateway" Team="blue" />
			</SceneObject>
			<SceneObject ID="mars" Kind="planet" Name="Mars" Surface-Type="desert" Radius="3390" Distance="1.52" Eccentricity="0.09" />
			<SceneObject ID="jupiter" Kind="planet" Name="Jupiter" Surface-Type="gas" Radius="69911" Distance="5.2" Day="9.9" />
		</SceneObject>
		<SceneObject ID="first" Kind="fleet" Name="First fleet" Parent="earth" Team="blue" Count="4" />
	</Scene>
</div>
<Button Label="Fleet to Mars" Icon="send" (click)="Send" />
<Button Label="Save" Icon="save" Variant="ghost" (click)="Save" />
<Button Label="Load" Icon="refresh" Variant="ghost" [disabled]="!Saved" (click)="Load" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'A drag turns the view, the wheel zooms, a click selects, a double click flies to an object.',
	Saved: null,

	Ready: function (scene) {
		this.Scene = function () {
			return scene;
		};
	},

	Selected: function (event) {
		this.Note = event.ID ? event.Object.Name + (event.Info && event.Info.Gravity ? ': ' + event.Info.Gravity.toFixed(1) + ' m/s²' : '') : 'Nothing selected';
	},

	Send: function () {
		var scene = this.Scene();

		scene.Move('first', scene.Get('first').Parent === 'mars' ? 'earth' : 'mars');
	},

	Save: function () {
		this.Saved = this.Scene().Save();
		this.Note = 'Saved: ' + JSON.stringify(this.Saved).length + ' characters, the kinds and what differs from them.';
	},

	Load: function () {
		this.Scene().Load(this.Saved);
		this.Note = 'Loaded at day ' + Math.round(this.Scene().Now());
	},

	Arrived: function (event) {
		this.Note = event.ID + ' arrived at ' + event.At;
	}
})
</script>
```

## Тесты

- [reads a graph of an effect and the blocks of the passes with no Scene: Blueprints makes what declares them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-effect-blueprints.test.js#L77) — `tests/regression/library-effect-blueprints.test.js`
- [counts down, counts the laps of each racer through its checkpoints, their times and best, finishes and ends](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-race.test.js#L100) — `tests/regression/library-game-race.test.js`
- [counts no lap of a racer that goes back over the line, and tells the wrong way and the right way again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-race.test.js#L157) — `tests/regression/library-game-race.test.js`
- [selects the units of its team only, by code, by Ctrl+A and by a frame drawn over them, and none by Escape](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L75) — `tests/regression/library-game-strategy.test.js`
- [sends units to a place, each to its own spot, stops them, and has them attack a foe until it is gone](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L109) — `tests/regression/library-game-strategy.test.js`
- [hides in its fog the units of other teams that its units do not see, and tells what was seen and explored](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L153) — `tests/regression/library-game-strategy.test.js`
- [sees no farther than the weather and the light let it: a fog takes the range of sight of its units](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L181) — `tests/regression/library-game-strategy.test.js`
- [sets no timer of no function while the scene and its game are made](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L202) — `tests/regression/library-game-strategy.test.js`
- [gives the passes of the library as a render graph, in the order they run, and draws the same picture of it given](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-render-pipeline.test.js#L113) — `tests/regression/library-render-pipeline.test.js`
- [leaves out a pass switched off, takes the properties of its blocks, and adds a pass of a graph of its own after the picture](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-render-pipeline.test.js#L140) — `tests/regression/library-render-pipeline.test.js`
- [draws the picture of the library when the Pipeline cannot be made, and tells it once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-render-pipeline.test.js#L202) — `tests/regression/library-render-pipeline.test.js`
- [lets a crate fall onto the ground, tells the touch, and knocks it over by a push](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-rigid.test.js#L58) — `tests/regression/library-rigid.test.js`

+242 ещё в тех же файлах
