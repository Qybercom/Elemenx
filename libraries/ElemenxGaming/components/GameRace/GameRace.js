/*
 * A race on a road of a Scene, declared inside it: <Scene> ... <GameRace Road="track" Laps="3" /> </Scene> (the trait
 * SceneBehaviour). The racers (Racers: the IDs of the vehicles, a list or text with commas; empty: the one under the keys)
 * go round a closed road (Road: its ID; empty: the first closed one), a lap counted as a racer crosses its start line (the
 * mark start of the road, else its first point) having passed its checkpoints (Checkpoints: how many, evenly round it, 3),
 * so a short way back over the line counts nothing. Countdown (seconds, 3) counts down before it starts; Start() starts it
 * again from the countdown, Stop() ends it.
 *
 * Events: countdown ({Seconds}), start, checkpoint ({ID, Lap, Index}), lap ({ID, Lap, Time, Best}: the lap done and its
 * seconds), position ({ID, Position}: a racer passed another), wrong ({ID, Wrong}: it goes the wrong way, or again the right
 * way), finish ({ID, Position, Time, Best}), end (all of them finished). Standings() gives the racers in their order:
 * [{ID, Position, Lap, Progress (metres from the start of the race), Time, LapTime (the seconds of the lap under way, 0 when
 * finished), Last, Best, Finished, Wrong}].
 */
Elemenx.Component('GameRace', {
	$Template: '<span class="elemenx-game-race" hidden></span>',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'flag',
		Description: 'A race on a closed road of a Scene, declared inside it: laps, checkpoints, times, positions, the wrong way.',
		Events: {
			countdown: 'A second of the countdown before the start: {Seconds}.',
			start: 'The race started.',
			checkpoint: 'A racer passed a checkpoint: {ID, Lap, Index}.',
			lap: 'A racer finished a lap: {ID, Lap, Time, Best}.',
			position: 'A racer came to another position: {ID, Position}.',
			wrong: 'A racer goes the wrong way, or the right way again: {ID, Wrong}.',
			finish: 'A racer finished: {ID, Position, Time, Best}.',
			end: 'All the racers finished.'
		},
		Props: {
			Road: 'The ID of the road of the race; empty: the first closed road of the scene.',
			Laps: 'How many laps.',
			Racers: 'The IDs of the vehicles that race (a list, or text with commas); empty: the one under the keys.',
			Checkpoints: 'How many checkpoints a lap has, evenly round the road.',
			Countdown: 'Seconds of the countdown before the start.',
			Auto: 'Starts as the scene starts.'
		}
	},
	Road: '',
	Laps: 3,
	Racers: '',
	Checkpoints: 3,
	Countdown: 3,
	Auto: true,

	SceneStart: function () {
		if (this.Auto === true || this.Auto === 'true')
			this.Start();
	},

	SceneStop: function () {
		this.RaceState = null;
	},

	/* The race again, from its countdown. */
	Start: function () {
		this.RaceState = {Phase: 'countdown', Clock: 0, Left: Math.max(0, Number(this.Countdown) || 0), Told: -1, Racers: {}, Order: [], Done: 0};

		return this;
	},

	Stop: function () {
		if (this.RaceState)
			this.RaceState.Phase = 'over';

		return this;
	},

	/* The road of the race: the one named, else the first closed one. */
	RaceRoad: function () {
		var scene = this.ParentScene();
		var name = this.Road;
		var roads = scene && scene.Roads ? scene.Roads() : [];

		return roads.filter(function (road) {
			return name ? road.ID === name : road.Closed;
		})[0] || null;
	},

	RaceIDs: function () {
		var scene = this.ParentScene();
		var given = this.Racers;
		var list = Array.isArray(given) ? given : String(given || '').split(',');

		list = list.map(function (one) {
			return String(one).trim();
		}).filter(Boolean);

		return list.length ? list : scene && scene.Scene().Hero ? [scene.Scene().Hero] : [];
	},

	/* Where a racer stands: its car, or the object itself. */
	RacePlace: function (id) {
		var object = this.ParentScene().Scene().Objects[id];
		if (!object)
			return null;

		if (object.Car)
			return [object.Car.X, object.Car.Z];

		if (object.World)
			return [object.World[0], object.World[2]];

		/* Made again this frame, not yet stood: where its values put it. */
		return object.Values.X !== undefined && object.Values.Y !== undefined ? [Number(object.Values.X) || 0, Number(object.Values.Y) || 0] : null;
	},

	SceneStep: function (elapsed) {
		var self = this;
		var state = this.RaceState;
		var road;
		var roads;
		var length;
		var origin;
		var checks;

		if (!state || state.Phase === 'over') return;

		road = this.RaceRoad();

		if (!road) return;

		state.Clock += elapsed;

		if (state.Phase === 'countdown') {
			state.Left -= elapsed;

			if (Math.ceil(state.Left) !== state.Told && state.Left > 0) {
				state.Told = Math.ceil(state.Left);

				this.$Emit('countdown', {Seconds: state.Told});
			}

			if (state.Left > 0) return;

			state.Phase = 'racing';
			state.Clock = 0;

			this.$Emit('start');
		}

		roads = this.$Service('SceneRoads');
		length = road.Points[road.Points.length - 1].Along + Math.hypot(road.Points[0].X - road.Points[road.Points.length - 1].X, road.Points[0].Z - road.Points[road.Points.length - 1].Z);
		origin = (road.Marks || []).filter(function (mark) {
			return mark.Kind === 'start';
		}).map(function (mark) {
			return Number(mark.At) || 0;
		})[0] || 0;
		checks = Math.max(0, Math.round(Number(this.Checkpoints) || 0));

		this.RaceIDs().forEach(function (id) {
			var place = self.RacePlace(id);
			var racer = state.Racers[id];
			var near;
			var at;
			var moved;

			if (!place) return;

			near = roads.Near(road, place[0], place[1], racer ? racer.Hint : undefined);
			/* Metres past the start line, 0 to the length of a lap. */
			at = ((near.At - origin) % length + length) % length;

			if (!racer) {
				racer = state.Racers[id] = {ID: id, Lap: 0, At: at, Progress: 0, Passed: 0, LapStart: 0, Last: 0, Best: 0, Finished: false, Time: 0, Wrong: false, Back: 0, Hint: near.Along};

				state.Order.push(id);

				return;
			}

			racer.Hint = near.Along;

			if (racer.Finished) return;

			moved = at - racer.At;

			/* Over the start line, either way: a step of nearly a whole lap. */
			if (moved < -length / 2)
				moved += length;

			if (moved > length / 2)
				moved -= length;

			racer.Progress += moved;

			/* Going back for a while is the wrong way; going on again puts it right. */
			racer.Back = moved < 0 ? racer.Back - moved : Math.max(0, racer.Back - moved * 2);

			if (!racer.Wrong && racer.Back > 25) {
				racer.Wrong = true;

				self.$Emit('wrong', {ID: id, Wrong: true});
			}
			else if (racer.Wrong && racer.Back === 0) {
				racer.Wrong = false;

				self.$Emit('wrong', {ID: id, Wrong: false});
			}

			/* The checkpoints of this lap, in their order; the line counts once they are all passed. */
			while (racer.Passed < checks && racer.Progress - racer.Lap * length >= length * (racer.Passed + 1) / (checks + 1)) {
				racer.Passed++;

				self.$Emit('checkpoint', {ID: id, Lap: racer.Lap + 1, Index: racer.Passed});
			}

			if (racer.Passed >= checks && racer.Progress - racer.Lap * length >= length) {
				var time = state.Clock - racer.LapStart;

				racer.Lap++;
				racer.Passed = 0;
				racer.Last = time;
				racer.Best = racer.Best ? Math.min(racer.Best, time) : time;
				racer.LapStart = state.Clock;

				self.$Emit('lap', {ID: id, Lap: racer.Lap, Time: time, Best: racer.Best});

				if (racer.Lap >= Math.max(1, Number(self.Laps) || 1)) {
					racer.Finished = true;
					racer.Time = state.Clock;
					state.Done++;
					racer.Position = state.Done;

					self.$Emit('finish', {ID: id, Position: racer.Position, Time: racer.Time, Best: racer.Best});
				}
			}

			racer.At = at;
		});

		this.RaceRank();

		if (state.Order.length && state.Done === state.Order.length) {
			state.Phase = 'over';

			this.$Emit('end');
		}
	},

	/* The order of the racers: the finished ones as they finished, the others by how far they went. */
	RaceRank: function () {
		var self = this;
		var state = this.RaceState;
		var order = state.Order.slice().sort(function (a, b) {
			var one = state.Racers[a];
			var two = state.Racers[b];
			if (one.Finished && two.Finished)
				return one.Position - two.Position;

			if (one.Finished !== two.Finished) return one.Finished ? -1 : 1;

			return two.Progress - one.Progress;
		});

		order.forEach(function (id, index) {
			var racer = state.Racers[id];
			var was = racer.Rank;

			racer.Rank = index + 1;

			if (was && was !== racer.Rank)
				self.$Emit('position', {ID: id, Position: racer.Rank});
		});
	},

	Standings: function () {
		var state = this.RaceState;
		if (!state) return [];

		return state.Order.map(function (id) {
			var racer = state.Racers[id];

			return {ID: id, Position: racer.Rank || 0, Lap: racer.Lap, Progress: racer.Progress, Time: racer.Finished ? racer.Time : state.Clock, LapTime: racer.Finished ? 0 : Math.max(0, state.Clock - racer.LapStart), Last: racer.Last, Best: racer.Best, Finished: racer.Finished, Wrong: racer.Wrong};
		}).sort(function (a, b) {
			return a.Position - b.Position;
		});
	}
});
