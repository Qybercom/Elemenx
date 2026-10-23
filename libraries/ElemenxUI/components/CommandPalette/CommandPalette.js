/*
 * A command palette: a search over the actions of the application, opened by Hotkey ('Mod+K' by default; '' for
 * none) or by Open. Commands: [{ID, Label, Icon, Group, Keys, Hint, Keywords, Disabled, Run}]: Keys shows the
 * shortcut of the command, Keywords are more words to find it by, Run(command) is called when it is chosen.
 * IncludeHotkeys adds every shortcut of the Hotkeys Service that has a Description. The search is fuzzy: the letters
 * of the query in their order, best at the starts of words; the matched letters are marked. With no query the
 * recently used commands come first (Remember: a localStorage key that keeps them between visits).
 * Keys: arrows, Page Up and Down, Home and End move; Enter runs; Escape closes. Events: run (the command), close.
 */
Elemenx.Component('CommandPalette', {
	$TemplateURL: 'CommandPalette.html',
	$StyleURL: 'CommandPalette.css',
	$Meta: {
		Group: 'navigation',
		Icon: 'search',
		Description: 'A command palette: a search over the actions of the application, opened by Hotkey (\'Mod+K\' by default; \'\' for none) or by Open.',
		Events: ['close', 'run'],
		Methods: ['Run(index)'],
		Props: {
			Commands: 'The commands: [{ID, Label, Icon, Group, Keys, Hint, Keywords, Disabled, Run}].',
			Open: 'Shows the palette.',
			Hotkey: 'The shortcut that opens it (Mod+K; empty for none).',
			IncludeHotkeys: 'Adds every shortcut of the Hotkeys Service that has a description.',
			Placeholder: 'The text shown while it is empty.',
			Empty: 'The text when nothing matches.',
			Remember: 'A localStorage key that keeps the recent commands between visits.',
			Limit: 'How many commands the list shows.'
		},
		Sample: {Remember: 'docs-palette'}
	},
	Commands: [],
	Open: false,
	Hotkey: 'Mod+K',
	IncludeHotkeys: false,
	Placeholder: '',
	Empty: '',
	RecentTitle: '',
	Remember: '',
	Shown: false,
	Limit: 50,
	Query: '',
	Active: 0,
	Bound: [],
	Recent: [],

	$OnCreate: function () {
		var self = this;
		var stored = null;

		try {
			stored = this.Remember ? JSON.parse(window.localStorage.getItem(this.Remember) || '[]') : null;
		}
		catch (error) {
			stored = null;
		}

		if (Array.isArray(stored))
			this.Recent = stored;

		if (this.Hotkey)
			this.HotkeyID = this.$Service('Hotkeys').Bind(this.Hotkey, function () {
				if (self.Open) self.Close();
				else self.Show();
			}, {Inputs: true, Description: '', Group: ''});

		/* The rows of the list: group headers and commands, the commands numbered in the order of the keys. */
		this.Rows = function (commands, bound, query, recent) {
			var all = self.All(commands, bound);
			var rows = [];
			var index = 0;
			var text = String(query || '').trim();
			var found;
			var groups = {};
			var order = [];

			/* A row of a command, under a new heading when one is given; a recent command is listed again in its group. */
			function add (entry, heading, prefix) {
				if (heading)
					rows.push({Key: 'group:' + heading, Heading: heading});

				rows.push({Key: prefix + entry.Command.ID, Command: entry.Command, Index: index, Parts: entry.Parts, Shortcut: entry.Command.Keys ? self.$Service('Hotkeys').Format(entry.Command.Keys) : ''});

				index++;
			}

			if (text) {
				found = all.map(function (command) {
					var match = self.Match(command, text);

					return match ? {Command: command, Parts: match.Parts, Score: match.Score} : null;
				}).filter(Boolean).sort(function (a, b) {
					return b.Score - a.Score;
				}).slice(0, Number(self.Limit) || 50);

				found.forEach(function (entry) {
					add(entry, null, 'found:');
				});

				return rows;
			}

			(recent || []).map(function (id) {
				return all.filter(function (entry) {
					return String(entry.ID) === String(id);
				})[0];
			}).filter(Boolean).forEach(function (command, position) {
				add({Command: command, Parts: [{Text: command.Label, Match: false}]}, position === 0 ? self.RecentTitle || Elemenx.Locale.Text('ui.commandPalette.recentTitle') : null, 'recent:');
			});

			all.forEach(function (command) {
				var group = command.Group || '';

				if (!groups[group]) {
					groups[group] = [];

					order.push(group);
				}

				groups[group].push(command);
			});

			order.forEach(function (group) {
				groups[group].forEach(function (command, position) {
					add({Command: command, Parts: [{Text: command.Label, Match: false}]}, position === 0 ? group : null, 'command:');
				});
			});

			return rows;
		};

		/* Follows Open for the binding of the dialog: prepares the palette each time it opens. */
		this.Track = function (open) {
			if (open && !self.Shown) {
				self.Shown = true;

				self.Prepare();
			}

			if (!open)
				self.Shown = false;

			return !!open;
		};

		this.Count = function (rows) {
			return rows.filter(function (row) {
				return !!row.Command;
			}).length;
		};
	},

	$OnDestroy: function () {
		if (this.HotkeyID)
			this.$Service('Hotkeys').Unbind(this.HotkeyID);
	},

	/* The commands and, with IncludeHotkeys, the described shortcuts of the page. */
	All: function (commands, bound) {
		var list = (commands || []).slice();

		/* A shortcut that a command already shows by its Keys is that command. */
		(bound || []).forEach(function (binding) {
			var shown = list.some(function (command) {
				return command.Keys && String(command.Keys) === String(binding.Keys);
			});
			if (binding.Description && !shown)
				list.push({ID: binding.ID, Label: binding.Description, Group: binding.Group || 'Shortcuts', Keys: binding.Keys, Icon: 'chevron-right', Hotkey: binding.ID});
		});

		return list;
	},

	/*
	 * The letters of query found in order in the label of command: a score (starts of words, runs of letters and an
	 * early first letter count) and the label cut into matched and plain parts; null when it does not match. Keywords
	 * and the group are searched too, without marks.
	 */
	Match: function (command, query) {
		var label = String(command.Label || '');
		var lower = label.toLowerCase();
		var wanted = query.toLowerCase().replace(/\s+/g, '');
		var parts = [];
		var score = 0;
		var at = 0;
		var last = -2;
		var i = 0;
		var position;
		var extra;

		while (i < wanted.length) {
			position = lower.indexOf(wanted.charAt(i), at);

			if (position === -1) break;

			score += 1;

			if (position === 0 || /[\s\-_./:]/.test(lower.charAt(position - 1)))
				score += 4;

			if (position === last + 1)
				score += 3;

			parts.push(position);

			last = position;
			at = position + 1;

			i++;
		}

		if (i < wanted.length) {
			extra = [command.Group || ''].concat(command.Keywords || []).join(' ').toLowerCase();

			return extra.indexOf(query.toLowerCase().trim()) !== -1 ? {Score: 1, Parts: [{Text: label, Match: false}]} : null;
		}

		/* The query as it is, in the label, wins; then the shorter label. */
		if (lower.indexOf(query.toLowerCase().trim()) !== -1)
			score += 10;

		score -= parts[0] / 10 + label.length / 100;

		return {Score: score, Parts: this.Cut(label, parts)};
	},

	/* label in parts: [{Text, Match}] with the letters at the positions marked. */
	Cut: function (label, positions) {
		var parts = [];
		var i = 0;
		var match;

		while (i < label.length) {
			match = positions.indexOf(i) !== -1;

			if (parts.length && parts[parts.length - 1].Match === match) parts[parts.length - 1].Text += label.charAt(i);
			else parts.push({Text: label.charAt(i), Match: match});

			i++;
		}

		return parts;
	},

	Show: function () {
		this.Open = true;
	},

	/* A palette that opens (by its Hotkey or by Open) starts empty, with the shortcuts of this moment, and focused. */
	Prepare: function () {
		var root = this.$Element();

		this.Bound = this.IncludeHotkeys ? this.$Service('Hotkeys').List() : [];
		this.Query = '';
		this.Active = 0;

		window.setTimeout(function () {
			var input = root.querySelector('.elemenx-palette-search input');
			if (input)
				input.focus();
		}, 0);
	},

	Close: function () {
		this.Open = false;

		this.$Emit('close');
	},

	Dismissed: function () {
		this.Close();
	},

	Search: function (event, node) {
		this.Query = node.value;
		this.Active = 0;
	},

	Move: function (step, node) {
		var count = this.Count(this.Rows(this.Commands, this.Bound, this.Query, this.Recent));
		var root = node.closest('.elemenx-palette');

		if (!count) return;

		this.Active = step === Infinity ? count - 1 : step === -Infinity ? 0 : Math.max(0, Math.min(count - 1, this.Active + step));

		window.setTimeout(function () {
			var active = root.querySelector('.elemenx-option.active');
			if (active)
				active.scrollIntoView({block: 'nearest'});
		}, 0);
	},

	Key: function (event, node) {
		var steps = {ArrowDown: 1, ArrowUp: -1, PageDown: 8, PageUp: -8};

		if (steps[event.key]) {
			event.preventDefault();

			this.Move(steps[event.key], node);
		}
		else if ((event.key === 'Home' || event.key === 'End') && event.ctrlKey) {
			event.preventDefault();

			this.Move(event.key === 'End' ? Infinity : -Infinity, node);
		}
		else if (event.key === 'Enter') {
			event.preventDefault();

			this.Run(this.Active);
		}
		else if (event.key === 'Tab') {
			event.preventDefault();
		}
	},

	Hover: function (event, node) {
		this.Active = Number(node.getAttribute('data-index'));
	},

	Prevent: function (event) {
		event.preventDefault();
	},

	Pick: function (event, node) {
		this.Run(Number(node.getAttribute('data-index')));
	},

	Run: function (index) {
		var row = this.Rows(this.Commands, this.Bound, this.Query, this.Recent).filter(function (entry) {
			return entry.Index === index;
		})[0];
		var command = row && row.Command;
		var recent;

		if (!command || command.Disabled) return;

		recent = [String(command.ID)].concat(this.Recent.filter(function (id) {
			return String(id) !== String(command.ID);
		})).slice(0, 5);

		this.Recent = recent;

		try {
			if (this.Remember)
				window.localStorage.setItem(this.Remember, JSON.stringify(recent));
		}
		catch (error) {
			/* Without storage the recent commands last for this page only. */
		}

		this.Close();

		if (command.Hotkey) this.$Service('Hotkeys').Trigger(command.Hotkey);
		else if (typeof command.Run === 'function') command.Run(command);

		this.$Emit('run', command);
	}
});
