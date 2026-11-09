/*
 * The rules of moving the items of a game: what lies where after an item is moved onto a place. An item is an object
 * with an ID and a Count; Stack is the most a pile of it holds (more than 1: it stacks).
 * - Stacks(a, b) tells whether b piles onto a: the same ID, a Stack over 1, and room left on a.
 * - Move(item, current) returns {To, From}: what the target place holds after item comes onto it (current is what it
 *   held), and what goes back to the place the item came from. Piles join (up to Stack, the rest stays where it came
 *   from); other items swap. To and From are new objects (or null): the old ones are not changed.
 * - Take(item, count) returns the item with count less (null when none is left), for an item that is used up.
 * - Tip(item) is what *tip takes to show the card of an item (GameItemCard) beside an element, under the pointer, the
 *   focus or a finger: *tip="ItemTip(item)", a method of the component returning this.$Service('GameItems').Tip(item);
 *   none for an item with nothing more than its name.
 *   Carded(item) tells whether an item has more to show than its name.
 */
Elemenx.Service('GameItems', {
	$Meta: {
		Description: 'The rules of moving the items of a game: what lies where after an item is moved onto a place.',
		Methods: ['Stacks(a, b)', 'Move(item, current)', 'Take(item, count)', 'Tip(item)', 'Carded(item)']
	},
	Count: function (item) {
		return item ? Math.max(1, Number(item.Count) || 1) : 0;
	},

	Copy: function (item, count) {
		var result = {};
		var key;

		for (key in item) {
			if (Object.prototype.hasOwnProperty.call(item, key))
				result[key] = item[key];
		}

		result.Count = count;

		return result;
	},

	Stacks: function (a, b) {
		var limit = Number(a && a.Stack) || 1;

		return !!a && !!b && a !== b && a.ID != null && a.ID === b.ID && limit > 1 && this.Count(a) < limit;
	},

	Move: function (item, current) {
		var limit;
		var total;
		var placed;

		if (!item)
			return {To: current || null, From: null};

		if (this.Stacks(current, item)) {
			limit = Number(current.Stack);
			total = this.Count(current) + this.Count(item);
			placed = Math.min(limit, total);

			return {To: this.Copy(current, placed), From: total > placed ? this.Copy(item, total - placed) : null};
		}

		return {To: item, From: current || null};
	},

	Take: function (item, count) {
		var left = this.Count(item) - (count == null ? 1 : Number(count) || 0);

		return item && left > 0 ? this.Copy(item, left) : null;
	},

	Tip: function (item) {
		return {Component: 'GameItemCard', Props: {Item: item || null}, Placement: 'right', Delay: 0, Touch: true, Stay: true, Disabled: !this.Carded(item)};
	},

	Carded: function (item) {
		return !!item && !!(item.Description || item.Type || item.Rarity || item.Stats && item.Stats.length);
	}
});
