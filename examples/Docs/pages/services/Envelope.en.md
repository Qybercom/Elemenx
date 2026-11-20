<!-- generated -->
# Envelope

Envelope: what lies over and under the surface of a body, as one model for all of them: its air (gas, cloud decks, haze), its seas and the oceans under ice, the hot fluid of a giant, its solid core. A body of no air has an envelope of none (the Moon, Mercury); a rocky planet one of air over its ground; a giant one of thousands of kilometres of gas over a small core. Of one source in the kernel language of Elemenx.Compilers (Kernel), the same in the page, in a worker, in wasm and in a shader.

Its zones, from the top down, each from its Top (km over the Radius of the body; under it negative, or Deep: a part of the radius under it) to the Top of the next: {Name, Phase (gas, cloud, haze, liquid, supercritical, solid), Lapse (K a km it grows warmer going down; under 0 colder), Opacity (how much of the light of its sun it takes a km, as it reaches the ground: of the light spread too, not only the beam), Density (kg/m3: of a liquid, supercritical or solid zone), Color}. Its Pressure (bar) and Temperature (K) at the level of its Radius (height 0), its MolarMass (kg/mol) and Core (the solid under it, a part of the radius; none: the ground of the body) tell the rest: the temperature of each zone goes on from the one over it; a gas is ideal (P = P(top) (T/T(top))^(M g / R L), or exponential where L is 0), a liquid or a fluid weighs as its density does (P = P(top) + rho g d); g of the Mass and Radius of the body, the same all the way.

- Presets(): the envelopes of the library by their names (resources/astronomy/envelopes: earth, mars, venus, titan, jupiter, saturn, uranus, neptune, europa, none) and Types: the name of each type of a surface.
- Make(spec, body): an envelope made for a body ({Radius: km, Mass: of the Earth}): spec a name of a preset, an envelope, or {Preset, ...what changes}; {Zones (the numbers its Kernel reads), Names, Phases, Colors, Pressure, Temperature, Gravity, Floor (km: where the solid begins under it, -Infinity: the ground of the body), Top (km: where its air ends, the pressure under TopPressure; 0 with no air), Sky (km: as high as its sky lies, where the pressure is SkyPart of the one at height 0)}.
- Its weather of its air: Condensables of the envelope ({Name, Of: water, ammonia, methane or hydrogen sulphide of the library, or A and B of its saturation, Mix, Thick, Opacity, Color}; or {Name, Base, Top: bar} of a reaction) make its decks of clouds where they saturate going up (Decks of what Make gives, its zones cut there); Cells (of its winds over a half of it, of how fast its equator goes: 3 of the Earth), Warm, Contrast and Lapse its climate (Make: of body.Day too): what Scene gives the climate, the winds and the forecast of a planet.
- At(made, height): what is there, {Zone (its name, '' over all of it, 'core' under its floor), Phase ('space' over it, 'solid' in its core), Pressure, Temperature, Density, Light (how much of its sun gets there from straight over it, 0 to 1), Glow (the color of its own heat, [r, g, b] 0 to 1 times how bright: none under some 750 K), Inside, Solid}.
- Habitat(made, type): what kind of world its ground is, of its air there (Habitats of the library: the first rule that holds, of its Kelvin and Pressure at height 0, a Condensable it has, Types of the surface): living (where water may be liquid and life live: the Earth), scorched (Venus), hydrocarbon (Titan), dust (Mars), frozen (Europa, Pluto), barren (no air: the Moon, Mercury). What the lands and the plants of a ground are chosen of.
- Code(): its Kernel as js (made in the page; a worker makes it of the text it carries, Compiled); IR(): its module of the IR (the blocks EnvelopeState and EnvelopeLight of Blueprints, generator graphs: their input Zones a list of numbers). env_state(zones, height): vec4 of Pressure, Temperature, Density, the index of the zone (-1 over it, its count in the core); env_light(zones, height): vec2 of Light and the phase (-1 over it).
- Source(names) gives its members to a worker of the Workers Service.

## Methods

- `Source(names)`
- `Code()`
- `IR()`
- `Presets()`
- `Habitat(made, type)`
- `Make(spec, body)`
- `At(made, height)`

## Tests

- [gives the air of the Earth as the standard atmosphere has it, its sky at 100 km and its top at 120 km](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Envelope/Envelope.test.js#L19) — `libraries/ElemenxCommon/services/Envelope/Envelope.test.js`
- [makes the dense air of Venus and the haze of Titan of the same model](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Envelope/Envelope.test.js#L45) — `libraries/ElemenxCommon/services/Envelope/Envelope.test.js`
- [goes down through a giant: its decks, the dark, the glow of its heat growing white, its solid core](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Envelope/Envelope.test.js#L65) — `libraries/ElemenxCommon/services/Envelope/Envelope.test.js`
- [gives none to a body of no air, and the ocean under the ice of Europa](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Envelope/Envelope.test.js#L89) — `libraries/ElemenxCommon/services/Envelope/Envelope.test.js`
- [makes the decks of clouds where a vapour saturates, the cells of the winds of how it turns, its warmth and contrast](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Envelope/Envelope.test.js#L107) — `libraries/ElemenxCommon/services/Envelope/Envelope.test.js`
- [condenses a vapour only colder than its critical point: the methane of the ice giants near their tops](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Envelope/Envelope.test.js#L145) — `libraries/ElemenxCommon/services/Envelope/Envelope.test.js`
- [makes a graph of numbers of its blocks give what its Kernel gives](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Envelope/Envelope.test.js#L163) — `libraries/ElemenxCommon/services/Envelope/Envelope.test.js`
- [tells what kind of world the ground of a body is, of its air there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Envelope/Envelope.test.js#L198) — `libraries/ElemenxCommon/services/Envelope/Envelope.test.js`
