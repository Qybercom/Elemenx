/*
 * A keyboard of a computer, drawn key by key (the look and the controls): to show hotkeys, the keys held, or to take
 * presses on a screen. Layout: 'full' (with the number pad), 'tkl' (without it) or 'compact' (the main block alone).
 * Keys are named by their code (KeyboardEvent.code: KeyA, Digit1, ShiftLeft, ArrowUp, Numpad7...).
 * - Pressed: the codes shown pressed; Live also shows the keys held on the keyboard of the user while the page has the
 *   focus (class held: a key that goes down or up changes its own button, not the whole keyboard), but for the keys a
 *   control in the focus takes for itself (a Piano that plays them, a hotkey: they prevent the default of the key). Marks: {code: class} marks keys (a hotkey, a group of keys of a game), true for the mark of the theme.
 * - Labels: {code: text} names keys of their own; Native names the keys of characters as the keyboard layout of the
 *   user writes them (navigator.keyboard, Chrome and Edge), US English otherwise.
 * - Alternate: a second layout on the keys of characters, as on the keyboards of countries with another alphabet: the
 *   first one large in the top left corner of a key, the second one smaller in its bottom right corner. A name of a
 *   layout of the Library ('ru' Russian, 'uk' Ukrainian, 'el' Greek, 'he' Hebrew), 'native' (the layout of the user,
 *   as Native reads it), or {code: text} for any other.
 * - Clickable: a press of a key emits press ({Code, Label}); a key of the screen keyboard is a button.
 */
Elemenx.Component('Keyboard', {
	$TemplateURL: 'Keyboard.html',
	$StyleURL: 'Keyboard.css',
	Layout: 'full',
	Pressed: [],
	Marks: {},
	Labels: {},
	Native: false,
	Alternate: '',
	Live: false,
	Clickable: false,
	Size: 'medium',
	Label: '',
	Map: null,

	$OnCreate: function () {
		var self = this;
		var cache = {};
		var key = function (code, label, width, height) {
			return {Code: code, Label: label, Width: width || 1, Height: height || 1};
		};
		var letters = function (list) {
			return list.split('').map(function (letter) {
				return {Code: 'Key' + letter, Label: letter, Width: 1, Height: 1, Char: true};
			});
		};
		var chars = function (list) {
			return list.map(function (entry) {
				return {Code: entry[0], Label: entry[1], Width: 1, Height: 1, Char: true};
			});
		};
		var gap = function (width) {
			return {Gap: width};
		};
		var functions = [key('Escape', 'Esc'), gap(1)].concat(['F1', 'F2', 'F3', 'F4'].map(function (name) {
			return key(name, name);
		}), [gap(0.5)], ['F5', 'F6', 'F7', 'F8'].map(function (name) {
			return key(name, name);
		}), [gap(0.5)], ['F9', 'F10', 'F11', 'F12'].map(function (name) {
			return key(name, name);
		}));
		var main = [
			chars([['Backquote', '`'], ['Digit1', '1'], ['Digit2', '2'], ['Digit3', '3'], ['Digit4', '4'], ['Digit5', '5'], ['Digit6', '6'], ['Digit7', '7'], ['Digit8', '8'], ['Digit9', '9'], ['Digit0', '0'], ['Minus', '-'], ['Equal', '=']]).concat([key('Backspace', '⌫', 2)]),
			[key('Tab', 'Tab', 1.5)].concat(letters('QWERTYUIOP'), chars([['BracketLeft', '['], ['BracketRight', ']']]), [{Code: 'Backslash', Label: '\\', Width: 1.5, Height: 1, Char: true}]),
			[key('CapsLock', 'Caps', 1.75)].concat(letters('ASDFGHJKL'), chars([['Semicolon', ';'], ['Quote', '\'']]), [key('Enter', 'Enter', 2.25)]),
			[key('ShiftLeft', 'Shift', 2.25)].concat(letters('ZXCVBNM'), chars([['Comma', ','], ['Period', '.'], ['Slash', '/']]), [key('ShiftRight', 'Shift', 2.75)]),
			[key('ControlLeft', 'Ctrl', 1.25), key('MetaLeft', 'Win', 1.25), key('AltLeft', 'Alt', 1.25), key('Space', '', 6.25), key('AltRight', 'Alt', 1.25), key('MetaRight', 'Win', 1.25), key('ContextMenu', '☰', 1.25), key('ControlRight', 'Ctrl', 1.25)]
		];
		var navigation = [
			[key('PrintScreen', 'PrtSc'), key('ScrollLock', 'ScrLk'), key('Pause', 'Pause')],
			[key('Insert', 'Ins'), key('Home', 'Home'), key('PageUp', 'PgUp')],
			[key('Delete', 'Del'), key('End', 'End'), key('PageDown', 'PgDn')],
			[],
			[gap(1), key('ArrowUp', '↑')],
			[key('ArrowLeft', '←'), key('ArrowDown', '↓'), key('ArrowRight', '→')]
		];
		var numbers = [
			[],
			[key('NumLock', 'Num'), key('NumpadDivide', '/'), key('NumpadMultiply', '*'), key('NumpadSubtract', '-')],
			[key('Numpad7', '7'), key('Numpad8', '8'), key('Numpad9', '9'), key('NumpadAdd', '+', 1, 2)],
			[key('Numpad4', '4'), key('Numpad5', '5'), key('Numpad6', '6')],
			[key('Numpad1', '1'), key('Numpad2', '2'), key('Numpad3', '3'), key('NumpadEnter', 'Enter', 1, 2)],
			[key('Numpad0', '0', 2), key('NumpadDecimal', '.')]
		];

		/* A block of keys placed on a grid of quarters of a key: each key its column, row, width and height. */
		var block = function (name, rows) {
			var keys = [];
			var width = 0;

			rows.forEach(function (row, y) {
				var x = 0;

				row.forEach(function (entry) {
					if (entry.Gap) {
						x += entry.Gap;

						return;
					}

					keys.push({Code: entry.Code, Label: entry.Label, Char: !!entry.Char, Style: 'grid-column: ' + (Math.round(x * 4) + 1) + ' / span ' + Math.round(entry.Width * 4) + '; grid-row: ' + (y + 1) + ' / span ' + entry.Height + ';'});

					x += entry.Width;
				});

				width = Math.max(width, x);
			});

			return {Name: name, Keys: keys, Style: 'grid-template-columns: repeat(' + Math.round(width * 4) + ', calc(var(--elemenx-keyboard-unit) / 4)); grid-template-rows: repeat(' + rows.length + ', var(--elemenx-keyboard-unit));'};
		};

		/* The blocks of a layout: the function keys over the main block, then the navigation and the number pad. */
		this.Blocks = function (layout) {
			layout = layout === 'compact' || layout === 'tkl' ? layout : 'full';

			if (!cache[layout]) {
				cache[layout] = [block('main', (layout === 'compact' ? [] : [functions]).concat(main))];

				if (layout !== 'compact')
					cache[layout].push(block('navigation', navigation));

				if (layout === 'full')
					cache[layout].push(block('numbers', numbers));
			}

			return cache[layout];
		};

		/* The name of a key: one of Labels, the character of the layout of the user, or the one of US English. */
		this.Name = function (entry, labels, map) {
			if (labels && labels[entry.Code] !== undefined) return labels[entry.Code];

			if (entry.Char && map && map[entry.Code])
				return String(map[entry.Code]).toUpperCase();

			return entry.Label;
		};

		/* The second name of a key of characters under Alternate, '' for none (or the same as the first). */
		this.Second = function (entry, alternate, map) {
			var names = alternate === 'native' ? map : typeof alternate === 'string' ? self.Layouts[alternate] : alternate;
			var text = entry.Char && names && names[entry.Code];
			if (!text)
				return '';

			/* The layout of the user names its characters in lower case; the keys show them as they are printed. */
			text = alternate === 'native' ? String(text).toUpperCase() : String(text);

			return text === self.Name(entry, self.Labels, self.Map) ? '' : text;
		};

		this.Down = function (code, pressed) {
			return (pressed || []).indexOf(code) !== -1;
		};

		/* The mark of a key: the class Marks gives it, 'marked' for true. */
		this.Mark = function (code, marks) {
			var mark = marks && marks[code];
			if (!mark)
				return '';

			return mark === true ? 'marked' : String(mark).split(/\s+/).filter(function (name) {
				return /^[A-Za-z][\w-]*$/.test(name);
			}).join(' ');
		};

		/*
		 * The keys held on the keyboard of the user, while Live: out of the state of the component, so a key that goes
		 * down or up changes its own button, not every key of the keyboard.
		 */
		var held = [];

		this.Hold = function (code, down) {
			var root = self.$Element();
			var key = root && root.querySelector('.elemenx-keyboard-key[data-code="' + code + '"]');

			if (down) held.push(code);
			else held.splice(held.indexOf(code), 1);

			if (!key) return;

			key.classList.toggle('held', down);
			key.setAttribute('aria-pressed', String(down || self.Down(code, self.Pressed)));
		};

		/* A key a control in the focus took for itself (it prevented the default of the key) is the control's, not shown. */
		this.KeyDown = function (event) {
			if (!self.Live || event.defaultPrevented || !/^[A-Za-z0-9]+$/.test(event.code || '') || held.indexOf(event.code) !== -1) return;

			self.Hold(event.code, true);
		};

		this.KeyUp = function (event) {
			if (!self.Live || held.indexOf(event.code) === -1) return;

			self.Hold(event.code, false);
		};

		this.Blurred = function () {
			held.slice().forEach(function (code) {
				self.Hold(code, false);
			});
		};

		this.Listen();

		if ((this.Native || this.Alternate === 'native') && navigator.keyboard && typeof navigator.keyboard.getLayoutMap === 'function') {
			navigator.keyboard.getLayoutMap().then(function (map) {
				var names = {};

				map.forEach(function (value, code) {
					names[code] = value;
				});

				self.Map = names;
			}, function () {});
		}
	},

	$OnDestroy: function () {
		this.Unlisten();
	},

	/* Asleep (Elemenx.Cache keeps it out of the page) it hears no key and shows none held. */
	$OnSleep: function () {
		this.Unlisten();
		this.Blurred();
	},

	$OnWake: function () {
		this.Listen();
	},

	Listen: function () {
		document.addEventListener('keydown', this.KeyDown);
		document.addEventListener('keyup', this.KeyUp, true);
		window.addEventListener('blur', this.Blurred);
	},

	Unlisten: function () {
		document.removeEventListener('keydown', this.KeyDown);
		document.removeEventListener('keyup', this.KeyUp, true);
		window.removeEventListener('blur', this.Blurred);
	},

	/* The second layouts of the Library: the characters of the keys of letters and signs, by their codes, as printed on them. */
	Layouts: {
		ru: {Backquote: 'Ё', KeyQ: 'Й', KeyW: 'Ц', KeyE: 'У', KeyR: 'К', KeyT: 'Е', KeyY: 'Н', KeyU: 'Г', KeyI: 'Ш', KeyO: 'Щ', KeyP: 'З', BracketLeft: 'Х', BracketRight: 'Ъ', KeyA: 'Ф', KeyS: 'Ы', KeyD: 'В', KeyF: 'А', KeyG: 'П', KeyH: 'Р', KeyJ: 'О', KeyK: 'Л', KeyL: 'Д', Semicolon: 'Ж', Quote: 'Э', KeyZ: 'Я', KeyX: 'Ч', KeyC: 'С', KeyV: 'М', KeyB: 'И', KeyN: 'Т', KeyM: 'Ь', Comma: 'Б', Period: 'Ю', Slash: '.'},
		uk: {Backquote: 'ʼ', KeyQ: 'Й', KeyW: 'Ц', KeyE: 'У', KeyR: 'К', KeyT: 'Е', KeyY: 'Н', KeyU: 'Г', KeyI: 'Ш', KeyO: 'Щ', KeyP: 'З', BracketLeft: 'Х', BracketRight: 'Ї', Backslash: 'Ґ', KeyA: 'Ф', KeyS: 'І', KeyD: 'В', KeyF: 'А', KeyG: 'П', KeyH: 'Р', KeyJ: 'О', KeyK: 'Л', KeyL: 'Д', Semicolon: 'Ж', Quote: 'Є', KeyZ: 'Я', KeyX: 'Ч', KeyC: 'С', KeyV: 'М', KeyB: 'И', KeyN: 'Т', KeyM: 'Ь', Comma: 'Б', Period: 'Ю', Slash: '.'},
		el: {KeyQ: ';', KeyW: 'ς', KeyE: 'Ε', KeyR: 'Ρ', KeyT: 'Τ', KeyY: 'Υ', KeyU: 'Θ', KeyI: 'Ι', KeyO: 'Ο', KeyP: 'Π', KeyA: 'Α', KeyS: 'Σ', KeyD: 'Δ', KeyF: 'Φ', KeyG: 'Γ', KeyH: 'Η', KeyJ: 'Ξ', KeyK: 'Κ', KeyL: 'Λ', Semicolon: '΄', KeyZ: 'Ζ', KeyX: 'Χ', KeyC: 'Ψ', KeyV: 'Ω', KeyB: 'Β', KeyN: 'Ν', KeyM: 'Μ'},
		he: {KeyQ: '/', KeyW: "'", KeyE: 'ק', KeyR: 'ר', KeyT: 'א', KeyY: 'ט', KeyU: 'ו', KeyI: 'ן', KeyO: 'ם', KeyP: 'פ', KeyA: 'ש', KeyS: 'ד', KeyD: 'ג', KeyF: 'כ', KeyG: 'ע', KeyH: 'י', KeyJ: 'ח', KeyK: 'ל', KeyL: 'ך', Semicolon: 'ף', Quote: ',', KeyZ: 'ז', KeyX: 'ס', KeyC: 'ב', KeyV: 'ה', KeyB: 'נ', KeyN: 'מ', KeyM: 'צ', Comma: 'ת', Period: 'ץ', Slash: '.'}
	},

	Press: function (event, node) {
		var code = node.getAttribute('data-code');
		var label = node.querySelector('.elemenx-keyboard-label');

		if (!this.Clickable) return;

		this.$Emit('press', {Code: code, Label: (label || node).textContent.trim()});
	}
});
