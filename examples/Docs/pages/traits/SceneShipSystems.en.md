<!-- generated -->
# SceneShipSystems

SceneShipSystems: the systems of what a Scene holds, each a trait of its object, its numbers of the graphs of the library (blueprints/vehicles/reactor, power, shield; each the graph of the object, else of the scene, its Graphs of that name):

- Power: {Reactors: [{ID, Output (MW), On (true), Heat (0 to 1.2), Rise (heat a second at full load, 0.05), Cool (a second, 0.08), Trip (the heat it shuts itself down at, 1), Resume (the heat it starts again at, 0.3)}], Shares ({Engines, Shields, Weapons}: how the power is shared, 1 each), Needs ({Engines, Shields, Weapons}: MW each needs at most, 100, 30, 20)}. The engines need as much as the throttle asks, the shields while they fill, the weapons a little ready and all while they fire. A system given less than it needs works as much less: the thrust of a ship, the filling of its shields. SetPower(id, shares), SetReactor(id, reactor, on), Vent(id) (the heat of its reactors down by half, a reactor shut down by its heat on again once it is cool) are the hands of its engineer (or of its pilot alone).
- Shields: {Layers: [{ID, Capacity, Value (Capacity), Regen (a second, at full power), Delay (seconds after a hit it starts to fill, 2), Color, Grow (how far its shell stands off the outline, of the size of the object: 4 %, 4 % more each layer out)}]}, the outer first: layers of their own that a hit goes through one after another, drawn as a shell round the outline of the object (of a ship or of a character: a magic shield the same), as bright as it is full, a flash on the layers a hit just struck. Absorb(id, amount, hit) takes what the layers can of a hit and gives what is left (for its health); the event shield {ID, Layer, Value, Capacity, Taken, Broken}.
- Sensors of a vehicle (Vehicle.Sensors {Range, km}): the blockers of warp near (the trait WarpBlocker) are seen before a ship comes to them, and the places it knows of (the trait NavPoint {Kind: station, landing, planet, relay, mark..., Name, Known}; bodies and stars known by themselves) come to be known as it comes within its range: the event discover {ID, By, Kind, Name}.

ShipSystems(id) is what they read now: {Reactors [{ID, Output, Supply, Heat, On, Tripped}], Supply, Load, Power {Engines, Shields, Weapons} (what each is given of what it needs, 0 to 1), Shares, Shields [{ID, Value, Capacity, Part, Color}], ShieldPart, Jam ({ID, Distance (km to its edge), Inside} of the nearest blocker seen; null), Nav [{ID, Kind, Name, Distance (km), Bearing (degrees from ahead, right positive), Known}] (the nearest first)}; Readout of the Scene has it too.

## Methods

- `ShipSystems(id)`
- `SetPower(id, shares)`
- `SetReactor(id, reactor, on)`
- `Vent(id)`
- `Absorb(id, amount, hit)`

## Tests

- [heats its reactors with their load, shares their power between the systems, vents their heat and turns them off](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js#L61) — `libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js`
- [shuts a reactor down by its heat and starts it again once it is cool](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js#L105) — `libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js`
- [takes a hit by its layers of shield one after another, tells each, fills them again after a while, and hurts the health only with what is left](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js#L131) — `libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js`
- [knows the places its sensors reach, and sees a blocker of warp before it comes into it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js#L174) — `libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js`
- [draws each layer with something left as a shell round the outline of what it guards](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js#L206) — `libraries/ElemenxGraphics/traits/SceneShipSystems/SceneShipSystems.test.js`
