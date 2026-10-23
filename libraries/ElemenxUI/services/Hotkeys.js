/*
 * Keyboard shortcuts of the page. Bind(keys, callback, options) returns the ID of the binding; Unbind(id) removes it.
 * keys: modifiers and a key joined by '+' ('Mod+K', 'Ctrl+Shift+P', 'Alt+ArrowUp', 'Escape', 'F2', '?'); Mod is Ctrl,
 * or Command on macOS. A space makes a sequence pressed one after another ('g i', within a second). Letters and digits
 * also match by their place on the keyboard, so 'Mod+K' works with any keyboard layout.
 * Options: Scope (an element: the binding works only while the focus is inside it, and wins over the bindings without
 * a Scope), Inputs (true: also while typing in a field; by default a shortcut without Ctrl, Alt or Command does not
 * fire in a field), Prevent (false keeps the default action of the key), Description and Group (shown by List and by
 * CommandPalette). callback(event, binding).
 * List() returns the bindings [{ID, Keys, Label, Description, Group}]; Format(keys) is the label of keys on this
 * system ('Ctrl+K', '⌘K'). Trigger(id) runs a binding as if its keys were pressed (callback(null, binding)).
 * Pause() and Resume() turn every binding off and on (a nested Pause counts). OnChange(callback) / OffChange(callback):
 * callback() after a binding is added or removed (a part of the page that renders later, *lazy, binds its keys then).
 */
Elemenx.Service('Hotkeys', {
	$Meta: {
		Description: 'Keyboard shortcuts of the page.',
		Methods: ['Bind(keys, callback, options)', 'Unbind(id)', 'OnChange(callback)', 'OffChange(callback)', 'List()', 'Trigger(id)', 'Pause()', 'Resume()', 'Format(keys)']
	},
	$OnCreate: function () {
		var self = this;

		this.Bindings = [];
		this.Sequence = 0;
		this.Paused = 0;
		this.Pending = [];
		this.PendingTimer = 0;
		this.Listeners = [];
		this.Mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

		this.Listener = function (event) {
			self.Handle(event);
		};

		document.addEventListener('keydown', this.Listener);
	},

	$OnDestroy: function () {
		document.removeEventListener('keydown', this.Listener);

		window.clearTimeout(this.PendingTimer);

		this.Bindings = [];
	},

	Bind: function (keys, callback, options) {
		options = options || {};

		this.Sequence++;

		this.Bindings.push({
			ID: 'hotkey-' + this.Sequence,
			Keys: String(keys),
			Steps: this.Parse(keys),
			Callback: callback,
			Scope: options.Scope || null,
			Inputs: !!options.Inputs,
			Prevent: options.Prevent !== false,
			Description: options.Description || '',
			Group: options.Group || ''
		});

		this.Changed();

		return 'hotkey-' + this.Sequence;
	},

	Unbind: function (id) {
		var count = this.Bindings.length;

		this.Bindings = this.Bindings.filter(function (binding) {
			return binding.ID !== id;
		});

		if (this.Bindings.length !== count)
			this.Changed();
	},

	OnChange: function (callback) {
		if (this.Listeners.indexOf(callback) === -1)
			this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (listener) {
			return listener !== callback;
		});
	},

	Changed: function () {
		this.Listeners.slice().forEach(function (listener) {
			listener();
		});
	},

	List: function () {
		var self = this;

		return this.Bindings.map(function (binding) {
			return {ID: binding.ID, Keys: binding.Keys, Label: self.Format(binding.Keys), Description: binding.Description, Group: binding.Group};
		});
	},

	Trigger: function (id) {
		var binding = this.Bindings.filter(function (entry) {
			return entry.ID === id;
		})[0];
		if (binding)
			binding.Callback(null, {ID: binding.ID, Keys: binding.Keys, Description: binding.Description, Group: binding.Group});
	},

	Pause: function () {
		this.Paused++;
	},

	Resume: function () {
		this.Paused = Math.max(0, this.Paused - 1);
	},

	/* 'Mod+Shift+k' → [{Ctrl or Meta, Shift, Key: 'k'}] for every step of a sequence. */
	Parse: function (keys) {
		var self = this;

		return String(keys).split(' ').filter(Boolean).map(function (step) {
			var parts = step.split('+');
			var combo = {Ctrl: false, Alt: false, Shift: false, Meta: false, Key: ''};

			/* A '+' key itself: 'Ctrl++'. */
			if (step.slice(-2) === '++') {
				parts = step.slice(0, -2).split('+').filter(Boolean);

				parts.push('+');
			}

			parts.forEach(function (part, index) {
				var name = part.toLowerCase();

				if (index === parts.length - 1 && !(name in {ctrl: 1, control: 1, alt: 1, option: 1, shift: 1, meta: 1, cmd: 1, command: 1, mod: 1})) combo.Key = self.Name(part);
				else if (name === 'mod') combo[self.Mac ? 'Meta' : 'Ctrl'] = true;
				else if (name === 'ctrl' || name === 'control') combo.Ctrl = true;
				else if (name === 'alt' || name === 'option') combo.Alt = true;
				else if (name === 'shift') combo.Shift = true;
				else combo.Meta = true;
			});

			return combo;
		});
	},

	/* The name of a key as Parse and Match compare it: one letter in lower case, or the name of the key. */
	Name: function (key) {
		var aliases = {esc: 'escape', space: ' ', spacebar: ' ', up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', del: 'delete', ins: 'insert', return: 'enter', plus: '+'};
		var name = String(key).toLowerCase();

		return aliases[name] || name;
	},

	/* The key of an event: by its character, or by its place for a letter or a digit typed in another layout. */
	EventKeys: function (event) {
		var keys = [this.Name(event.key || '')];
		var code = event.code || '';

		if (/^Key[A-Z]$/.test(code)) keys.push(code.charAt(3).toLowerCase());
		else if (/^Digit[0-9]$/.test(code)) keys.push(code.charAt(5));

		return keys;
	},

	Matches: function (combo, event) {
		var keys = this.EventKeys(event);
		var character = keys[0].length === 1 && !/[a-z0-9]/.test(keys[0]);

		if (combo.Ctrl !== event.ctrlKey || combo.Alt !== event.altKey || combo.Meta !== event.metaKey) return false;

		/* A punctuation key ('?', '/') is typed with Shift on many layouts: Shift counts only when the binding names it. */
		if (combo.Shift !== event.shiftKey && !(character && !combo.Shift)) return false;

		return keys.indexOf(combo.Key) !== -1;
	},

	Typing: function (target) {
		return !!target && !!target.closest && !!target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
	},

	Handle: function (event) {
		var self = this;
		var target = event.composedPath ? event.composedPath()[0] : event.target;
		var typing = this.Typing(target);
		var candidates;
		var found = null;

		if (this.Paused || event.repeat && !event.ctrlKey && !event.metaKey) return;

		/* The steps pressed so far: a sequence goes on while its next step comes within a second. */
		this.Pending.push(event);

		this.Pending = this.Pending.slice(-4);

		window.clearTimeout(this.PendingTimer);

		this.PendingTimer = window.setTimeout(function () {
			self.Pending = [];
		}, 1000);

		candidates = this.Bindings.filter(function (binding) {
			var steps = binding.Steps;
			var pressed = self.Pending.slice(-steps.length);
			var modified = steps[steps.length - 1].Ctrl || steps[steps.length - 1].Alt || steps[steps.length - 1].Meta;

			if (pressed.length < steps.length) return false;
			if (typing && !binding.Inputs && !modified) return false;
			if (binding.Scope && !(binding.Scope.contains && binding.Scope.contains(target))) return false;

			return steps.every(function (step, index) {
				return self.Matches(step, pressed[index]);
			});
		});

		/* The innermost Scope wins, then the longest sequence, then the binding made last. */
		candidates.forEach(function (binding) {
			if (!found) {
				found = binding;

				return;
			}

			if (binding.Scope && (!found.Scope || found.Scope.contains(binding.Scope))) found = binding;
			else if (!!binding.Scope === !!found.Scope && binding.Steps.length >= found.Steps.length) found = binding;
		});

		if (!found) return;

		this.Pending = [];

		if (found.Prevent)
			event.preventDefault();

		found.Callback(event, {ID: found.ID, Keys: found.Keys, Description: found.Description, Group: found.Group});
	},

	/* The label of keys on this system: 'Ctrl+Shift+K' on Windows and Linux, '⇧⌘K' on macOS. */
	Format: function (keys) {
		var self = this;
		var names = {escape: 'Esc', ' ': 'Space', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→', enter: 'Enter', backspace: 'Backspace', delete: 'Delete', tab: 'Tab'};

		return this.Parse(keys).map(function (combo) {
			var key = names[combo.Key] || (combo.Key.length === 1 ? combo.Key.toUpperCase() : combo.Key.charAt(0).toUpperCase() + combo.Key.slice(1));

			if (self.Mac)
				return (combo.Ctrl ? '⌃' : '') + (combo.Alt ? '⌥' : '') + (combo.Shift ? '⇧' : '') + (combo.Meta ? '⌘' : '') + key;

			return (combo.Ctrl ? 'Ctrl+' : '') + (combo.Alt ? 'Alt+' : '') + (combo.Shift ? 'Shift+' : '') + (combo.Meta ? 'Win+' : '') + key;
		}).join(' ');
	}
});
