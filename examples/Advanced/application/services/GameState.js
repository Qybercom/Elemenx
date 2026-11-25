/*
 * GameState (Game): what the game keeps as its levels change, one for all of them, never made again with a scene: Get()
 * its state ({Character: the walker played, of DemoData.Characters; Ship: a file of data/vehicles/ships.json; Weapon: the
 * one in hand on the ground, of DemoData.Weapons; Car: the one put by the ship, of DemoData.Cars; Level: where the player
 * is, 'orbit', 'flight' (coming down or going up) or 'ground'}), Set(changes) changes some of it (all but the level kept
 * in the browser over a reload where it can), On(callback(state, changed)) hears each change, Off(callback).
 */
Elemenx.Service('GameState', {
	State: null,
	Heard: [],
	Kept: ['Character', 'Ship', 'Weapon', 'Car'],

	Get: function () {
		var saved = {};

		if (this.State)
			return this.State;

		try {
			saved = JSON.parse(window.localStorage.getItem('elemenx-game') || '{}') || {};
		}
		catch (failed) {
			saved = {};
		}

		this.State = {Character: saved.Character || 'chief', Ship: saved.Ship || 'space_ship (1).glb', Weapon: saved.Weapon || 'rifle', Car: saved.Car || 'mclaren', Level: 'orbit'};

		return this.State;
	},

	Set: function (changes) {
		var state = this.Get();
		var changed = {};
		var kept = {};

		Object.keys(changes || {}).forEach(function (key) {
			if (state[key] === changes[key]) return;

			state[key] = changed[key] = changes[key];
		});

		if (!Object.keys(changed).length) return state;

		this.Kept.forEach(function (key) {
			kept[key] = state[key];
		});

		try {
			window.localStorage.setItem('elemenx-game', JSON.stringify(kept));
		}
		catch (failed) {
			/* A browser that keeps nothing: the state lasts as long as the page. */
		}

		this.Heard.slice().forEach(function (callback) {
			callback(state, changed);
		});

		return state;
	},

	On: function (callback) {
		this.Heard.push(callback);
	},

	Off: function (callback) {
		this.Heard = this.Heard.filter(function (each) {
			return each !== callback;
		});
	}
});
