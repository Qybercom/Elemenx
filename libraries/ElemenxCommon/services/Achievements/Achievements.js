/*
 * Achievements: the achievements of an Application of any kind (a game, a course, a profile, a tour), as data: what they are,
 * how far each has come, which are unlocked. It shows nothing (AchievementQueue and AchievementHost of ElemenxUI show
 * them, AchievementList lists them) and keeps nothing: the Application stores Export() where it likes and gives it back to
 * Import(data). It runs in a page, a worker and Node.
 *
 * - Define(achievement or list): {ID, Title, Text, Icon, Image, Rarity (common, uncommon, rare, epic, legendary), Points,
 *   Group, Goal (how much unlocks it, 1), Hidden (not listed until it is unlocked), Secret (listed, its Title and Text
 *   kept back until it is unlocked)}. Again under its ID it is replaced, its state kept.
 * - Progress(id, amount) adds to how far it has come (1 by default), Set(id, value) sets it; at its Goal it unlocks.
 *   Unlock(id) unlocks it at once, Reset(id) (all without one) locks it again from nothing. Each returns its state.
 * - State(id): {ID, Value, Goal, Part (0 to 1), Unlocked, At (the time it was unlocked, milliseconds)}; null for an ID never
 *   defined. List({Group, Unlocked: true or false}): the definitions with their states, in the order they were defined, a
 *   Hidden one only once unlocked, a Secret one with its Title and Text empty (Secret: true) until then. Groups() its groups;
 *   Points() the points of what is unlocked; Count() {Unlocked, Total} (Hidden ones counted).
 * - On(event, callback) and Off(event, callback): progress ({ID, Value, Goal, Achievement}), unlock ({ID, Achievement,
 *   State}: the achievement and its state), reset ({ID}: empty, all of them), change ({ID}) after any of them.
 * - Export(): {Version, States: {id: {Value, At}}}; Import(data) takes such a record back (an unknown ID is kept for when
 *   it is defined) and tells change, no unlock.
 */
Elemenx.Service('Achievements', {
	$Meta: {
		Description: 'The achievements of an Application of any kind, as data: definitions, progress and unlocks, with events; stored by the Application (Export, Import).',
		Methods: ['Define(achievement)', 'Progress(id, amount)', 'Set(id, value)', 'Unlock(id)', 'Reset(id)', 'State(id)', 'List(filter)', 'Groups()', 'Points()', 'Count()', 'On(event, callback)', 'Off(event, callback)', 'Export()', 'Import(data)']
	},

	$OnCreate: function () {
		this.Defined = {};
		this.Order = [];
		this.States = {};
		this.Listeners = {progress: [], unlock: [], reset: [], change: []};
	},

	Define: function (given) {
		var self = this;

		(Array.isArray(given) ? given : [given]).forEach(function (one) {
			if (!one || !one.ID)
				throw new Error('Elemenx Achievements: an achievement needs its ID');

			if (!self.Defined[one.ID])
				self.Order.push(one.ID);

			self.Defined[one.ID] = {ID: String(one.ID), Title: one.Title || '', Text: one.Text || '', Icon: one.Icon || (one.Image ? '' : 'trophy'), Image: one.Image || '', Rarity: one.Rarity || 'common', Points: Number(one.Points) || 0, Group: one.Group || '', Goal: Number(one.Goal) > 0 ? Number(one.Goal) : 1, Hidden: one.Hidden === true, Secret: one.Secret === true};
			self.States[one.ID] = self.States[one.ID] || {Value: 0, At: 0};
		});

		this.Tell('change', {ID: Array.isArray(given) ? '' : given.ID});

		return this;
	},

	Progress: function (id, amount) {
		var state = this.States[id];

		return this.Set(id, (state ? state.Value : 0) + (amount === undefined ? 1 : Number(amount) || 0));
	},

	Set: function (id, value) {
		var achievement = this.Known(id);
		var state = this.States[id];
		var before = state.Value;

		if (state.At)
			return this.State(id);

		state.Value = Math.max(0, Math.min(achievement.Goal, Number(value) || 0));

		if (state.Value === before) return this.State(id);

		this.Tell('progress', {ID: id, Value: state.Value, Goal: achievement.Goal, Achievement: achievement});

		if (state.Value >= achievement.Goal) return this.Unlock(id);

		this.Tell('change', {ID: id});

		return this.State(id);
	},

	Unlock: function (id) {
		var achievement = this.Known(id);
		var state = this.States[id];
		if (state.At)
			return this.State(id);

		state.Value = achievement.Goal;
		state.At = Date.now();

		this.Tell('unlock', {ID: id, Achievement: achievement, State: this.State(id)});
		this.Tell('change', {ID: id});

		return this.State(id);
	},

	Reset: function (id) {
		var self = this;

		(id === undefined ? Object.keys(this.States) : [id]).forEach(function (one) {
			self.States[one] = {Value: 0, At: 0};
		});

		this.Tell('reset', {ID: id === undefined ? '' : id});
		this.Tell('change', {ID: id === undefined ? '' : id});

		return id === undefined ? null : this.State(id);
	},

	/* The achievement of an ID: an unknown one is an error of the Application. */
	Known: function (id) {
		var achievement = this.Defined[id];
		if (!achievement)
			throw new Error('Elemenx Achievements: no achievement ' + id);

		return achievement;
	},

	State: function (id) {
		var achievement = this.Defined[id];
		var state = this.States[id];

		if (!achievement) return null;

		return {ID: id, Value: state.Value, Goal: achievement.Goal, Part: Math.min(1, state.Value / achievement.Goal), Unlocked: !!state.At, At: state.At};
	},

	List: function (filter) {
		var self = this;
		var settings = filter || {};

		return this.Order.map(function (id) {
			var achievement = self.Defined[id];
			var state = self.State(id);
			var shown = Object.assign({}, achievement, {State: state});

			if (achievement.Secret && !state.Unlocked) {
				shown.Title = '';
				shown.Text = '';
			}

			return shown;
		}).filter(function (one) {
			if (one.Hidden && !one.State.Unlocked) return false;
			if (settings.Group !== undefined && settings.Group !== null && one.Group !== settings.Group) return false;

			return settings.Unlocked === undefined || settings.Unlocked === null || one.State.Unlocked === settings.Unlocked;
		});
	},

	Groups: function () {
		var self = this;
		var seen = [];

		this.Order.forEach(function (id) {
			var group = self.Defined[id].Group;
			if (group && seen.indexOf(group) === -1)
				seen.push(group);
		});

		return seen;
	},

	Points: function () {
		var self = this;

		return this.Order.reduce(function (sum, id) {
			return sum + (self.States[id].At ? self.Defined[id].Points : 0);
		}, 0);
	},

	Count: function () {
		var self = this;

		return {Unlocked: this.Order.filter(function (id) {
			return !!self.States[id].At;
		}).length, Total: this.Order.length};
	},

	On: function (event, callback) {
		if (!this.Listeners[event])
			throw new Error('Elemenx Achievements: no event ' + event);

		this.Listeners[event].push(callback);

		return callback;
	},

	Off: function (event, callback) {
		if (!this.Listeners[event]) return;

		this.Listeners[event] = this.Listeners[event].filter(function (one) {
			return one !== callback;
		});
	},

	Tell: function (event, data) {
		this.Listeners[event].slice().forEach(function (callback) {
			callback(data);
		});
	},

	Export: function () {
		var self = this;
		var states = {};

		Object.keys(this.States).forEach(function (id) {
			if (self.States[id].Value || self.States[id].At)
				states[id] = {Value: self.States[id].Value, At: self.States[id].At};
		});

		return {Version: 1, States: states};
	},

	Import: function (data) {
		var self = this;
		var states = data && data.States || {};

		Object.keys(states).forEach(function (id) {
			self.States[id] = {Value: Number(states[id].Value) || 0, At: Number(states[id].At) || 0};
		});

		this.Tell('change', {ID: ''});

		return this;
	}
});
