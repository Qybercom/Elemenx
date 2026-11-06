SceneCinema: то, что делает с картинкой сцены кино, и катсцены. Поверх canvas лежит свой слой HTML (оформляется токенами --elemenx-scene-title-*): затемнение в цвет, шторки широкого кадра (letterbox), титры и субтитры, которые могут печататься по буквам. Титры всегда стоят внутри кадра между шторками, субтитр — на нижней шторке, как в кино. Слой — обычный HTML: чёткий текст, переводы, темы.

Катсцена — это данные: {Name, Tracks, Restore (true — в конце возвращается камера, что была до неё), Skip (true — Escape её завершает), Loop (false), Record}. Свойство Cutscenes сцены хранит их по имени, Save и Load их сохраняют. PlayCutscene(катсцена или имя, callback) играет её: callback(error, {Name, Stopped, Video}) в конце. StopCutscene() завершает, PauseCutscene(on) держит, SeekCutscene(секунды) переходит к моменту (слой показывает этот момент, события пройденного не срабатывают), Cutscene() сообщает {Name, Time, Length, Paused} или null. События: cutscene ({Name, State: start, end или stop}) и cue ({Cutscene, Name, Data, At}).

Дорожки, каждая {Type, ...}, моменты At — секунды от начала:
- camera: Keys [{At, Camera, Fly}] — какая камера показывает мир с этого момента: склейкой или перелётом за Fly секунд;
- move: ID (камера или любой объект), Keys [{At, Ease (linear, smooth, in, out), любые числа: X, Y, Z, Lift, Yaw, Pitch, Roll, Focal, Focus, Aperture…}] — числа от ключа к ключу, положение по гладкой кривой через ключи (Path linear — по прямым): наезд, кран, проезд, зум (Focal), перевод фокуса (Focus);
- orbit: ID (камера), At, Length, Around (ID или [x, y, z]), Radius (10), Height (2), From, To (градусы вокруг);
- fade: Keys [{At, Value (0 — прозрачно, 1 — целиком цвет), Color ('#000000')}];
- letterbox: Keys [{At, Value (0 — нет, 1 — шторки целиком), Ratio (2.39 — пропорции кадра между ними)}];
- title: Items [{At, Length, Text, Kind (title, chapter, caption, credits), Place (center, top, bottom, top-left, bottom-left), Typing (букв в секунду; 0 — сразу целиком), In, Out (секунды появления и исчезновения, 0.5)}];
- subtitle: Items [{At, Length, Text, Speaker}];
- clip: Items [{At, ID, Clip}] — объект играет клип (Play);
- cue: Items [{At, Name, Data}] — сцена выдаёт событие cue, когда момент наступает.

Слой можно задать и без катсцены: Cinema({Fade, FadeColor, Letterbox, Ratio, Title, Subtitle}) (Title и Subtitle — как пункты без At), Cinema(null) его убирает.

Запись видео: Record({Fps (30), Type (тип MediaRecorder, по умолчанию webm), Bitrate, Overlay (true — слой кино в видео), Hud (false — HUD тоже)}, callback) начинает запись: {Stop(), Recording(), Canvas}; callback(error, Blob) после Stop. Каждый нарисованный кадр сцены вместе со слоем поверх (он превращается в картинку через Rasterize только когда меняется) собирается в свой canvas, который записывает MediaRecorder, — поэтому HTML-титры попадают в видео. Катсцена с Record (true или те же настройки) пишется целиком и отдаёт видео в callback как Video.
