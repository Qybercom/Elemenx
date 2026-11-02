/*
 * Physics: how things move, apart from what shows them. Nothing here knows a scene: a state goes in, with what is asked of it and
 * how long a step is, and comes out moved. Steps are short and of one length, so a slow machine moves a thing as a fast one does.
 *
 * - Steps(clock, elapsed, length, each): runs each(length) as many times as the time asks, keeping the rest in clock {Left}; returns
 *   how far into the next step the time has come, for Blend.
 * - Blend(from, to, part): a place between two, a number or a list.
 * - Spring(value, speed, target, stiffness, damping, elapsed): [value, speed] of a thing pulled to a target.
 * - Car(state, input, surface, settings, elapsed): input {Gas, Brake (and then back), Stop (all wheels, and it stays), Steer (-1 to 1, left
 *   over 0), Hand, Drift (the rear lets go while it is held)}; docs/VEHICLES.md says how all of it hangs together; surface(x, z) is {Height, Grip, Drag}. Settings: Mass, Power, Top, Brake, Base (from axle to axle), Width (between the
 *   wheels), Lock (the most the wheels turn, radians), Answer (how fast they turn, and the car after them), Keep (at what speed they have
 *   half their lock left), Turn (a table of how fast it turns at full steering: [[speed m/s, degrees a second], ...], instead of what Lock and Keep
 *   give; the ground still limits it, it needs Assist, and a drift goes by the tyres), Build ([at a standstill, at Top]: seconds the steering takes to reach full, so that a touch is a little
 *   turn; it comes back twice as fast), Bite (how far brakes go past the grip), Coast (what slows it off the gas, m/s²), Agility (how much harder than its grip alone it turns: above 1 a game has it sharper than a real car), Assist
 *   (0 a simulator: only the tyres turn it; 1 an arcade: it goes where the wheels point), Rear (the grip behind against the front), Slide
 *   (the grip behind that is left when it drifts), Angle (how far a drift may open, radians), Peak (the slip, radians, at which a tyre gives most), Grip, Downforce (how much grip the air adds at top speed, as a part of it), Ride (how soft the springs are),
 *   Travel (how far a wheel goes up or down), Balance (how high its weight lies), AntiRoll (the bars that hold it level in a turn, N m a
 *   radian). State: {X, Z, Heading, Forward, Aside, Rate, Steer, Y, Rise, Pitch, PitchSpeed, Roll, RollSpeed,
 *   Spin, Wheels, Strokes, Touching}. Force is what the engine gives at a speed, as far as the tyres that touch hold; air and the ground
 *   take it back. Each of the four wheels [front left, front right, rear left, rear right] is a weight of its own on a spring and a
 *   damper under the body, so it follows the road and the body rides over it, leaning as it speeds up, brakes and turns. Strokes is how
 *   far each spring has gone from rest, above 0 when the wheel hangs lower than it did.
 * - Hit(state, normal, depth, at, settings): a car at a wall: normal [x, z] looks out of the wall, depth is how far in it went, at [x, z] is
 *   the corner that met it, from its middle. It comes out, gives up its speed into the wall but for a bounce (Bounce, default 0.25),
 *   scrapes (Scrape, default 0.12), and turns round what it hit.
 * - Bounce(way, normal, depth, bounce): the same for a list [x, y, z]: returns the way after it.
 * - Ship(state, input, settings, elapsed): input {Yaw, Pitch, Roll, Throttle, Lift, Boost, Stop (all of it comes to rest)}. Settings: Top,
 *   Boost, Turn, Roll, Assist (how soon it gives up a way it no longer points). State: {At, Right, Up, Ahead, Way, Spin: [pitch, yaw, roll], Throttle}.
 */
Elemenx.Service('Physics', {
	$Meta: {
		Description: 'How things move, apart from what shows them: steps of one length, springs, a car on its tyres and springs, a ship in space.',
		Methods: ['Steps(clock, elapsed, length, each)', 'Blend(from, to, part)', 'Spring(value, speed, target, stiffness, damping, elapsed)', 'Car(state, input, surface, settings, elapsed)', 'Hit(state, normal, depth, at, settings)', 'Bounce(way, normal, depth, bounce)', 'Ship(state, input, settings, elapsed)']
	},

	Gravity: 9.81,

	Steps: function (clock, elapsed, length, each) {
		var count = 0;

		clock.Left = (clock.Left || 0) + elapsed;

		while (clock.Left >= length && count < 40) {
			each(length);

			clock.Left -= length;

			count++;
		}

		if (count === 40)
			clock.Left = 0;

		return clock.Left / length;
	},

	Blend: function (from, to, part) {
		if (!Array.isArray(to))
			return from + (to - from) * part;

		return to.map(function (value, index) {
			return from[index] + (value - from[index]) * part;
		});
	},

	Spring: function (value, speed, target, stiffness, damping, elapsed) {
		var moved = speed + ((target - value) * stiffness - speed * damping) * elapsed;

		return [value + moved * elapsed, moved];
	},

	Number: function (value, fallback) {
		return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
	},

	/*
	 * The body on its four springs, the wheels under it. What presses on a body is the weight it rests on each wheel, what its spring
	 * has gone from rest and how fast; a wheel has its own weight, is pushed down by the same force and is stopped by the road.
	 */
	Ride: function (state, surface, settings, ahead, pressed, sideways, elapsed) {
		var number = this.Number;
		var gravity = this.Gravity;
		var mass = number(settings.Mass, 1500);
		var base = number(settings.Base, 2.7) / 2;
		var wide = number(settings.Width, 1.6) / 2;
		var ride = number(settings.Ride, 1);
		var travel = number(settings.Travel, 0.1);
		var high = number(settings.Balance, 0.42);
		var stiff = 36000 / ride;
		var damp = 2 * 0.42 * Math.sqrt(stiff * mass / 4);
		var carried = mass * gravity / 4;
		var unsprung = 42;
		var corners = [[base, wide], [base, -wide], [-base, wide], [-base, -wide]];
		var inertia = {Pitch: mass * base * base * 1.05, Roll: mass * wide * wide * 1.15};
		var push = {Y: 0, Pitch: mass * pressed * high, Roll: mass * sideways * high};
		var touching = 0;
		var bars = number(settings.AntiRoll, 150000);

		function under (forward, aside) {
			return surface(state.X + ahead[0] * forward + ahead[1] * aside, state.Z + ahead[1] * forward - ahead[0] * aside).Height;
		}

		if (!state.Wheels) {
			state.Wheels = corners.map(function (corner) {
				var height = under(corner[0], corner[1]);

				return {Y: height, Speed: 0, Ground: height};
			});

			state.Strokes = [0, 0, 0, 0];
		}

		corners.forEach(function (corner, index) {
			var wheel = state.Wheels[index];
			var at = state.Y + corner[0] * state.Pitch + corner[1] * state.Roll;
			var speed = state.Rise + corner[0] * state.PitchSpeed + corner[1] * state.RollSpeed;
			var stroke = at - wheel.Y;
			var force = carried - stiff * stroke - damp * (speed - wheel.Speed);
			var ground = under(corner[0], corner[1]);

			/* At the end of its way a spring meets rubber. */
			if (stroke < -travel)
				force += stiff * 7 * (-travel - stroke);

			force = Math.max(0, force);

			push.Y += force;
			push.Pitch += force * corner[0];
			push.Roll += force * corner[1];

			wheel.Speed -= (force / unsprung + gravity) * elapsed;
			wheel.Y += wheel.Speed * elapsed;

			/* It hangs from the body no lower than its way lets it. */
			if (wheel.Y < at - travel) {
				wheel.Speed = Math.max(wheel.Speed, speed);
				wheel.Y = at - travel;
			}

			/* A wheel does not go into the road: it rises as the road does. */
			if (wheel.Y <= ground) {
				wheel.Speed = Math.min(1.2, Math.max(0, ground - wheel.Ground) / elapsed);
				wheel.Y = ground;

				touching++;
			}

			wheel.Ground = ground;
			state.Strokes[index] = at - wheel.Y;
		});

		state.Rise += (push.Y / mass - gravity) * elapsed;
		state.PitchSpeed += push.Pitch / inertia.Pitch * elapsed;
		state.RollSpeed += (push.Roll - bars * state.Roll - 1.4 * Math.sqrt(bars * inertia.Roll) * state.RollSpeed) / inertia.Roll * elapsed;
		state.Y += state.Rise * elapsed;
		state.Pitch += state.PitchSpeed * elapsed;
		state.Roll += state.RollSpeed * elapsed;
		state.Touching = touching;

		/* Nothing goes as far as to put the body through the wheels. */
		var lowest = (state.Wheels[0].Y + state.Wheels[1].Y + state.Wheels[2].Y + state.Wheels[3].Y) / 4 - travel * 1.5;

		if (state.Y < lowest) {
			state.Y = lowest;
			state.Rise = Math.max(0, state.Rise);
		}
	},

	Car: function (state, input, surface, settings, elapsed) {
		var number = this.Number;
		var mass = number(settings.Mass, 1500);
		var power = number(settings.Power, 520000);
		var top = number(settings.Top, 92);
		var brake = number(settings.Brake, 11);
		var base = number(settings.Base, 2.7);
		var lock = number(settings.Lock, 0.55);
		var answer = number(settings.Answer, 9);
		var keep = number(settings.Keep, 51);
		var ground = surface(state.X, state.Z);
		var touching = state.Touching === undefined ? 4 : state.Touching;
		var speed = state.Forward;
		var size = Math.abs(speed);
		var pressedDown = 1 + number(settings.Downforce, 0) * Math.pow(size / top, 2);
		var grip = number(settings.Grip, 1.15) * pressedDown * ground.Grip * this.Gravity * (touching / 4);
		var pull = 0;
		var bite = number(settings.Bite, 1);
		var ahead;

		var asked = input.Steer || 0;
		var build = settings.Build;

		/* The wheels come round slowly, and turn less the faster it goes. */
		if (build) {
			var move = elapsed / Math.max(0.01, build[0] + (build[1] - build[0]) * Math.min(1, size / top)) * (asked * state.Steer > 0 ? 1 : 2);

			state.Steer += Math.max(-move, Math.min(move, asked - state.Steer));
		}
		else {
			state.Steer += (asked - state.Steer) * Math.min(1, elapsed * answer * 0.8);
		}

		if (input.Gas)
			pull = Math.min(power / Math.max(size, 6) / mass, grip);

		if (input.Brake) {
			if (speed > 0.5) pull = -Math.min(brake, grip * bite);
			else pull = -Math.min(power * 0.3 / Math.max(size, 6) / mass, grip) * (speed < -14 ? 0 : 1);
		}

		if (input.Hand)
			pull = -Math.sign(speed) * Math.min(brake * 0.6, grip * 0.6, size / elapsed);

		if (input.Stop)
			pull = -Math.sign(speed) * Math.min(brake, grip * bite, size / elapsed);

		var air = power / mass / (top * top * top) * speed * size;
		var resist = (0.012 * this.Gravity + (input.Gas ? 0 : number(settings.Coast, 1.5)) + ground.Drag * size * 0.5) * Math.sign(speed);
		var slowed = (air + resist) * elapsed;

		speed += pull * elapsed;
		speed = Math.abs(slowed) > Math.abs(speed) ? 0 : speed - slowed;

		var angle = state.Steer * lock / (1 + size * size / (keep * keep));
		var agility = number(settings.Agility, 1);
		var assist = Math.max(0, Math.min(1, number(settings.Assist, 0.6)));
		var drifting = !!(input.Drift || input.Hand);
		var most = grip * agility / Math.max(size, 2);
		var wanted = Math.max(-most, Math.min(most, speed * Math.tan(angle) / base));

		/* A table says how fast it turns outright, on what grip the ground has; a car at a walk still turns no tighter than its wheels. */
		if (settings.Turn)
			wanted = Math.sign(speed) * state.Steer * Math.min(this.Table(settings.Turn, size) * Math.PI / 180 * ground.Grip * touching / 4, size * Math.tan(lock) / base);

		var half = base / 2;
		var peak = number(settings.Peak, 0.14);
		var rear = grip * number(settings.Rear, 1.1) * (drifting ? number(settings.Slide, 0.45) : 1);
		var along = Math.max(size, 1);

		/* Below a walk nothing slips: the car goes where its wheels point. Above it the tyres take over. */
		var rolling = Math.max(0, Math.min(1, (speed - 4) / 6));
		var held = Math.min(0.95, Math.abs(pull) / Math.max(rear, 0.1));
		var front = this.Tyre((angle - Math.atan2(state.Aside + half * state.Rate, along)) / peak) * grip / 2 * Math.cos(angle);
		var back = this.Tyre(-Math.atan2(state.Aside - half * state.Rate, along) / peak) * rear / 2 * Math.sqrt(1 - held * held);

		state.Aside += (front + back - speed * state.Rate) * elapsed * rolling;
		state.Rate += (front - back) * half / (half * half * 0.85 / agility) * elapsed * rolling * (settings.Turn && !drifting ? 1 - assist : 1);

		/* What is asked of the driver is taken off by as much as Assist says; a drift is left to the hands. */
		var helped = (1 - rolling) + rolling * assist * (drifting ? 0.12 : 1);

		state.Rate += (wanted - state.Rate) * Math.min(1, elapsed * answer * helped);
		state.Aside -= state.Aside * Math.min(1, elapsed * 10 * helped);

		/* However it goes, a car does not spin faster than its tyres could throw it round, and a drift comes back from its widest. */
		var spin = most * 1.6 + 0.4;
		var past = Math.max(0, Math.abs(Math.atan2(state.Aside, along)) - number(settings.Angle, 0.7));

		state.Rate = Math.max(-spin, Math.min(spin, state.Rate));

		if (past > 0) {
			state.Rate *= 1 - Math.min(1, elapsed * past * 14);
			state.Aside *= 1 - Math.min(1, elapsed * past * 10);
		}

		state.Heading += state.Rate * elapsed;
		state.Slip = Math.atan2(state.Aside, along);

		/* Sideways the tyres scrub it down. */
		speed *= 1 - Math.min(0.5, Math.abs(state.Aside) / along) * elapsed;

		ahead = [Math.sin(state.Heading), Math.cos(state.Heading)];

		state.X += (ahead[0] * speed + ahead[1] * state.Aside) * elapsed;
		state.Z += (ahead[1] * speed - ahead[0] * state.Aside) * elapsed;
		state.Forward = speed;
		state.Spin = (state.Spin + speed * elapsed / 0.34) % (Math.PI * 2);

		/* What leans it is what the tyres can give, however sharply it turns. */
		this.Ride(state, surface, settings, ahead, pull, Math.max(-grip, Math.min(grip, speed * state.Rate)), elapsed);

		return state;
	},

	/* What a table of [at, value] gives between its rows, and its ends beyond them. */
	Table: function (rows, at) {
		var i = 1;

		while (i < rows.length - 1 && rows[i][0] < at)
			i++;

		var from = rows[i - 1];
		var to = rows[i];

		return from[1] + (to[1] - from[1]) * Math.max(0, Math.min(1, (at - from[0]) / (to[0] - from[0])));
	},

	/* What a tyre gives at a slip, Peak being 1: it grows, tops about there, and falls a little past it. */
	Tyre: function (slip) {
		return Math.sin(1.6 * Math.atan(1.4 * slip));
	},

	Hit: function (state, normal, depth, at, settings) {
		var bounce = this.Number(settings.Bounce, 0.25);
		var scrape = this.Number(settings.Scrape, 0.12);
		var ahead = [Math.sin(state.Heading), Math.cos(state.Heading)];
		var side = [ahead[1], -ahead[0]];
		var x = ahead[0] * state.Forward + side[0] * state.Aside;
		var z = ahead[1] * state.Forward + side[1] * state.Aside;
		var into = x * normal[0] + z * normal[1];

		state.X += normal[0] * depth;
		state.Z += normal[1] * depth;

		if (into >= 0) return state;

		var along = [x - normal[0] * into, z - normal[1] * into];
		var left = Math.max(0, 1 + scrape * into / Math.max(Math.hypot(along[0], along[1]), 1));
		var push = -(1 + bounce) * into;

		x = along[0] * left - normal[0] * into * bounce;
		z = along[1] * left - normal[1] * into * bounce;

		state.Forward = x * ahead[0] + z * ahead[1];
		state.Aside = x * side[0] + z * side[1];

		/* Struck at a corner it turns: as far as the blow does not go through its middle. */
		state.Rate += push * (at[1] * normal[0] - at[0] * normal[1]) / (at[0] * at[0] + at[1] * at[1] + 1.5);

		return state;
	},

	Bounce: function (way, normal, depth, bounce) {
		var vectors = this.$Service('Graphics3D').Vectors;
		var into = vectors.Dot(way, normal);

		return into >= 0 ? way : vectors.Subtract(way, vectors.Scale(normal, into * (1 + this.Number(bounce, 0.3))));
	},

	Ship: function (state, input, settings, elapsed) {
		var vectors = this.$Service('Graphics3D').Vectors;
		var graphics = this.$Service('Graphics3D');
		var number = this.Number;
		var top = number(settings.Top, 1);
		var turn = number(settings.Turn, 1.1);
		var roll = number(settings.Roll, 1.7);
		var assist = number(settings.Assist, 1.6);
		var boost = input.Boost ? number(settings.Boost, 2.4) : 1;
		var answer = Math.min(1, elapsed * 3.5);
		var rest = Math.min(1, elapsed * 3);

		state.Spin = [state.Spin[0] + ((input.Pitch || 0) * turn - state.Spin[0]) * answer, state.Spin[1] + ((input.Yaw || 0) * turn - state.Spin[1]) * answer, state.Spin[2] + ((input.Roll || 0) * roll - state.Spin[2]) * answer];

		var moved = graphics.Multiply(graphics.Rotation(state.Up, state.Spin[1] * elapsed), graphics.Multiply(graphics.Rotation(state.Right, -state.Spin[0] * elapsed), graphics.Rotation(state.Ahead, state.Spin[2] * elapsed)));

		state.Ahead = vectors.Normalize(graphics.Apply(moved, state.Ahead));
		state.Up = vectors.Normalize(graphics.Apply(moved, state.Up));
		state.Right = vectors.Normalize(vectors.Cross(state.Up, state.Ahead));
		state.Up = vectors.Cross(state.Ahead, state.Right);
		state.Throttle = Math.max(-0.25, Math.min(1, state.Throttle + (input.Throttle || 0) * elapsed * 0.7));

		if (input.Stop)
			state.Throttle = Math.abs(state.Throttle) < 0.01 ? 0 : state.Throttle * (1 - rest);

		var wanted = input.Stop ? [0, 0, 0] : vectors.Add(vectors.Scale(state.Ahead, state.Throttle * top * boost), vectors.Scale(state.Up, (input.Lift || 0) * top * 0.3));

		state.Way = vectors.Lerp(state.Way, wanted, input.Stop ? rest : Math.min(1, elapsed * assist));

		/* Asked for nothing, it comes to rest and not only near it. */
		if (vectors.Length(wanted) === 0 && vectors.Length(state.Way) < top * 0.002)
			state.Way = [0, 0, 0];

		state.At = vectors.Add(state.At, vectors.Scale(state.Way, elapsed));

		return state;
	}
});
