<!-- generated -->
# SceneCars

Машины игры как данные: каждая машина — отдельный файл игры (или несколько в одном каталоге). В файле — её модель и её части по ролям (ModelRoles: колёса и суппорты, двери и окна, руль, подрулевые лепестки, педали и дворники, фары), то, как она едет, и где у неё выхлопные трубы, зеркала и экраны. По нему делается модель (SceneModels, роли — в её рецепте), а то, что даёт Unit, принимает Scene.Add('unit', ...).

Машина: {Name, Model (файл модели — glb, gltf или fbx), Size (размер, по умолчанию 1.25), Apart (слово из имён того, что файл хранит одним куском, чтобы разрезать его по промежуткам — например, четыре колеса в одном меше), Materials (Materials рецепта SceneModels), Roles ([роли ModelRoles]), Yaw (на сколько градусов модель повёрнута от направления вперёд), Seat ([x, y, z] водителя), Mass, Base (между осями, м), Width, Gears, Shift (auto или manual), Tune ({...} транспорта: Turn, Brake, Grip, Power...), Pipes ([[x, y, z]] — где хлопает выхлоп), Mirrors и Screens (транспорта)}. Пути без начального / и без схемы читаются от папки файла машины.

- Define(name, car, base) делает её модель ('car-<name>'), один раз: {Name, Label, Model, File, Car}.
- Load(url, callback(error, names)) читает машину ({Name, Model...}, её имя — имя файла) или каталог ({Cars: {имя: машина или путь к её файлу}}) и определяет каждую; файлы — от папки своего файла.
- Get(name) — то, что сделал Define; Names() — имена всех в порядке появления; Unit(name, more, tune) — то, что принимает Scene.Add('unit', ...) ({Model, Size, Vehicle} поверх more; Heading из more — куда она смотрит; tune — поверх её Tune), с запросом её модели. Что открывают её роли, задаёт Scene.Part(id, роль).Set или OpenPart(id, 'role:<роль>') — например, двери: OpenPart(id, 'role:doors', 1).

## Методы

- `Define(name, car, base)`
- `Load(url, callback)`
- `Get(name)`
- `Names()`
- `Unit(name, more, tune)`

## Тесты

- [reads a catalogue of cars, each of a file of its own or in it, their models of their roles, their files from their folders](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-cars.test.js#L26) — `tests/regression/library-cars.test.js`
- [reads one car, named after its file, and tells what it cannot read](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-cars.test.js#L56) — `tests/regression/library-cars.test.js`
