/*
 * SceneShipSystems: the systems of what a Scene holds, each a trait of its object, its numbers of the graphs of the library
 * (blueprints/vehicles/reactor, power, shield; each the graph of the object, else of the scene, its Graphs of that name):
 *
 * - Power: {Reactors: [{ID, Output (MW), On (true), Heat (0 to 1.2), Rise (heat a second at full load, 0.05), Cool (a
 *   second, 0.08), Trip (the heat it shuts itself down at, 1), Resume (the heat it starts again at, 0.3)}], Shares
 *   ({Engines, Shields, Weapons}: how the power is shared, 1 each), Needs ({Engines, Shields, Weapons}: MW each needs at
 *   most, 100, 30, 20)}. The engines need as much as the throttle asks, the shields while they fill, the weapons a little
 *   ready and all while they fire. A system given less than it needs works as much less: the thrust of a ship, the filling
 *   of its shields. SetPower(id, shares), SetReactor(id, reactor, on), Vent(id) (the heat of its reactors down by half, a
 *   reactor shut down by its heat on again once it is cool) are the hands of its engineer (or of its pilot alone).
 * - Shields: {Layers: [{ID, Capacity, Value (Capacity), Regen (a second, at full power), Delay (seconds after a hit it
 *   starts to fill, 2), Color, Grow (how far its shell stands off the outline, of the size of the object: 4 %, 4 % more each
 *   layer out)}]}, the outer first: layers of their own that a hit goes through one after another, drawn as a shell round
 *   the outline of the object (of a ship or of a character: a magic shield the same), as bright as it is full, a flash on
 *   the layers a hit just struck. Absorb(id, amount, hit)
 *   takes what the layers can of a hit and gives what is left (for its health); the event shield {ID, Layer, Value,
 *   Capacity, Taken, Broken}.
 * - Sensors of a vehicle (Vehicle.Sensors {Range, km}): the blockers of warp near (the trait WarpBlocker) are seen before
 *   a ship comes to them, and the places it knows of (the trait NavPoint {Kind: station, landing, planet, relay, mark...,
 *   Name, Known}; bodies and stars known by themselves) come to be known as it comes within its range: the event discover
 *   {ID, By, Kind, Name}.
 *
 * ShipSystems(id) is what they read now: {Reactors [{ID, Output, Supply, Heat, On, Tripped}], Supply, Load, Power {Engines,
 * Shields, Weapons} (what each is given of what it needs, 0 to 1), Shares, Shields [{ID, Value, Capacity, Part, Color}],
 * ShieldPart, Jam ({ID, Distance (km to its edge), Inside} of the nearest blocker seen; null), Nav [{ID, Kind, Name,
 * Distance (km), Bearing (degrees from ahead, right positive), Known}] (the nearest first)}; Readout of the Scene has it too.
 */
Elemenx.Trait('SceneShipSystems', {
	SystemsStart: function () {
		var scene = this.Scene();
		var engine = this.Engine();
		var vectors = this.$Service('Math').Vectors;
		var self = this;

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function traitOf (object, name) {
			return object && object.Traits ? object.Traits[name] : null;
		}

		/* The code of a graph of the systems (reactor, power, shield): of the object, of the scene, else of the library. */
		function codeOf (object, name) {
			var own = traitOf(object, 'Power') || {};
			var graph = own[name.charAt(0).toUpperCase() + name.slice(1) + 'Graph'] || self.GraphOf(name.charAt(0).toUpperCase() + name.slice(1) + 'Graph', 'vehicles/' + name) || Elemenx.Resources('Blueprints', 'ElemenxGraphics/vehicles/' + name);
			var made = scene.SystemsCodes = scene.SystemsCodes || [];
			var found = made.filter(function (one) {
				return one.Graph === graph;
			})[0];

			if (!found) {
				found = {Graph: graph, Code: self.$Service('Blueprints').Code(typeof graph === 'string' ? JSON.parse(graph) : JSON.parse(JSON.stringify(graph)))};

				made.push(found);
			}

			return found.Code;
		}

		/* A kilometre in units of the scene: of its real sizes, else a thousand (on a ground a unit is a metre). */
		function kilometre () {
			var metre = engine.Metre ? engine.Metre() : null;

			return metre ? metre * 1000 : 1000;
		}

		/* The state of the systems of an object, made of its traits once: {Reactors, Shares, Needs, Layers, Since, Known}. */
		function stateOf (object) {
			var power = traitOf(object, 'Power');
			var shields = traitOf(object, 'Shields');
			var state = object.ShipState;

			if (!power && !shields) return null;

			if (!state) {
				state = object.ShipState = {
					Reactors: (power && power.Reactors || []).map(function (one, index) {
						return {ID: one.ID || 'reactor-' + (index + 1), Output: number(one.Output, 100), On: one.On !== false, Heat: number(one.Heat, 0), Rise: number(one.Rise, 0.05), Cool: number(one.Cool, 0.08), Trip: number(one.Trip, 1), Resume: number(one.Resume, 0.3), Tripped: false, Supply: 0};
					}),
					Shares: Object.assign({Engines: 1, Shields: 1, Weapons: 1}, power && power.Shares || {}),
					Needs: Object.assign({Engines: 100, Shields: 30, Weapons: 20}, power && power.Needs || {}),
					Layers: (shields && shields.Layers || []).map(function (one, index) {
						return {ID: one.ID || 'layer-' + (index + 1), Capacity: number(one.Capacity, 100), Value: number(one.Value, number(one.Capacity, 100)), Regen: number(one.Regen, 10), Delay: number(one.Delay, 2), Color: one.Color || '#7fd4ff', Grow: one.Grow === undefined ? undefined : number(one.Grow, 0.04), Struck: 0};
					}),
					Powered: !!power,
					Power: {Engines: 1, Shields: 1, Weapons: 1},
					Supply: 0,
					Load: 0,
					Since: 1000,
					Fired: 1000
				};
			}

			return state;
		}

		/* A step of the systems of an object: its reactors, the power each system is given, its layers of shield filling. */
		function step (object, state, elapsed) {
			var ship = object.Ship || {};
			var car = object.Car || {};
			var throttle = Math.min(1, Math.abs(number(ship.Throttle, 0)) + (object.Values.Vehicle && object.Values.Vehicle.Kind === 'car' ? number(car.Gas, 0) : 0));
			var filling = state.Layers.some(function (layer) {
				return layer.Value < layer.Capacity;
			});
			var supply = 0;
			var given;

			state.Since += elapsed;
			state.Fired += elapsed;

			state.Reactors.forEach(function (reactor) {
				var made = codeOf(object, 'reactor').Run({}, {Heat: reactor.Heat, Load: state.Load, Rise: reactor.Rise, Cool: reactor.Cool, Elapsed: elapsed, On: reactor.On ? 1 : 0, Tripped: reactor.Tripped ? 1 : 0, Trip: reactor.Trip, Resume: reactor.Resume, Output: reactor.Output});

				reactor.Heat = made.Heat;
				reactor.Tripped = made.Tripped > 0;
				reactor.Supply = made.Supply;
				supply += made.Supply;
			});

			if (state.Powered) {
				given = codeOf(object, 'power').Run({}, {Supply: supply, NeedEngines: state.Needs.Engines * Math.max(0.05, throttle), NeedShields: state.Needs.Shields * (filling ? 1 : 0.1), NeedWeapons: state.Needs.Weapons * (state.Fired < 1 ? 1 : 0.1), ShareEngines: number(state.Shares.Engines, 1), ShareShields: number(state.Shares.Shields, 1), ShareWeapons: number(state.Shares.Weapons, 1)});
				state.Power = {Engines: given.Engines, Shields: given.Shields, Weapons: given.Weapons};
				state.Load = given.Load;
			}

			state.Supply = supply;

			state.Layers.forEach(function (layer) {
				layer.Value = codeOf(object, 'shield').Run({}, {Value: layer.Value, Capacity: layer.Capacity, Regen: layer.Regen, Power: state.Powered ? state.Power.Shields : 1, Since: state.Since, Delay: layer.Delay, Elapsed: elapsed}).Value;
			});
		}

		/* The places a vehicle sees by its sensors come to be known (discover). */
		function sense (object) {
			var sensors = object.Values.Vehicle && object.Values.Vehicle.Sensors;
			var range = sensors ? number(sensors.Range, 0) * kilometre() : 0;
			if (!range || !object.World) return;

			scene.Order.forEach(function (one) {
				var nav = traitOf(one, 'NavPoint');
				if (!nav || nav.Known || one.Known || !one.World || vectors.Distance(one.World, object.World) > range) return;

				one.Known = true;

				self.$Emit('discover', {ID: one.ID, By: object.ID, Kind: nav.Kind || 'mark', Name: nav.Name || one.Values.Name || one.ID});
			});
		}

		engine.SystemsStep = function (elapsed) {
			scene.Order.forEach(function (object) {
				var state = stateOf(object);
				if (state)
					step(object, state, elapsed);

				if (object.Values.Vehicle && object.Values.Vehicle.Sensors)
					sense(object);
			});
		};

		/* What the layers of the shield of an object take of a hit; what is left of it (all of it with no shield). */
		engine.Absorb = function (id, amount, hit) {
			var object = scene.Objects[id];
			var state = object ? stateOf(object) : null;
			var left = Math.max(0, number(amount, 0));

			if (!state || !state.Layers.length) return left;

			state.Since = 0;

			state.Layers.forEach(function (layer) {
				var taken;

				layer.Struck = 0;

				if (left <= 0 || layer.Value <= 0) return;

				taken = Math.min(layer.Value, left);
				layer.Struck = 1;
				layer.Value -= taken;
				left -= taken;

				self.$Emit('shield', {ID: id, Layer: layer.ID, Value: layer.Value, Capacity: layer.Capacity, Taken: taken, Broken: layer.Value <= 0, Hit: hit || null});
			});

			return left;
		};

		/* A weapon of an object fired: its weapons need their power for a moment. */
		engine.SystemsFired = function (id) {
			var object = scene.Objects[id];
			if (object && object.ShipState)
				object.ShipState.Fired = 0;
		};

		/* How much of what its engines need an object is given now (1 with no power of its own). */
		engine.EnginesPower = function (object) {
			return object && object.ShipState && object.ShipState.Powered ? object.ShipState.Power.Engines : 1;
		};

		engine.ShipSystems = function (id) {
			var object = scene.Objects[id];
			var state = object ? stateOf(object) : null;
			var sensors = object && object.Values.Vehicle ? object.Values.Vehicle.Sensors : null;
			var range = sensors ? number(sensors.Range, 0) * kilometre() : 0;
			var km = kilometre();
			var capacity = 0;
			var value = 0;
			var jam = null;
			var nav = [];
			var ahead;
			var right;

			if (!object)
				return null;

			if (state)
				state.Layers.forEach(function (layer) {
					capacity += layer.Capacity;
					value += layer.Value;
				});

			if (object.World && range) {
				ahead = object.Ship && object.Ship.Ahead || object.Heading || [0, 0, 1];
				right = object.Ship && object.Ship.Right || vectors.Normalize(vectors.Cross(ahead, [0, 1, 0]));

				scene.Order.forEach(function (one) {
					var blocker = traitOf(one, 'WarpBlocker');
					var place = traitOf(one, 'NavPoint');
					var body = traitOf(one, 'Body') || traitOf(one, 'Star');
					var apart;
					var reach;
					var way;

					if (one === object || !one.World || one.Hidden) return;

					apart = vectors.Distance(one.World, object.World);

					if (blocker && blocker.Active !== false) {
						reach = number(blocker.Radius, 20) * (one.Size || 1);

						if (apart - reach < range && (!jam || apart - reach < jam.Distance * km))
							jam = {ID: one.ID, Distance: Math.max(0, apart - reach) / km, Inside: apart < reach};
					}

					if (place || body) {
						way = vectors.Normalize(vectors.Subtract(one.World, object.World));

						nav.push({ID: one.ID, Kind: place ? place.Kind || 'mark' : traitOf(one, 'Star') ? 'star' : 'planet', Name: place && place.Name || one.Values.Name || one.ID, Distance: apart / km, Bearing: Math.atan2(vectors.Dot(way, right), vectors.Dot(way, ahead)) * 180 / Math.PI, Known: !place || !!place.Known || !!one.Known});
					}
				});
			}

			nav = nav.filter(function (one) {
				return one.Known;
			}).sort(function (a, b) {
				return a.Distance - b.Distance;
			}).slice(0, 12);

			return {
				Reactors: state ? state.Reactors.map(function (one) {
					return {ID: one.ID, Output: one.Output, Supply: one.Supply, Heat: one.Heat, On: one.On, Tripped: one.Tripped};
				}) : [],
				Supply: state ? state.Supply : 0,
				Load: state ? state.Load : 0,
				Power: state ? Object.assign({}, state.Power) : {Engines: 1, Shields: 1, Weapons: 1},
				Shares: state ? Object.assign({}, state.Shares) : null,
				Shields: state ? state.Layers.map(function (one) {
					return {ID: one.ID, Value: one.Value, Capacity: one.Capacity, Part: one.Capacity > 0 ? one.Value / one.Capacity : 0, Color: one.Color};
				}) : [],
				ShieldPart: capacity > 0 ? value / capacity : 0,
				Jam: jam,
				Nav: nav
			};
		};

		engine.SetPower = function (id, shares) {
			var object = scene.Objects[id];
			var state = object ? stateOf(object) : null;
			if (!state || !state.Powered) return false;

			['Engines', 'Shields', 'Weapons'].forEach(function (key) {
				if (shares && shares[key] !== undefined)
					state.Shares[key] = Math.max(0, number(shares[key], state.Shares[key]));
			});

			return true;
		};

		engine.SetReactor = function (id, reactor, on) {
			var object = scene.Objects[id];
			var state = object ? stateOf(object) : null;
			var found = state ? state.Reactors.filter(function (one) {
				return one.ID === reactor;
			})[0] : null;
			if (!found)
				return false;

			found.On = !!on;

			return true;
		};

		engine.Vent = function (id) {
			var object = scene.Objects[id];
			var state = object ? stateOf(object) : null;
			if (!state || !state.Reactors.length) return false;

			state.Reactors.forEach(function (reactor) {
				reactor.Heat = Math.max(0, reactor.Heat - 0.5);

				if (reactor.Heat <= reactor.Resume)
					reactor.Tripped = false;
			});

			return true;
		};
	},

	/* What the systems of an object read now: see SceneShipSystems. */
	ShipSystems: function (id) {
		var engine = this.Engine();

		return engine && engine.ShipSystems ? engine.ShipSystems(id === undefined ? this.Scene().Hero : id) : null;
	},

	/* How the power of the reactors of an object is shared: {Engines, Shields, Weapons} (those given). */
	SetPower: function (id, shares) {
		var engine = this.Engine();

		return !!(engine && engine.SetPower && engine.SetPower(id, shares));
	},

	/* A reactor of an object on or off. */
	SetReactor: function (id, reactor, on) {
		var engine = this.Engine();

		return !!(engine && engine.SetReactor && engine.SetReactor(id, reactor, on));
	},

	/* The heat of the reactors of an object down by half; one shut down by its heat on again once cool enough. */
	Vent: function (id) {
		var engine = this.Engine();

		return !!(engine && engine.Vent && engine.Vent(id));
	},

	/* What the layers of the shield of an object take of a hit: what is left of it, for its health. */
	Absorb: function (id, amount, hit) {
		var engine = this.Engine();

		return engine && engine.Absorb ? engine.Absorb(id, amount, hit) : amount;
	}
});
