<!-- generated -->
# SceneShipSystems

Системы того, что держит сцена; каждая — трейт объекта, а их числа считают графы библиотеки `blueprints/vehicles/reactor`, `power` и `shield` (свой граф у объекта, иначе у сцены — ReactorGraph, PowerGraph, ShieldGraph или её Graphs).

Power — энергия: {Reactors: [{ID, Output (МВт), On, Heat (0–1,2), Rise (нагрев в секунду на полной нагрузке, 0,05), Cool (остывание в секунду, 0,08), Trip (нагрев, при котором реактор выключается сам, 1), Resume (нагрев, при котором он включается снова, 0,3)}], Shares ({Engines, Shields, Weapons}: как делится энергия, по 1), Needs ({Engines, Shields, Weapons}: сколько МВт нужно каждой системе на пределе: 100, 30, 20)}. Двигатели просят столько, сколько требует газ; щиты — пока заполняются; оружие — немного в готовности и всё при стрельбе. Система, получившая меньше, чем нужно, работает на столько же слабее: тяга корабля, наполнение щитов. Руки бортинженера (или одного пилота): SetPower(id, shares), SetReactor(id, reactor, on), Vent(id) (нагрев реакторов вдвое меньше; выключенный перегревом включается, когда остыл).

Shields — щит слоями: {Layers: [{ID, Capacity, Value, Regen (в секунду на полной энергии), Delay (через сколько секунд после попадания начинает заполняться, 2), Color, Grow (насколько оболочка отстоит от контура, доля размера объекта)}]}, внешний первым. Попадание проходит слои по очереди. Каждый слой, в котором что-то осталось, рисуется оболочкой по контуру объекта — корабля или персонажа (магический щит устроен так же); она тем ярче, чем полнее слой, и вспыхивает на слоях, которые только что приняли удар. Absorb(id, amount, hit) забирает из удара то, что могут взять слои, и возвращает остаток (для здоровья; Vitals делает это сам). Событие shield: {ID, Layer, Value, Capacity, Taken, Broken}.

Датчики транспорта — Vehicle.Sensors {Range, км}: корабль видит блокировщики варпа (трейт WarpBlocker) раньше, чем к ним подлетит, и узнаёт места (трейт NavPoint {Kind: station, landing, planet, relay, mark…, Name, Known}; тела и звёзды известны сами), когда они попадают в дальность. Событие discover: {ID, By, Kind, Name}.

ShipSystems(id) — что показывают системы сейчас: {Reactors [{ID, Output, Supply, Heat, On, Tripped}], Supply, Load, Power {Engines, Shields, Weapons} (доля нужного, 0–1), Shares, Shields [{ID, Value, Capacity, Part, Color}], ShieldPart, Jam ({ID, Distance (км до границы), Inside} ближайшего блокировщика в зоне датчиков; null), Nav [{ID, Kind, Name, Distance (км), Bearing (градусы от курса, вправо — плюс), Known}] (ближние первыми)}. То же лежит в Readout сцены (Systems).

## Методы

- `ShipSystems(id)`
- `SetPower(id, shares)`
- `SetReactor(id, reactor, on)`
- `Vent(id)`
- `Absorb(id, amount, hit)`

## Тесты

- [heats its reactors with their load, shares their power between the systems, vents their heat and turns them off](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js#L61) — `libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js`
- [shuts a reactor down by its heat and starts it again once it is cool](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js#L105) — `libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js`
- [takes a hit by its layers of shield one after another, tells each, fills them again after a while, and hurts the health only with what is left](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js#L131) — `libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js`
- [knows the places its sensors reach, and sees a blocker of warp before it comes into it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js#L174) — `libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js`
- [draws each layer with something left as a shell round the outline of what it guards](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js#L206) — `libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js`
