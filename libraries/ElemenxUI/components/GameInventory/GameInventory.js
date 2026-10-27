/*
 * An inventory: a grid of Slots cells (Items.length by default) in Columns columns. Items are by cell (null for an
 * empty cell): {ID, Name, Icon or Image, Count, Stack (the most a pile holds), Rarity (common, uncommon, rare, epic,
 * legendary: the frame of its cell), Color, Badge (a mark in a corner: '+5'), Class (more classes of its cell and its
 * card, for a look of their own), Active (an item in use, as one worn: the active look of the theme), Type,
 * Description, Stats: [{Label, Value}]}. The selected cell wears the mark of the theme around it. Name names the inventory in the places of a drag. The pointer or the focus on an item shows its card.
 * - Arrows move between the cells (a gamepad too); Enter or a double press uses an item (use); Space picks an item up
 *   and Space again puts it into the cell at the focus (Escape puts it back); Delete discards it (discard).
 * - The pointer drags an item (a *draggable of Type 'game-item' with Data {Item, From}; From is the place it comes from,
 *   {Kind: 'inventory', ID, Name, Index}). Onto a cell of the same inventory it moves there: piles of the same item
 *   join up to its Stack (the GameItems Service), other items swap. An item that comes from anywhere else (another
 *   inventory, a GameSlot, any *draggable of the game) emits receive ({Item, From, To, Current}: Current is what the
 *   cell holds), and the owner moves it: GameItems.Move(Item, Current) tells what the cell and the place it came from
 *   hold then. An item of this inventory dropped elsewhere also emits give ({Index, Item, From, Target}).
 * - move carries {From, To, Items}: Items is the list with the two cells swapped, for the owner to keep. select
 *   carries {Index, Item} as the focus moves. Label names the grid for screen readers. A cell with an item takes its
 *   Color (or the color of its Rarity) under the gloss of the theme.
 */
Elemenx.Component('GameInventory', {
	$TemplateURL: 'GameInventory.html',
	$StyleURL: 'GameInventory.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'An inventory: a grid of Slots cells (Items.length by default) in Columns columns.',
		Events: {
			select: 'Another cell was selected: {Index, Item}.',
			use: 'An item was used (Enter or a double press): {Index, Item}.',
			move: 'An item moved to another cell: {From, To, Items}, the cells after the move.',
			discard: 'An item was discarded (Delete): {Index, Item}.',
			receive: 'An item came from another inventory or slot: {Item, From, To, Current}.',
			give: 'An item was dropped on another place: {Index, Item, From, Target}.'
		},
		Methods: ['Move(from, to)'],
		Props: {
			Items: 'The items by cell (null for an empty one): {ID, Name, Icon or Image, Count, Stack, Rarity...}.',
			Slots: 'How many cells (the count of Items by default).',
			Columns: 'How many cells in a row.',
			Label: 'The name of the grid for screen readers.',
			Name: 'The name of the inventory in the places of a drag.'
		},
		Sample: {Slots: 12, Columns: 4, Label: 'Bag', Name: 'bag'}
	},
	Items: [],
	Slots: 0,
	Columns: 6,
	Label: '',
	Name: '',
	Selected: 0,
	Held: -1,
	Card: -1,
	CardStyle: '',

	$OnCreate: function () {
		var self = this;
		var memo = {Items: null, Slots: null, Cells: []};
		var own = {Scroll: null};

		/* The cells of the grid: [{Index, Item}], the same list for the same items. */
		this.Cells = function (items, slots) {
			var list = items || [];
			var count = Math.max(Number(slots) || 0, list.length);
			var i = 0;

			if (memo.Items === items && memo.Slots === slots) return memo.Cells;

			memo.Items = items;
			memo.Slots = slots;
			memo.Cells = [];

			while (i < count) {
				memo.Cells.push({Index: i, Item: list[i] || null});

				i++;
			}

			return memo.Cells;
		};

		this.ItemAt = function (index) {
			return (self.Items || [])[index] || null;
		};

		this.InventoryID = 'elemenx-inventory-' + Math.random().toString(36).slice(2, 10);

		/* The color of an item for its cell: its own Color, or the color of its rarity. */
		this.ItemColor = function (item) {
			var color = String(item && item.Color || '');

			return /^[#a-z0-9(),.%\s-]+$/i.test(color) ? color : 'var(--elemenx-game-' + (/^(common|uncommon|rare|epic|legendary)$/.test(item && item.Rarity) ? item.Rarity : 'common') + ')';
		};

		/* The classes an item asks for (its Class: a text of names or a list), for the themes and the page. */
		this.Classes = function (value) {
			var list = Array.isArray(value) ? value : String(value || '').split(/\s+/);

			return list.filter(function (name) {
				return /^[A-Za-z][\w-]*$/.test(name);
			});
		};

		/* The place of a cell, for the data and the events of a drag. */
		this.Place = function (index) {
			return {Kind: 'inventory', ID: self.InventoryID, Name: self.Name, Index: index};
		};

		this.Own = function () {
			return own;
		};
	},

	$OnDestroy: function () {
		this.HideCard();
	},

	Count: function () {
		return Math.max(Number(this.Slots) || 0, (this.Items || []).length);
	},

	Cell: function (index) {
		var root = this.$Element();

		return root ? root.querySelector('.elemenx-game-inventory-cell[data-index="' + index + '"]') : null;
	},

	Focus: function (index) {
		var cell;

		this.Selected = Math.max(0, Math.min(this.Count() - 1, index));

		cell = this.Cell(this.Selected);

		if (cell)
			cell.focus();

		this.$Emit('select', {Index: this.Selected, Item: this.ItemAt(this.Selected)});
	},

	/*
	 * Shows the card of the item of a cell next to it, on the side with room. The card is fixed to the viewport, so a
	 * window or a panel that scrolls its content does not cut it; it follows the cell when the page scrolls.
	 */
	ShowCard: function (index) {
		var self = this;
		var own = this.Own();
		var cell = this.Cell(index);

		if (!this.ItemAt(index) || !cell) {
			this.HideCard();

			return;
		}

		own.Cell = cell;

		if (!own.Scroll) {
			own.Scroll = function () {
				if (own.Cell && own.Cell.isConnected)
					self.CardStyle = self.$Service('GameItems').Place(own.Cell);
			};

			own.View = (this.$Element().ownerDocument || document).defaultView || window;

			own.View.addEventListener('scroll', own.Scroll, true);
		}

		this.CardStyle = this.$Service('GameItems').Place(cell);
		this.Card = index;
	},

	HideCard: function () {
		var own = this.Own();

		if (own.Scroll) {
			(own.View || window).removeEventListener('scroll', own.Scroll, true);

			own.Scroll = null;
		}

		own.Cell = null;
		this.Card = -1;
	},

	Index: function (node) {
		return Number(node.getAttribute('data-index'));
	},

	Clicked: function (event, node) {
		this.Focus(this.Index(node));
	},

	Used: function (event, node) {
		var index = this.Index(node);
		if (this.ItemAt(index))
			this.$Emit('use', {Index: index, Item: this.ItemAt(index)});
	},

	Focused: function (event, node) {
		this.Selected = this.Index(node);

		this.ShowCard(this.Selected);
	},

	Blurred: function () {
		var self = this;

		window.setTimeout(function () {
			var root = self.$Element();
			if (root && !root.contains(root.getRootNode().activeElement))
				self.HideCard();
		}, 0);
	},

	Hovered: function (event, node) {
		this.ShowCard(this.Index(node));
	},

	Left: function () {
		var root = this.$Element();

		if (root && root.contains(root.getRootNode().activeElement)) this.ShowCard(this.Selected);
		else this.HideCard();
	},

	/* The two cells swapped: the move event, with the new list for the owner. */
	/* An item of the grid onto another cell: piles of the same item join (GameItems), other items swap. */
	Move: function (from, to) {
		var items = (this.Items || []).slice();
		var result;

		if (from === to || from < 0 || to < 0) return;

		while (items.length < this.Count()) {
			items.push(null);
		}

		result = this.$Service('GameItems').Move(items[from], items[to]);

		items[to] = result.To || null;
		items[from] = result.From || null;

		this.$Emit('move', {From: from, To: to, Items: items});
	},


	Key: function (event) {
		var columns = Math.max(1, Number(this.Columns) || 1);
		var index = this.Selected;
		var count = this.Count();
		var next = -1;

		if (event.key === 'ArrowRight' && (index + 1) % columns !== 0 && index + 1 < count) next = index + 1;
		else if (event.key === 'ArrowLeft' && index % columns !== 0) next = index - 1;
		else if (event.key === 'ArrowDown' && index + columns < count) next = index + columns;
		else if (event.key === 'ArrowUp' && index - columns >= 0) next = index - columns;

		if (next !== -1) {
			event.preventDefault();

			this.Focus(next);

			return;
		}

		if (event.key === 'Enter') {
			event.preventDefault();

			if (this.ItemAt(index))
				this.$Emit('use', {Index: index, Item: this.ItemAt(index)});

			return;
		}

		if (event.key === ' ') {
			event.preventDefault();

			if (this.Held === -1) {
				if (this.ItemAt(index))
					this.Held = index;

				return;
			}

			this.Move(this.Held, index);

			this.Held = -1;

			return;
		}

		if (event.key === 'Escape' && this.Held !== -1) {
			event.preventDefault();

			this.Held = -1;

			return;
		}

		if (event.key === 'Delete' && this.ItemAt(index)) {
			event.preventDefault();

			this.$Emit('discard', {Index: index, Item: this.ItemAt(index)});
		}
	},

	DragBegan: function () {
		this.HideCard();
	},

	/* An item dropped on a cell: from this inventory it swaps the cells, from another one it is received. */
	Dropped: function (event, node) {
		var detail = event.detail || {};
		var data = detail.Data || {};
		var to = this.Index(node);

		var from = data.From || {};

		if (detail.Kind !== 'item' || detail.Type !== 'game-item' || !data.Item) return;

		if (from.Kind === 'inventory' && from.ID === this.InventoryID) {
			this.Move(from.Index, to);

			this.Focus(to);

			return;
		}

		this.$Emit('receive', {Item: data.Item, From: from, To: this.Place(to), Current: this.ItemAt(to)});
	},

	/* An item of this inventory dropped somewhere else: give tells the owner where. */
	DragFinished: function (event, node) {
		var detail = event.detail || {};
		var root = this.$Element();
		var index = this.Index(node);

		if (!detail.Dropped || !detail.Target || root && root.contains(detail.Target)) return;

		this.$Emit('give', {Index: index, Item: this.ItemAt(index), From: this.Place(index), Target: detail.Target});
	}
});
