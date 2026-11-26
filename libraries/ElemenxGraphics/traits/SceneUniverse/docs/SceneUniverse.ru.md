SceneUniverse: вселенная как режим сцены (Setting="universe", UniverseData, docs/UNIVERSE-FORMAT.md). Universe — что показывать: ключ UniverseData.Use, URL файла, данные или опции UniverseData.Make ({Seed, Galaxies, Home}).

Галактики вокруг места, куда смотрит вид, рисуются такими, какие они есть: тем же шейдером, что далёкие галактики фона (CosmosGalaxyGLSL трейта SceneCosmos) — по виду, северу и зерну каждой, настоящего размера и на настоящем расстоянии. Далёкие — точки в несколько пикселей, ближние — диск с рукавами на своём квадрате. Галактика меньше пикселя светит слабее, как в жизни, но на карте не тусклее порога (видна каждая). Места считаются в мегапарсеках от угла куба вида, поэтому числа малы, как бы далеко ни улетел вид.

Управление: перетаскивание поворачивает вид вокруг точки, правая кнопка (или с Shift) двигает его, колесо приближает и отдаляет, нажатие выбирает галактику (событие universe: {ID, Galaxy}), двойное — летит к ней; пальцами — как обычно. Enter, или приближение к галактике, за которой следит вид, на несколько её радиусов, — вход в неё: сцена показывает её (Setting galaxy, Galaxy — её данные из UniverseData.Galaxy), а системы её звёзд видят в своём небе галактики вокруг неё (UniverseSky → Far у SceneCosmos). Выбранная подписана: имя, вид и расстояние от домашней (в млн св. лет); домашняя подписана всегда.

- UniverseData() — показанные данные (null, пока не пришли). UniverseView() — {Target [x, y, z] (Мпк), Yaw, Pitch, Distance (Мпк)}; SetUniverseView(view). UniverseFocus(id) — вид летит к галактике. UniversePicked() — ID выбранной.
- UniverseGalaxies() — галактики вокруг вида, как они нарисованы ({ID, Name, Kind, Radius, Place, Distance}).
- EnterGalaxy(id, callback, options) — вход в галактику (options {Now: сразу}); событие entergalaxy {ID, Galaxy, Key}. LeaveGalaxy(callback) — выход во вселенную, вид отходит от галактики; событие leavegalaxy {ID}. UniverseEntered() — ID показанной галактики ('' — никакой).
- UniverseSky(id) — далёкие галактики, видимые из галактики вселенной, как их берёт фон (UniverseData.Sky), или null, если это не галактика показанной вселенной.

События сцены: universe, universeready {ID, Data, Home}, entergalaxy, leavegalaxy, entervoid.

- UniversePlace() — где сцена во вселенной (Мпк): вошедшая галактика, место между галактиками или куда смотрит карта; null без вселенной.
- EnterUniverseGalaxy(id, from, callback) — вход в галактику с края: в систему звезды на краю, ближайшей к направлению от места from (Мпк) — сюда прилетает межгалактический прыжок (SceneVehicles); callback(error, ID звезды). UniverseEdge(id, from) — эта звезда.
- EnterVoid(place, callback) — сцена стоит между галактиками в точке place (Мпк): пустое пространство, без системы, в небе — галактики вокруг, какими их видно оттуда (UniverseData.SkyFrom), своя — большим диском рядом; событие entervoid {Place}. UniverseVoid() — эта точка (null в галактике).
