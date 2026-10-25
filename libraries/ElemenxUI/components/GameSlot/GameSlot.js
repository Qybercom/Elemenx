/*
 * A slot of an action bar (hotbar): a button with an Icon or an Image, a Label for the hint and screen readers, Count
 * and Rarity (common, uncommon, rare, epic, legendary). Key binds a shortcut through the Hotkeys Service ('1', 'Q')
 * and shows it (a control of the game, not a command: the lists of shortcuts leave it out). Pressing it (or its key)
 * emits use while it is ready; with Cooldown (milliseconds) it then cools down: a sweep runs over it with the seconds
 * left, and ready is emitted at the end. Cool(milliseconds) starts a cooldown from the code (a shared cooldown, for
 * example); Active marks a toggled action; Disabled, Size (small, medium, large).
 * Several slots in a row: <div class="elemenx-game-hotbar">.
 * Color tints the glass under its icon (by default the color of its Rarity; Rarity frames it too); Badge is a mark in a
 * corner ('+5'), Classes more classes for a look of their own. Data is what the slot holds (an item of
 * the game: {ID, Name, Icon, Count, Stack...}, or a skill). The slot is a place of the drags of the game: it is dragged
 * (Draggable, true by default; a *draggable of Type 'game-item' with Data {Item, From}, From {Kind: 'slot', Key, Name:
 * Group}) and takes what is dropped on it (Accept: the Types it takes, ['game-item'] by default; [] takes nothing):
 * drop carries {Item, From, To, Current} (Current is Data) and the owner moves the item, with GameItems.Move.
 * The pointer or the focus on a slot whose Data has more than a name (Description, Type, Rarity, Stats) shows its card
 * (GameItemCard), as in an inventory; it follows the slot when the page scrolls.
 */
Elemenx.Component('GameSlot', {
	$TemplateURL: 'GameSlot.html',
	$StyleURL: 'GameSlot.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'A slot of an action bar (hotbar): a button with an Icon or an Image, a Label for the hint and screen readers, Count and Rarity (common, uncommon, rare, epic, legendary).',
		Events: ['use', 'ready', 'drop'],
		Methods: ['Cool(milliseconds)'],
		Props: {
			Icon: 'The icon of the action.',
			Image: 'A picture in place of the icon.',
			Label: 'The hint, and the name for screen readers.',
			Key: 'The shortcut that presses it (1, Q).',
			Count: 'A count in the corner (0 hides it).',
			Rarity: 'common, uncommon, rare, epic or legendary: its frame and its tint.',
			Cooldown: 'The time it cools down after use, in milliseconds.',
			Active: 'Marks a toggled action.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'},
			Color: 'The tint of the glass under its icon.',
			Accept: 'The types of drags it takes ([\'game-item\']; [] takes nothing).',
			Draggable: 'Lets its content be dragged.',
			Data: 'What the slot holds: an item or a skill.',
			Group: 'The name of the bar in the places of a drag.',
			Badge: 'A mark in a corner (+5).',
			Classes: 'More classes, for a look of its own.'
		},
		Sample: {Icon: 'fire', Label: 'Fireball', Key: '1', Cooldown: 3000, Color: '#b8402a'}
	},
	Icon: '',
	Image: '',
	Label: '',
	Key: '',
	Count: 0,
	Rarity: '',
	Cooldown: 0,
	Active: false,
	Disabled: false,
	Size: 'medium',
	Color: '',
	Accept: ['game-item'],
	Draggable: true,
	Data: null,
	Group: '',
	Badge: '',
	Classes: '',
	Cooling: false,
	Seconds: '',
	CardOpen: false,
	CardStyle: '',

	$OnCreate: function () {
		var self = this;
		var own = {Binding: null, Frame: 0, Until: 0, Total: 0, Key: ''};

		/* The color of the glass of the slot: its Color, or the color of its rarity. */
		this.ItemColor = function (color, rarity) {
			var value = String(color || '');

			return /^[#a-z0-9(),.%\s-]+$/i.test(value) && value ? value : 'var(--elemenx-game-' + (/^(common|uncommon|rare|epic|legendary)$/.test(rarity) ? rarity : 'common') + ')';
		};

		/* The classes a slot asks for (Classes: a text of names or a list, the Class of the item it holds), for a look of their own. */
		this.ClassList = function (value) {
			var list = Array.isArray(value) ? value : String(value || '').split(/\s+/);

			return list.filter(function (name) {
				return /^[A-Za-z][\w-]*$/.test(name);
			});
		};

		/* What a drag of the slot carries: its Data, or an item made of what it shows. */
		this.Held = function (data, icon, image, label, count, rarity, color) {
			return data || {ID: label || icon || image, Name: label, Icon: icon, Image: image, Count: count, Rarity: rarity, Color: color};
		};

		/* The place of the slot, for the data and the events of a drag. */
		this.Place = function (key, group) {
			return {Kind: 'slot', Key: key, Name: group || ''};
		};

		/* The label of the key on this system. */
		this.KeyLabel = function (key) {
			return key ? self.$Service('Hotkeys').Format(key) : '';
		};

		/* What the slot keeps for itself: not state, so it renders nothing. */
		this.Own = function () {
			return own;
		};
	},

	$OnReady: function () {
		this.BindKey();
	},

	$OnDestroy: function () {
		var own = this.Own();

		window.cancelAnimationFrame(own.Frame);

		this.HideCard();

		if (own.Binding !== null)
			this.Hotkeys().Unbind(own.Binding);
	},

	/* The card of what the slot holds, beside it; a scroll of the page takes it along with the slot. */
	ShowCard: function (event, node) {
		var self = this;
		var own = this.Own();
		var items = this.$Service('GameItems');
		if (!items.Carded(this.Data)) return;

		own.Node = node;

		if (!own.Scroll) {
			own.Scroll = function () {
				if (own.Node)
					self.CardStyle = items.Place(own.Node);
			};

			own.View = (this.$Element().ownerDocument || document).defaultView || window;

			own.View.addEventListener('scroll', own.Scroll, true);
		}

		this.CardStyle = items.Place(node);
		this.CardOpen = true;
	},

	HideCard: function () {
		var own = this.Own();

		if (own.Scroll) {
			(own.View || window).removeEventListener('scroll', own.Scroll, true);

			own.Scroll = null;
		}

		own.Node = null;
		this.CardOpen = false;
	},

	Hotkeys: function () {
		return this.$Service('Hotkeys');
	},

	/* The shortcut of Key, bound again when Key changes. */
	BindKey: function () {
		var self = this;
		var own = this.Own();
		if (own.Key === this.Key) return;

		if (own.Binding !== null)
			this.Hotkeys().Unbind(own.Binding);

		own.Key = this.Key;
		own.Binding = this.Key ? this.Hotkeys().Bind(this.Key, function () {
			self.Use();
		}) : null;
	},

	Use: function () {
		this.BindKey();

		if (this.Disabled || this.Cooling) return false;

		this.$Emit('use', {Label: this.Label, Key: this.Key});

		if (Number(this.Cooldown) > 0)
			this.Cool(Number(this.Cooldown));

		return true;
	},

	Cool: function (milliseconds) {
		var self = this;
		var own = this.Own();
		var root = this.$Element();

		window.cancelAnimationFrame(own.Frame);

		own.Total = Math.max(0, Number(milliseconds) || 0);
		own.Until = Date.now() + own.Total;

		if (!own.Total) return this;

		this.Cooling = true;

		function step () {
			var left = own.Until - Date.now();
			var seconds;

			if (left <= 0) {
				self.Cooling = false;
				self.Seconds = '';

				if (root)
					root.style.removeProperty('--elemenx-game-slot-cooldown');

				self.$Emit('ready', {Label: self.Label, Key: self.Key});

				return;
			}

			seconds = left >= 10000 ? String(Math.ceil(left / 1000)) : (left / 1000).toFixed(1);

			if (seconds !== self.Seconds)
				self.Seconds = seconds;

			if (root)
				root.style.setProperty('--elemenx-game-slot-cooldown', String(left / own.Total));

			own.Frame = window.requestAnimationFrame(step);
		}

		step();

		return this;
	},

	Pressed: function () {
		this.Use();
	},

	/* Something the slot accepts was dropped on it: the owner decides what the slot holds now. */
	Dropped: function (event) {
		var detail = event.detail || {};
		var data = detail.Data || {};

		if (detail.Kind !== 'item') return;
		if (!data.Item || data.From && data.From.Kind === 'slot' && data.From.Key === this.Key && data.From.Name === this.Group) return;

		this.$Emit('drop', {Item: data.Item, From: data.From || null, To: this.Place(this.Key, this.Group), Current: this.Data || null, Type: detail.Type});
	}
});
