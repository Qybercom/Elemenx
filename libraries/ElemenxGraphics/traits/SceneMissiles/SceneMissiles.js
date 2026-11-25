/*
 * SceneMissiles: what guides itself to what it was fired at, and what a ship does against it. A missile is a weapon
 * type (SceneWeapons) of Kind projectile with Guidance pn (proportional navigation: it turns as the line to its target
 * turns, Navigation times, 4, and meets it where it will be, not where it is): Speed (m/s as it leaves its rail), Accel
 * (m/s² of its motor), Top (m/s), Turn (m/s² it can turn by), Fuel (seconds its motor burns and it steers), Seeker
 * (degrees round its nose it sees: lost out of them half a second, it flies on blind), Fuse (metres from its target it
 * bursts), Decoy (metres from a flare it may take it, 4000), Health (what point defence takes of it), Lock {Time, Cone,
 * Count} (how long a ship holds a target in the Cone of its nose, or as its target, to lock it; how many at once),
 * Salvo (missiles a launch, over the targets locked) and Interval (seconds between them). Built in: ship-missile
 * (fast: 300 km/s, through point defence before it fires), ship-hunter (Values.Hunters, Launch Kind hunter, key Y: 25
 * km/s, heavier; point defence and flares work against it),
 * ship-torpedo (Values.Torpedoes: slow, heavy, its blast wide, point defence can bring it down; an agent launches it at
 * what has Health 500 and more), and of point defence ship-pd. Guidance lead (ship-missile) is simpler: its nose turns
 * at TurnRate (radians a second, 4) to where its way meets the target as that goes now, at any speed, and back to it
 * when it passed it.
 *
 * A ship carries them as Values.Missiles (the name of the type), Values.Flares (how many, or {Count, Salvo (2 a
 * release), Seconds (4 each burns), Lure (0 to 1, 0.15: how likely a missile that sees one goes to it; it holds to it
 * while it burns, past it it looks again for its target), Speed (m/s they are thrown at, 60), Every (seconds between
 * releases, 1)}) and Values.Defence (the weapon of its point defence, or {Weapon, On}: it fires by itself at the
 * missiles of others that come at it or near, each shot taking Damage of a missile times how likely it hits, Accuracy,
 * 0.35, less the farther it is). A ship locks what stays in the cone of its nose (the ship of the hero: in the middle
 * of the view) and its target (SetTarget of SceneTactics: a lock of its sensors, wherever it is); an agent
 * (SceneAgents) launches at its enemy locked, and against what comes at it releases flares and breaks away.
 *
 * Launch(id, options) launches a salvo of a ship ({Target, Targets, Count, Kind: missile or torpedo}; else at what it
 * locked): how many go. Driver(id, target) fires its mass driver (Values.Driver, ship-massdriver: a slug of 20 km/s) at
 * target (else its target, else what it locked) where the slug meets it as it goes: true if it fired. Flares(id)
 * releases flares: how many. Defence(id, on) turns its point defence on or off (true or false; none: as it is).
 * Incoming(id) are the missiles at an object [{ID, Source, Weapon, At, Distance (m), Seconds}]. ArmsOf(id) is what a
 * ship has: {Missiles, Left, Magazine, Reloading, Locks [{ID, Progress, Locked}], Locked, Flares {Left, Count}, Defence
 * {Weapon, On}, Incoming, Soonest (seconds), LockedBy, Flying, Torpedoes and Driver {Name, Left, Magazine, Reloading,
 * Ready, Flying}}. An empty id is the ship of the hero (the one it is, sits in or walks in). The keys: M launches
 * missiles, K a torpedo, U fires the mass driver, N releases flares. Events: missile ({ID, Weapon, Source, Target,
 * State: launch, decoyed, reacquired, lost, intercepted (By), hit, spent}), flares ({ID, Count, Left}), and lock and
 * unlock of the ship of the hero ({ID, Weapon, By}). Contacts (SceneTactics) know the missiles and the flares round a
 * ship (Kind missile, flare; Incoming).
 *
 */
Elemenx.Trait('SceneMissiles', {
	MissilesStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var vectors = this.$Service('Math').Vectors;
		var state = scene.Missiles = {Clock: 0, Counter: 0, Flares: [], Left: {}, Released: {}, Locks: {}, Queue: [], Flown: {}, Defence: {}, Cooling: {}, Launched: {}};

		function number (value, fallback) {
			return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function metre () {
			return engine.WeaponsMetre ? engine.WeaponsMetre() : 1;
		}

		function typeOf (name) {
			return name && scene.WeaponTypes ? scene.WeaponTypes[name] || null : null;
		}

		function alive (object) {
			return !!object && !!object.World && !object.Hidden && !(object.Values.Health !== undefined && object.Values.Health !== '' && Number(object.Values.Health) <= 0);
		}

		/* The team of an object: its own, else the scene's for the hero, its ship and who sits in it. */
		function teamOf (object) {
			var hero = scene.Hero ? scene.Objects[scene.Hero] : null;
			var seated = scene.Seated && scene.Seated[scene.Hero];

			if (!object) return '';

			if (object.Values.Team || object.Team)
				return String(object.Values.Team || object.Team);

			if (hero && (object === hero || object.ID === hero.Pilot || seated && seated.Vehicle === object.ID)) return String(self.Team || '');

			return '';
		}

		function centerOf (object) {
			return engine.WeaponsCenter ? engine.WeaponsCenter(object) : object.World;
		}

		/* The ship of the hero: the one it is, sits in or walks in (SceneLanding). */
		function heroShip () {
			return engine.CommandShip ? engine.CommandShip('') : null;
		}

		function shipOf (id) {
			var object = id ? scene.Objects[id] : heroShip();

			return object && object.Values ? object : null;
		}

		/* What it throws as flares: Values.Flares as a count, or its settings. */
		function flaresOf (ship) {
			var given = ship.Values.Flares;
			if (!given)
				return null;

			return Object.assign({Count: 24, Salvo: 2, Seconds: 4, Lure: 0.15, Speed: 60, Every: 1}, typeof given === 'object' ? given : {Count: number(given, 24)});
		}

		/* Its point defence: Values.Defence as the name of its weapon, or {Weapon, On}. */
		function defenceOf (ship) {
			var given = ship.Values.Defence;
			var name = typeof given === 'object' && given ? given.Weapon : given;

			return name && typeOf(name) ? {Weapon: name, Type: typeOf(name), On: state.Defence[ship.ID] !== undefined ? state.Defence[ship.ID] : !(typeof given === 'object' && given.On === false)} : null;
		}

		/* How fast a thing goes in the frame of the body a shot goes round (as a missile reckons it). */
		function wayOf (object, around) {
			if (object.Ship && around && object.Values.Vehicle && object.Values.Vehicle.Around === around) return object.Ship.Way;

			return object.WorldWay || [0, 0, 0];
		}

		function flareNamed (id) {
			return state.Flares.filter(function (flare) {
				return flare.ID === id;
			})[0] || null;
		}

		/* What a missile knows of itself: its health, the flares it saw, how long it lost its target. */
		function recordOf (shot) {
			var record = state.Flown[shot.ID];
			if (!record)
				record = state.Flown[shot.ID] = {Health: number(shot.Type.Health, 10), Tried: {}, Lost: 0, Life: 0, Told: {}};

			return record;
		}

		function tell (shot, kind, extra) {
			var record = recordOf(shot);
			if (record.Told[kind]) return;

			record.Told[kind] = true;

			self.$Emit('missile', Object.assign({ID: shot.ID, Weapon: shot.Name, Source: shot.Source, Target: shot.Target || '', State: kind}, extra || {}));
		}

		/*
		 * The middle of a ship where its step has it (by what it goes round), not where it is drawn (between two steps,
		 * behind); by that body where the missile has it (where it was as the missile was set by it this frame: a planet
		 * goes on in a frame too). Regression: at 15 km/s a missile looked for its target a kilometre behind it and passed
		 * it; and, a planet going round its star, hundreds of km off, it never burst.
		 */
		function placeOf (object, shot) {
			var around = shot.Around;
			var round = object.Ship && around && object.Values.Vehicle && object.Values.Vehicle.Around === around ? scene.Objects[around] : null;
			var middle = centerOf(object);
			var origin = round && shot.Rel ? vectors.Subtract(shot.At, shot.Rel) : round ? round.World : null;

			return origin ? vectors.Add(vectors.Add(origin, object.Ship.At), vectors.Subtract(middle, object.World)) : middle;
		}

		/* Where a missile goes now: of the flare it took, else of its target ({At, Way, Object, Flare}); null for none. */
		function goalOf (shot) {
			var flare = shot.Decoy ? flareNamed(shot.Decoy) : null;
			var target = shot.Target ? scene.Objects[shot.Target] : null;

			if (flare)
				return {At: flare.At, Way: flare.Velocity, Object: null, Flare: flare};

			if (target && alive(target))
				return {At: placeOf(target, shot), Way: wayOf(target, shot.Around), Object: target, Flare: null};

			return null;
		}

		/*
		 * A step of a missile (SceneWeapons asks it each frame): what its seeker sees (flares in its cone tried once each, its
		 * target out of it lost), then its motor and its turn by proportional navigation. False: it is gone (point defence
		 * brought it down).
		 */
		engine.MissileGuide = function (shot, elapsed) {
			var type = shot.Type;
			var unit = metre();
			var record = recordOf(shot);
			var boost = number(type.Boost, 0.8);
			var own;
			var speed;
			var heading;
			var goal;
			var accel = [0, 0, 0];
			var fuel;

			if (record.Dead) {
				tell(shot, record.Dead, record.By ? {By: record.By} : null);

				delete state.Flown[shot.ID];

				return false;
			}

			record.Life += elapsed;
			fuel = record.Life < number(type.Fuel, 14);
			own = vectors.Subtract(shot.Velocity, shot.Carried || [0, 0, 0]);
			speed = vectors.Length(own);
			heading = speed > 1e-12 ? vectors.Scale(own, 1 / speed) : shot.Way;

			/*
			 * Its flare burnt out or passed (behind it): its seeker looks again. Its target in it, it goes on to it (reacquired);
			 * else it flies on blind (lost). Regression: a missile once on a flare was lost for good, so flares took every one.
			 */
			if (shot.Decoy) {
				var flare = flareNamed(shot.Decoy);
				var again = shot.Target ? scene.Objects[shot.Target] : null;

				if (!flare || vectors.Dot(vectors.Subtract(flare.At, shot.At), heading) < 0) {
					shot.Decoy = '';

					if (again && alive(again) && vectors.Dot(vectors.Normalize(vectors.Subtract(centerOf(again), shot.At)), heading) >= Math.cos(number(type.Seeker, 45) * Math.PI / 180)) {
						record.Lost = 0;

						self.$Emit('missile', {ID: shot.ID, Weapon: shot.Name, Source: shot.Source, Target: shot.Target, State: 'reacquired'});
					}
					else {
						shot.Target = '';

						tell(shot, 'lost');
					}
				}
			}

			goal = goalOf(shot);

			if (!goal && shot.Target) {
				shot.Target = '';

				tell(shot, 'lost');
			}

			/* A flare in its seeker, nearer than half again its target: tried once; taken, as likely as its Lure. */
			if (goal && goal.Object) {
				var far = vectors.Distance(goal.At, shot.At);
				var seeker = Math.cos(number(type.Seeker, 45) * Math.PI / 180);

				state.Flares.forEach(function (flare) {
					var line;
					var apart;

					if (shot.Decoy || record.Tried[flare.ID] || flare.Team && flare.Team === shot.Team) return;

					line = vectors.Subtract(flare.At, shot.At);
					apart = vectors.Length(line);

					/* Seen as apart from its target only near (Decoy metres of the missile, 4000), in its seeker. */
					if (apart > far * 1.5 || apart > number(type.Decoy, 4000) * unit || vectors.Dot(vectors.Scale(line, 1 / Math.max(1e-12, apart)), heading) < seeker) return;

					record.Tried[flare.ID] = true;

					if (Math.random() < flare.Lure) {
						shot.Decoy = flare.ID;

						tell(shot, 'decoyed', {Flare: flare.ID});
					}
				});

				goal = goalOf(shot);
			}

			/*
			 * Out of its seeker half a second, once it saw it (launched off its nose, it turns to it first, five times its boost
			 * at most): lost. A flare it took it holds while it burns. Regression: one launched at what was behind its ship was
			 * lost as it turned.
			 */
			if (goal && !goal.Flare && record.Life > boost) {
				var line = vectors.Normalize(vectors.Subtract(goal.At, shot.At));
				var inside = vectors.Dot(line, heading) >= Math.cos(number(type.Seeker, 45) * Math.PI / 180);
				if (inside)
					record.Seen = true;

				record.Lost = inside || !record.Seen && record.Life < boost * 5 ? 0 : record.Lost + elapsed;

				if (record.Lost > 0.5) {
					shot.Target = '';
					shot.Decoy = '';
					goal = null;

					tell(shot, 'lost');
				}
			}

			/*
			 * Guidance lead: its nose turned (TurnRate, radians a second, 4: as fast at any speed) to where its way meets what it
			 * goes to as that goes now; past it, it turns back. Simpler than pn, and it catches what goes fast.
			 */
			if (goal && fuel && type.Guidance === 'lead') {
				var toward = vectors.Subtract(goal.At, shot.At);
				var going = vectors.Subtract(goal.Way || [0, 0, 0], shot.Carried || [0, 0, 0]);
				/* As fast as it will soon go (it speeds up as it goes). Regression: by how fast it went on its rail, slower than its target, it found no meeting and chased it. */
				var fast = Math.max(speed, number(type.Speed, 400) * unit, number(type.Top, 2000) * unit * 0.7);
				var qa = vectors.Dot(going, going) - fast * fast;
				var qb = 2 * vectors.Dot(toward, going);
				var qc = vectors.Dot(toward, toward);
				var root = qb * qb - 4 * qa * qc;
				var meet = 0;
				var wanted;
				var angle;
				var aside;
				var step;

				if (Math.abs(qa) > 1e-30 && root >= 0)
					meet = Math.max((-qb - Math.sqrt(root)) / (2 * qa), (-qb + Math.sqrt(root)) / (2 * qa));

				meet = isFinite(meet) && meet > 0 ? Math.min(meet, 20) : 0;
				wanted = vectors.Normalize(vectors.Add(toward, vectors.Scale(going, meet)));
				angle = Math.acos(Math.max(-1, Math.min(1, vectors.Dot(heading, wanted))));
				aside = vectors.Subtract(wanted, vectors.Scale(heading, vectors.Dot(heading, wanted)));

				if (vectors.Length(aside) < 1e-9)
					aside = vectors.Cross(heading, Math.abs(heading[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]);

				aside = vectors.Normalize(aside);
				step = Math.min(angle, number(type.TurnRate, 4) * elapsed);

				if (isFinite(step) && angle > 1e-6) {
					heading = vectors.Normalize(vectors.Add(vectors.Scale(heading, Math.cos(step)), vectors.Scale(aside, Math.sin(step))));
					shot.Velocity = vectors.Add(shot.Carried || [0, 0, 0], vectors.Scale(heading, speed));
				}
			}
			else if (goal && fuel) {
				var r = vectors.Subtract(goal.At, shot.At);
				var d = Math.max(1e-12, vectors.Length(r));
				var los = vectors.Scale(r, 1 / d);
				var v = vectors.Subtract(goal.Way || [0, 0, 0], shot.Velocity);
				var omega = vectors.Scale(vectors.Cross(r, v), 1 / (d * d));
				var closing = -vectors.Dot(r, v) / d;
				var turn = number(type.Turn, 400) * unit;
				var lateral;

				/* Off its rail (or the target behind it): turned straight to it first; then the turn of its line, Navigation times. */
				if (record.Life < boost || vectors.Dot(los, heading) < 0.3) lateral = vectors.Scale(vectors.Normalize(vectors.Subtract(los, vectors.Scale(heading, vectors.Dot(los, heading)))), turn);
				else lateral = vectors.Scale(vectors.Cross(omega, los), number(type.Navigation, 4) * Math.max(closing, speed * 0.3));

				lateral = vectors.Subtract(lateral, vectors.Scale(heading, vectors.Dot(lateral, heading)));

				if (vectors.Length(lateral) > turn)
					lateral = vectors.Scale(vectors.Normalize(lateral), turn);

				if (isFinite(lateral[0]) && isFinite(lateral[1]) && isFinite(lateral[2]))
					accel = lateral;
			}

			/* Its motor: full turned to what it goes to, little while it turns to it (a tight turn, not away from it). */
			if (fuel && speed < number(type.Top, 2000) * unit)
				accel = vectors.Add(accel, vectors.Scale(heading, number(type.Accel, 500) * unit * (goal ? Math.max(0.1, vectors.Dot(vectors.Normalize(vectors.Subtract(goal.At, shot.At)), heading)) : 1)));

			shot.Velocity = vectors.Add(shot.Velocity, vectors.Scale(accel, elapsed));
			own = vectors.Subtract(shot.Velocity, shot.Carried || [0, 0, 0]);

			if (vectors.Length(own) > number(type.Top, 2000) * unit)
				shot.Velocity = vectors.Add(shot.Carried || [0, 0, 0], vectors.Scale(vectors.Normalize(own), number(type.Top, 2000) * unit));

			shot.Way = vectors.Normalize(vectors.Subtract(shot.Velocity, shot.Carried || [0, 0, 0]));

			return true;
		};

		/*
		 * Whether a missile passed near enough what it goes to (its Fuse, and a little of the size of a ship) in a step of its
		 * flight (from before to where it is, from and to seconds into the frame, as what it goes to goes on in them too): it
		 * bursts there, the ship hit, what is near taking its blast. True: it is gone. Regression: by where its target was as
		 * the frame began, a missile that met one going 5 km/s where it went passed it by 150 m and never burst.
		 */
		engine.MissileFuse = function (shot, before, from, to) {
			var goal = goalOf(shot);
			var unit = metre();
			var segment;
			var length;
			var t;
			var point;
			var reach;
			var body;
			var way;

			/* None, or a flare: it bursts by no flare (it passes it, and looks again). */
			if (!goal || goal.Flare) return false;

			var start = vectors.Subtract(before, vectors.Add(goal.At, vectors.Scale(goal.Way || [0, 0, 0], from || 0)));
			var end = vectors.Subtract(shot.At, vectors.Add(goal.At, vectors.Scale(goal.Way || [0, 0, 0], to || 0)));
			var near;

			segment = vectors.Subtract(end, start);
			length = vectors.Dot(segment, segment);
			t = length > 0 ? Math.max(0, Math.min(1, -vectors.Dot(start, segment) / length)) : 1;
			near = vectors.Length(vectors.Add(start, vectors.Scale(segment, t)));
			point = vectors.Add(before, vectors.Scale(vectors.Subtract(shot.At, before), t));
			body = goal.Object && engine.BodyOf ? engine.BodyOf(goal.Object) : null;
			reach = number(shot.Type.Fuse, 25) * unit + (body ? vectors.Distance(body.Max, body.Min) * 0.15 : 0);

			if (near > reach) return false;

			shot.At = point;
			way = vectors.Normalize(vectors.Subtract(vectors.Add(goal.At, vectors.Scale(goal.Way || [0, 0, 0], (from || 0) + ((to || 0) - (from || 0)) * t)), point));

			if (goal.Object && engine.WeaponsHit) {
				shot.Spare = goal.Object.ID;

				engine.WeaponsHit(shot, {ID: goal.Object.ID, Object: goal.Object, Point: point, Normal: vectors.Scale(way, -1), Material: engine.WeaponsMaterial ? engine.WeaponsMaterial(goal.Object, null) : 'metal', Part: ''}, number(shot.Type.Damage, 100), way);
			}

			if (engine.WeaponsBlast)
				engine.WeaponsBlast(shot, point, vectors.Scale(way, -1));

			tell(shot, goal.Object ? 'hit' : 'spent', goal.Flare ? {Flare: goal.Flare.ID} : null);

			delete state.Flown[shot.ID];

			return true;
		};

		/* A missile ended by SceneWeapons: it struck something (hit), or flew its range (spent). */
		engine.MissileEnded = function (shot, kind, id) {
			tell(shot, kind, id ? {Struck: id} : null);

			delete state.Flown[shot.ID];
		};

		/* The missiles in flight (of the shots of SceneWeapons). */
		function missiles () {
			return scene.Weapons ? scene.Weapons.Shots.filter(function (shot) {
				return !!shot.Type.Guidance && !!shot.Velocity;
			}) : [];
		}

		function shotTeam (shot) {
			return shot.Team || teamOf(scene.Objects[shot.Source]);
		}

		/* How many missiles a ship has left of its magazine (SceneWeapons keeps its rounds), 0 while it reloads. */
		function leftOf (ship, name) {
			var type = typeOf(name);
			var rounds = scene.Weapons ? scene.Weapons.Rounds[ship.ID + ':' + name] : null;

			if (!type) return 0;

			if (!type.Magazine) return Infinity;

			if (!rounds || rounds.Reloading && rounds.Reloading <= scene.Weapons.Clock) return number(type.Magazine, 1);

			return rounds.Reloading ? 0 : rounds.Left;
		}

		function lockedOf (ship) {
			var locks = state.Locks[ship.ID] || {};

			return Object.keys(locks).filter(function (id) {
				return locks[id].Locked && scene.Objects[id];
			});
		}

		/* A salvo: Count missiles (its Salvo) over the targets, one each Interval seconds from its rails, left and right. */
		/* The guided weapon of a ship of a kind: missile (Values.Missiles), hunter (Values.Hunters), torpedo (Values.Torpedoes). */
		function guidedOf (ship, kind) {
			if (kind === 'torpedo')
				return ship.Values.Torpedoes;

			return kind === 'hunter' ? ship.Values.Hunters : ship.Values.Missiles;
		}

		function launch (ship, options) {
			var given = options || {};
			var name = guidedOf(ship, given.Kind);
			var type = typeOf(name);
			var targets = Array.isArray(given.Targets) ? given.Targets : given.Target ? [given.Target] : lockedOf(ship);
			var count;
			var queued = state.Queue.filter(function (one) {
				return one.Ship === ship.ID && one.Name === name;
			}).length;
			var i;

			targets = targets.filter(function (id) {
				return scene.Objects[id] && id !== ship.ID;
			});

			if (!type || !targets.length || !alive(ship)) return 0;

			count = Math.max(0, Math.min(number(given.Count, number(type.Salvo, 2)), leftOf(ship, name) - queued));

			for (i = 0; i < count; i++)
				state.Queue.push({Ship: ship.ID, Name: name, Target: targets[i % targets.length], Side: i % 2 ? 1 : -1, At: state.Clock + i * number(type.Interval, 0.25)});

			if (count)
				state.Launched[ship.ID + ':' + name] = state.Clock;

			return count;
		}

		engine.MissileLaunch = function (ship, options) {
			return launch(ship, options);
		};

		/* Whether an agent may launch (a kind: missile, torpedo) at its enemy now: locked, some left, none for Every seconds (6). */
		engine.MissileReady = function (ship, target, kind) {
			var name = guidedOf(ship, kind);
			var type = typeOf(name);
			var locks = state.Locks[ship.ID] || {};
			var last = state.Launched[ship.ID + ':' + name];

			if (!type || !locks[target] || !locks[target].Locked || leftOf(ship, name) <= 0) return false;

			return state.Clock - (last === undefined ? -Infinity : last) > number(type.Every, 6);
		};

		/*
		 * The mass driver of a ship (Values.Driver) fired at its target (else the one it locked, or target): the way where its
		 * slug meets it as it goes (the lead, as an agent aims, SceneAgents). True if it fired.
		 */
		function drive (ship, target) {
			var name = ship.Values.Driver;
			var type = typeOf(name);
			var id = target || (ship.Tactics && ship.Tactics.Target) || lockedOf(ship)[0] || '';
			var aimed = id ? scene.Objects[id] : null;
			var aim;

			if (!type || !aimed || !alive(aimed) || !alive(ship) || aimed === ship) return false;

			aim = engine.AgentLead ? engine.AgentLead(ship, aimed, type) : {Way: vectors.Normalize(vectors.Subtract(centerOf(aimed), centerOf(ship)))};

			return !!engine.Fire(ship.ID, {Weapon: name, Way: aim.Way, Target: aimed.ID});
		}

		engine.MissileDriver = drive;

		/* The lance of a ship (Values.Lance) at its target (else what it locked, or target): it charges, then burns on it. */
		function lance (ship, target) {
			var name = ship.Values.Lance;
			var id = target || (ship.Tactics && ship.Tactics.Target) || lockedOf(ship)[0] || '';
			var aimed = id ? scene.Objects[id] : null;
			if (!typeOf(name) || !aimed || !alive(aimed) || !alive(ship) || aimed === ship) return false;

			return !!engine.Fire(ship.ID, {Weapon: name, Target: aimed.ID, At: aimed.ID});
		}

		engine.MissileLance = lance;

		/*
		 * The railgun faster than light of a ship or of a platform (Values.Railgun; its mode Values.RailgunMode or of its type)
		 * at target (else its target, else what it locked): it charges, then a tunnel of warp takes its slug there
		 * (SceneWeapons, Kind tunnel). Mode (options): predict or direct. True if it began.
		 */
		function railgun (object, target, options) {
			var name = object.Values.Railgun;
			var given = options || {};
			var id = target || (object.Tactics && object.Tactics.Target) || lockedOf(object)[0] || '';
			var aimed = id ? scene.Objects[id] : null;
			if (!typeOf(name) || !aimed || !alive(aimed) || !alive(object) || aimed === object) return false;

			return !!engine.Fire(object.ID, {Weapon: name, Target: aimed.ID, At: aimed.ID, Mode: given.Mode || object.Values.RailgunMode || ''});
		}

		engine.MissileRailgun = railgun;

		/* Flares thrown out of a ship, behind it and round it, in the frame it goes round. */
		function release (ship) {
			var settings = flaresOf(ship);
			var unit = metre();
			var left;
			var count;
			var round;
			var from;
			var carried;
			var frame;
			var i;

			if (!settings || !alive(ship)) return 0;

			left = state.Left[ship.ID] === undefined ? number(settings.Count, 24) : state.Left[ship.ID];

			if (left <= 0 || state.Clock - (state.Released[ship.ID] === undefined ? -Infinity : state.Released[ship.ID]) < number(settings.Every, 1)) return 0;

			count = Math.min(left, Math.max(1, number(settings.Salvo, 4)));
			round = ship.Ship && ship.Values.Vehicle && ship.Values.Vehicle.Around && !scene.Ground ? scene.Objects[ship.Values.Vehicle.Around] : null;
			from = centerOf(ship);
			carried = round && round.World ? ship.Ship.Way.slice() : (ship.WorldWay || [0, 0, 0]).slice();
			frame = ship.Ship || {Ahead: [0, 0, 1], Right: [1, 0, 0], Up: [0, 1, 0]};

			for (i = 0; i < count; i++) {
				var throwWay = vectors.Normalize(vectors.Add(vectors.Scale(frame.Ahead, -0.7), vectors.Add(vectors.Scale(frame.Right, Math.random() * 2 - 1), vectors.Scale(frame.Up, Math.random() * 1.4 - 0.5))));

				state.Flares.push({ID: ship.ID + '-flare-' + (++state.Counter), Owner: ship.ID, Team: teamOf(ship), At: from.slice(), Around: round && round.World ? round.ID : '', Rel: round && round.World ? ship.Ship && ship.Ship.At ? vectors.Add(ship.Ship.At, vectors.Subtract(from, ship.World)) : vectors.Subtract(from, round.World) : null, Carried: carried, Velocity: vectors.Add(carried, vectors.Scale(throwWay, number(settings.Speed, 30) * unit)), Born: state.Clock, Seconds: number(settings.Seconds, 4), Lure: Math.max(0, Math.min(1, number(settings.Lure, 0.4)))});
			}

			state.Left[ship.ID] = left - count;
			state.Released[ship.ID] = state.Clock;

			self.$Emit('flares', {ID: ship.ID, Count: count, Left: left - count});

			return count;
		}

		engine.MissileFlares = release;

		/* The flares burn and drift (slowing as they leave the ship), then go. */
		function flaresStep (elapsed) {
			state.Flares = state.Flares.filter(function (flare) {
				var round = flare.Around ? scene.Objects[flare.Around] : null;
				var moved;

				if (state.Clock - flare.Born > flare.Seconds) return false;

				flare.Velocity = vectors.Add(flare.Carried, vectors.Scale(vectors.Subtract(flare.Velocity, flare.Carried), Math.exp(-elapsed * 0.8)));
				moved = vectors.Scale(flare.Velocity, elapsed);

				if (round && round.World && flare.Rel) {
					flare.Rel = vectors.Add(flare.Rel, moved);
					flare.At = vectors.Add(round.World, flare.Rel);
				}
				else {
					flare.At = vectors.Add(flare.At, moved);
				}

				return true;
			});
		}

		/*
		 * Point defence: each ship with its Defence on fires at the missile of another team that will reach it soonest (one that
		 * comes at it, or is at it), within its Range; each shot takes Damage of it times how likely it hits (Accuracy, less
		 * the farther it is), a tracer to it. Its Health gone: brought down.
		 */
		function defenceStep (elapsed) {
			var flying = missiles();
			var unit = metre();

			if (!flying.length) return;

			scene.Order.forEach(function (ship) {
				var defence = ship.Values.Defence ? defenceOf(ship) : null;
				var type;
				var team;
				var from;
				var own;
				var best = null;
				var soonest = Infinity;
				var range;
				var far;

				if (!defence || !defence.On || !alive(ship)) return;

				type = defence.Type;
				team = teamOf(ship);
				from = centerOf(ship);
				own = wayOf(ship, ship.Values.Vehicle ? ship.Values.Vehicle.Around : '');
				range = number(type.Range, 2500) * unit;

				flying.forEach(function (shot) {
					var record = state.Flown[shot.ID];
					var line;
					var closing;
					var time;

					if (!record || record.Dead || shot.Source === ship.ID || !team || shotTeam(shot) === team) return;

					line = vectors.Subtract(shot.At, from);
					far = vectors.Length(line);

					if (far > range) return;

					closing = -vectors.Dot(line, vectors.Subtract(shot.Velocity, own)) / Math.max(1e-12, far);

					if (closing <= 0 && shot.Target !== ship.ID) return;

					time = far / Math.max(closing, 1e-9);

					if (time < soonest) {
						soonest = time;
						best = shot;
					}
				});

				state.Cooling[ship.ID] = Math.min(2, (state.Cooling[ship.ID] || 0) + elapsed * number(type.Rate, 20));

				while (best && state.Cooling[ship.ID] >= 1) {
					var record = state.Flown[best.ID];
					var apart = vectors.Distance(best.At, from);
					var likely = Math.max(0.05, Math.min(1, number(type.Accuracy, 0.35) * (1 - 0.7 * apart / range)));
					var miss = (1 - likely) * apart * 0.03;

					state.Cooling[ship.ID] -= 1;
					record.Health -= number(type.Damage, 3) * likely;

					if (engine.WeaponsStreak)
						engine.WeaponsStreak(from, vectors.Add(best.At, [(Math.random() - 0.5) * miss, (Math.random() - 0.5) * miss, (Math.random() - 0.5) * miss]), engine.Hex(type.Color || '#ffd27a', [1, 0.8, 0.5]), number(type.Width, 0.3), 0.12, 'tracer');

					if (record.Health <= 0) {
						record.Dead = 'intercepted';
						record.By = ship.ID;

						if (self.Burst)
							self.Burst('blast', best.At, {Size: 0.4});

						break;
					}
				}
			});
		}

		/*
		 * The locks of each ship that carries missiles: what stays in the Cone of its nose (the ship of the hero: of the middle
		 * of the view) and its target (a lock of its sensors), within the Range of its missile, the nearest to its aim first,
		 * Count at once; Time seconds to lock, let go slowly.
		 */
		function locksStep (elapsed) {
			var hero = heroShip();
			var unit = metre();

			scene.Order.forEach(function (ship) {
				var name = ship.Values.Missiles || ship.Values.Hunters || ship.Values.Torpedoes;
				var type = typeOf(name);
				var lock = type ? type.Lock || {} : null;
				var was = state.Locks[ship.ID] || {};
				var keep = {};
				var team;
				var from;
				var aim;
				var cone;
				var range;
				var picked;
				var agent;

				if (!type || !alive(ship)) {
					delete state.Locks[ship.ID];

					return;
				}

				team = teamOf(ship);
				from = centerOf(ship);
				cone = Math.cos(number(lock.Cone, 15) * Math.PI / 180);
				range = number(type.Range, 20000) * unit;
				aim = ship === hero && engine.Ray && scene.Width && !scene.Tactic ? engine.Ray(scene.Width / 2, scene.Height / 2).Direction : ship.Ship ? ship.Ship.Ahead : ship.Heading || [0, 0, 1];
				agent = scene.Agents && scene.Agents[ship.ID] ? scene.Agents[ship.ID].Enemy : '';

				picked = scene.Order.map(function (other) {
					var line;
					var far;
					var facing;
					var sensed;

					if (other === ship || !alive(other) || !team || !teamOf(other) || teamOf(other) === team || other.Values.Aboard || other.Kind === 'planet' || other.Kind === 'star' || other.Kind === 'moon') return null;

					line = vectors.Subtract(centerOf(other), from);
					far = vectors.Length(line);

					if (far > range) return null;

					facing = vectors.Dot(vectors.Scale(line, 1 / Math.max(1e-12, far)), aim);
					sensed = ship.Tactics && ship.Tactics.Target === other.ID;

					if (facing < cone && !sensed) return null;

					if (agent && agent !== other.ID && !sensed) return null;

					return {ID: other.ID, Score: sensed ? 2 : facing};
				}).filter(Boolean).sort(function (a, b) {
					return b.Score - a.Score;
				}).slice(0, Math.max(1, number(lock.Count, 2)));

				picked.forEach(function (one) {
					var lockOf = was[one.ID] || {Progress: 0, Locked: false};

					lockOf.Progress = Math.min(1, lockOf.Progress + elapsed / Math.max(0.05, number(lock.Time, 1.5)));

					if (lockOf.Progress >= 1 && !lockOf.Locked) {
						lockOf.Locked = true;

						if (ship === hero)
							self.$Emit('lock', {ID: one.ID, Weapon: name, By: ship.ID});
					}

					keep[one.ID] = lockOf;
				});

				Object.keys(was).forEach(function (id) {
					var lockOf = was[id];

					if (keep[id] || !scene.Objects[id]) return;

					lockOf.Progress -= elapsed * 0.8;

					/* Out of the cone a moment: a lock begun fades out, one made holds down to 0.4. Regression: a lock begun was gone at once. */
					if (lockOf.Progress > (lockOf.Locked ? 0.4 : 0)) {
						keep[id] = lockOf;

						return;
					}

					if (lockOf.Locked && ship === hero)
						self.$Emit('unlock', {ID: id, Weapon: name, By: ship.ID});
				});

				state.Locks[ship.ID] = keep;
			});
		}

		/* The salvos waiting: each missile off its rail when its moment comes (a moment later while its weapon is not ready). */
		function queueStep () {
			state.Queue = state.Queue.filter(function (one) {
				var ship = scene.Objects[one.Ship];
				var frame;
				var way;
				var before;

				if (!ship || !alive(ship) || !scene.Objects[one.Target]) return false;

				if (one.At > state.Clock) return true;

				if (leftOf(ship, one.Name) <= 0) return false;

				frame = ship.Ship || {Ahead: ship.Heading || [0, 0, 1], Right: [1, 0, 0], Up: [0, 1, 0]};
				way = vectors.Normalize(vectors.Add(frame.Ahead, vectors.Add(vectors.Scale(frame.Right, one.Side * 0.2), vectors.Scale(frame.Up, 0.06))));
				before = scene.Weapons.Shots.length;

				if (!engine.Fire(ship.ID, {Weapon: one.Name, Target: one.Target, Way: way})) return true;

				scene.Weapons.Shots.slice(before).forEach(function (shot) {
					shot.Team = shot.Team || teamOf(ship);

					tell(shot, 'launch');
				});

				return false;
			});
		}

		/* The missiles and flares round a ship, for its contacts (SceneTactics): [{ID, Name, Kind, Team, At, Velocity, Aimed}]. */
		engine.MissileThings = function () {
			return missiles().map(function (shot) {
				return {ID: shot.ID, Name: shot.Name, Kind: 'missile', Team: shotTeam(shot), At: shot.At.slice(), Velocity: shot.Velocity.slice(), Aimed: shot.Decoy ? '' : shot.Target || ''};
			}).concat(state.Flares.map(function (flare) {
				return {ID: flare.ID, Name: 'Flare', Kind: 'flare', Team: flare.Team, At: flare.At.slice(), Velocity: flare.Velocity.slice(), Aimed: ''};
			}));
		};

		/* The missiles at an object (see Incoming). */
		engine.MissilesAt = function (id) {
			var object = scene.Objects[id];
			var unit = metre();

			if (!object) return [];

			return missiles().filter(function (shot) {
				return shot.Target === id && !shot.Decoy && state.Flown[shot.ID] && !state.Flown[shot.ID].Dead;
			}).map(function (shot) {
				var line = vectors.Subtract(centerOf(object), shot.At);
				var far = vectors.Length(line);
				var closing = vectors.Dot(vectors.Subtract(shot.Velocity, wayOf(object, shot.Around)), line) / Math.max(1e-12, far);

				return {ID: shot.ID, Source: shot.Source, Weapon: shot.Name, At: shot.At.slice(), Distance: far / unit, Seconds: closing > 0 ? far / closing : Infinity};
			}).sort(function (a, b) {
				return a.Seconds - b.Seconds;
			});
		};

		/* What a ship has (see ArmsOf). */
		engine.ArmsOf = function (ship) {
			var name = ship.Values.Missiles;
			var type = typeOf(name);
			var flares = flaresOf(ship);
			var defence = defenceOf(ship);
			var locks = state.Locks[ship.ID] || {};
			var incoming = engine.MissilesAt(ship.ID);
			var rounds = type && scene.Weapons ? scene.Weapons.Rounds[ship.ID + ':' + name] : null;

			var torpedo = typeOf(ship.Values.Torpedoes);
			var hunter = typeOf(ship.Values.Hunters);
			var driver = typeOf(ship.Values.Driver);
			var lanceType = typeOf(ship.Values.Lance);
			var railType = typeOf(ship.Values.Railgun);
			if (!type && !flares && !defence && !torpedo && !driver && !lanceType && !railType && !hunter) return null;

			return {
				Missiles: type ? name : '',
				Left: type ? Math.min(leftOf(ship, name), 1e9) : 0,
				Magazine: type ? number(type.Magazine, 0) : 0,
				Reloading: !!(rounds && rounds.Reloading && rounds.Reloading > scene.Weapons.Clock),
				Locks: Object.keys(locks).map(function (id) {
					return {ID: id, Progress: locks[id].Progress, Locked: locks[id].Locked};
				}),
				Locked: lockedOf(ship),
				Flares: flares ? {Left: state.Left[ship.ID] === undefined ? number(flares.Count, 24) : state.Left[ship.ID], Count: number(flares.Count, 24)} : null,
				Defence: defence ? {Weapon: defence.Weapon, On: !!defence.On} : null,
				Incoming: incoming.length,
				Soonest: incoming.length ? incoming[0].Seconds : Infinity,
				LockedBy: Object.keys(state.Locks).filter(function (id) {
					return state.Locks[id][ship.ID] && state.Locks[id][ship.ID].Locked;
				}),
				Flying: missiles().filter(function (shot) {
					return shot.Source === ship.ID && shot.Name === name;
				}).length,
				Torpedoes: torpedo ? magazineOf(ship, ship.Values.Torpedoes) : null,
				Hunters: hunter ? magazineOf(ship, ship.Values.Hunters) : null,
				Driver: driver ? magazineOf(ship, ship.Values.Driver) : null,
				Lance: lanceType ? lanceOf(ship) : null,
				Railgun: railType ? Object.assign(magazineOf(ship, ship.Values.Railgun), {Charge: engine.WeaponsCharge ? engine.WeaponsCharge(ship.ID, ship.Values.Railgun) : -1, Mode: ship.Values.RailgunMode || railType.Mode || 'predict'}) : null
			};
		};

		/* What a ship has of its lance: {Name, Charge (0 to 1, -1 not charging), Burning, Ready, Cooldown (seconds)}. */
		function lanceOf (ship) {
			var name = ship.Values.Lance;
			var key = ship.ID + ':' + name;
			var until = scene.Weapons ? scene.Weapons.Ready[key] || 0 : 0;
			var charge = engine.WeaponsCharge ? engine.WeaponsCharge(ship.ID, name) : -1;
			var burning = !!scene.Weapons && scene.Weapons.Shots.some(function (shot) {
				return shot.Source === ship.ID && shot.Name === name;
			});
			var cooldown = scene.Weapons ? Math.max(0, until - scene.Weapons.Clock) : 0;

			return {Name: name, Charge: charge, Burning: burning, Ready: charge < 0 && !burning && cooldown <= 0, Cooldown: cooldown};
		}

		/* What a ship has of a weapon of a magazine: {Name, Left, Magazine, Reloading, Ready, Flying}. */
		function magazineOf (ship, name) {
			var type = typeOf(name);
			var key = ship.ID + ':' + name;
			var rounds = scene.Weapons ? scene.Weapons.Rounds[key] : null;

			return {Name: name, Left: Math.min(leftOf(ship, name), 1e9), Magazine: number(type.Magazine, 0), Reloading: !!(rounds && rounds.Reloading && rounds.Reloading > scene.Weapons.Clock), Ready: !scene.Weapons || (scene.Weapons.Ready[key] || 0) <= scene.Weapons.Clock, Flying: missiles().filter(function (shot) {
				return shot.Source === ship.ID && shot.Name === name;
			}).length};
		}

		engine.MissileShip = shipOf;

		engine.MissileDefence = function (ship, on) {
			if (!defenceOf(ship)) return false;

			if (on === true || on === false)
				state.Defence[ship.ID] = on;

			return !!defenceOf(ship).On;
		};

		/* The flares drawn: a hot point each, fading as it burns out (SceneWeapons draws them with its streaks). */
		engine.MissilesDraw = function (ribbon) {
			var unit = metre();

			state.Flares.forEach(function (flare) {
				var age = (state.Clock - flare.Born) / Math.max(0.1, flare.Seconds);
				var way = vectors.Normalize(vectors.Subtract(flare.Velocity, flare.Carried));
				var size = 2.5 * unit * (1 - age * 0.6);

				ribbon(vectors.Subtract(flare.At, vectors.Scale(way, size * 2)), vectors.Add(flare.At, vectors.Scale(way, size)), size, [6 * (1 - age), 3.2 * (1 - age), 1 * (1 - age)], 1, true);
			});
		};

		this.AddBehaviour({
			Step: function (elapsed) {
				state.Clock += elapsed;

				queueStep();

				flaresStep(elapsed);

				defenceStep(elapsed);

				locksStep(elapsed);

				/* What a missile gone left behind. */
				Object.keys(state.Flown).forEach(function (id) {
					var flying = scene.Weapons && scene.Weapons.Shots.some(function (shot) {
						return shot.ID === id;
					});
					if (!flying)
						delete state.Flown[id];
				});
			},

			/* M launches a salvo of the ship of the hero at what it locked, N releases its flares. */
			Key: function (event) {
				var ship;

				if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || ['KeyM', 'KeyN', 'KeyK', 'KeyU', 'KeyI', 'KeyO', 'KeyY'].indexOf(event.code) < 0 || !scene.Hero) return false;

				ship = heroShip();

				if (!ship)
					return false;

				if (event.code === 'KeyM' && ship.Values.Missiles) {
					launch(ship, {});

					return true;
				}

				if (event.code === 'KeyY' && ship.Values.Hunters) {
					launch(ship, {Kind: 'hunter'});

					return true;
				}

				if (event.code === 'KeyK' && ship.Values.Torpedoes) {
					launch(ship, {Kind: 'torpedo'});

					return true;
				}

				if (event.code === 'KeyO' && ship.Values.Railgun) {
					railgun(ship, '', {});

					return true;
				}

				if (event.code === 'KeyI' && ship.Values.Lance) {
					lance(ship, '');

					return true;
				}

				if (event.code === 'KeyU' && ship.Values.Driver) {
					drive(ship, '');

					return true;
				}

				if (event.code === 'KeyN' && ship.Values.Flares) {
					release(ship);

					return true;
				}

				return false;
			}
		});
	},

	/* A salvo of a ship at what it locked, or at options {Target, Targets, Count}: how many missiles go. */
	Launch: function (id, options) {
		var engine = this.Engine();
		var ship = engine && engine.MissileShip ? engine.MissileShip(id) : null;

		return ship ? engine.MissileLaunch(ship, options) : 0;
	},

	/* The mass driver of a ship (Values.Driver) at target (an ID; else its target, else what it locked), with the lead: true if it fired. */
	Driver: function (id, target) {
		var engine = this.Engine();
		var ship = engine && engine.MissileShip ? engine.MissileShip(id) : null;

		return ship ? engine.MissileDriver(ship, target || '') : false;
	},

	/* The lance of a ship (Values.Lance) at target (else its target, else what it locked): it charges, then burns on it; true if it began. */
	Lance: function (id, target) {
		var engine = this.Engine();
		var ship = engine && engine.MissileShip ? engine.MissileShip(id) : null;

		return ship ? engine.MissileLance(ship, target || '') : false;
	},

	/*
	 * The railgun faster than light of a ship or a platform (Values.Railgun) at target (else its target, else what it locked),
	 * options {Mode: predict or direct}: it charges, then a tunnel of warp takes its slug there; true if it began.
	 */
	Railgun: function (id, target, options) {
		var engine = this.Engine();
		var object = engine && engine.MissileShip ? engine.MissileShip(id) : null;

		return object ? engine.MissileRailgun(object, target || '', options) : false;
	},

	/* Flares out of a ship: how many. */
	Flares: function (id) {
		var engine = this.Engine();
		var ship = engine && engine.MissileShip ? engine.MissileShip(id) : null;

		return ship ? engine.MissileFlares(ship) : 0;
	},

	/* The point defence of a ship on (true) or off (false), or as it is: whether it is on. */
	Defence: function (id, on) {
		var engine = this.Engine();
		var ship = engine && engine.MissileShip ? engine.MissileShip(id) : null;

		return ship ? engine.MissileDefence(ship, on) : false;
	},

	/* The missiles at an object: [{ID, Source, Weapon, At, Distance, Seconds}], the soonest first. */
	Incoming: function (id) {
		var engine = this.Engine();
		var ship = engine && engine.MissileShip ? engine.MissileShip(id) : null;

		return ship ? engine.MissilesAt(ship.ID) : [];
	},

	/* What a ship has of missiles, flares and point defence (see the head); null for none. */
	ArmsOf: function (id) {
		var engine = this.Engine();
		var ship = engine && engine.MissileShip ? engine.MissileShip(id) : null;

		return ship && engine.ArmsOf ? engine.ArmsOf(ship) : null;
	}
});
