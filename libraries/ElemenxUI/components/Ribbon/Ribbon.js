/*
 * A ribbon of commands, as in Microsoft Office: tabs of RibbonTab, each with RibbonGroup groups of RibbonButton,
 * RibbonGallery and any other controls, declared in the template:
 *
 *     <Ribbon [tab]="Tab" (tab)="TabChanged" (command)="Run">
 *         <RibbonTab ID="home" Title="Home"><RibbonGroup Title="Clipboard">...</RibbonGroup></RibbonTab>
 *     </Ribbon>
 *
 * Slots: quick (the quick access toolbar, before the tabs), end (after them: a search, a share button) and backstage
 * (a RibbonBackstage: the File button opens it over the Workspace of the Ribbon, or over the window without one). Tab
 * is the current tab (the first one that is not contextual by default). A narrow Ribbon shrinks its groups step by step (see RibbonGroup). Collapsed shows only the
 * tabs: a tab then opens its panel over the page until a command runs; a double click on a tab, the pin button or
 * Ctrl+F1 collapse and pin it. When even the narrow bar has no room for the tabs, a button with the title of the current
 * tab takes their place and lists them.
 * Key tips: Alt (or F10) shows a letter on every tab, the File button and the quick access commands; a letter opens
 * its tab and shows the letters of its commands; a letter of a command runs it; Escape goes back a level.
 * Events: tab ({ID}), command ({ID, Item}) for every RibbonButton, RibbonGallery and command page, collapse
 * ({Collapsed}), backstage ({Open}).
 */
Elemenx.Component('Ribbon', {
	$TemplateURL: 'Ribbon.html',
	$StyleURL: 'Ribbon.css',
	$Meta: {
		Group: 'navigation',
		Icon: 'menu',
		Description: 'A ribbon of commands, as in Microsoft Office: tabs (RibbonTab) of groups (RibbonGroup) of buttons (RibbonButton), galleries (RibbonGallery) and any other controls, and a backstage (RibbonBackstage) behind the File button.',
		Container: true,
		Children: ['RibbonTab', 'RibbonBackstage'],
		Current: 'Tab',
		Slots: ['quick', 'end', 'backstage'],
		Events: ['tab', 'collapse', 'command', 'backstage'],
		Props: {
			Tab: 'The ID of the current tab.',
			Collapsed: 'Shows only the tabs; a tab opens its panel over the page.',
			Collapsible: 'Lets the user collapse it (a double click on a tab, the pin, Ctrl+F1).',
			KeyTips: 'Alt shows the letters of the tabs and the commands.',
			Label: 'The name of the ribbon for screen readers.',
			FileLabel: 'The text of the File button.',
			FileKeyTip: 'The key tip of the File button.'
		}
	},
	Tab: '',
	Collapsed: false,
	Collapsible: true,
	KeyTips: true,
	Label: '',
	FileLabel: '',
	FileKeyTip: 'F',
	Tabs: [],
	Floating: false,
	HasBackstage: false,
	TabsOpen: false,

	$OnCreate: function () {
		var self = this;

		/* The channels of the color of a contextual tab, for its tint. */
		this.Channels = function (color) {
			return self.$Service('Theme').Channels(color);
		};

		/* The current tab: Tab when it is shown and enabled, otherwise the first tab that is not contextual. */
		this.Active = function (tab, tabs) {
			var first = '';
			var i = 0;

			while (i < tabs.length) {
				if (!tabs[i].Disabled && String(tabs[i].ID) === String(tab)) return tabs[i].ID;

				if (!first && !tabs[i].Disabled && !tabs[i].Contextual)
					first = tabs[i].ID;

				i++;
			}

			return first || (tabs[0] ? tabs[0].ID : '');
		};

		/* The title of the current tab, for the button that lists the tabs on a narrow Ribbon. */
		this.TabTitle = function (tab, tabs) {
			var id = self.Active(tab, tabs);
			var i = 0;

			while (i < tabs.length) {
				if (String(tabs[i].ID) === String(id)) return tabs[i].Title;

				i++;
			}

			return '';
		};
	},

	$OnReady: function () {
		var self = this;
		var root = this.$Element();
		var watched = ['data-id', 'data-title', 'data-keytip', 'data-contextual', 'data-context', 'data-color', 'data-disabled', 'data-tab'];

		function source (node) {
			return node.nodeType === 1 && (node.matches('.elemenx-ribbon-panel, .elemenx-ribbon-group, .elemenx-ribbon-backstage') || !!node.querySelector('.elemenx-ribbon-panel, .elemenx-ribbon-group, .elemenx-ribbon-backstage'));
		}

		function relevant (record) {
			if (record.type === 'attributes')
				return record.target.matches('.elemenx-ribbon-panel, .elemenx-ribbon-panels');

			return Array.prototype.some.call(record.addedNodes, source) || Array.prototype.some.call(record.removedNodes, source);
		}

		this.Watcher = new MutationObserver(function (records) {
			if (records.some(relevant))
				self.Sync();
		});

		this.Watcher.observe(root, {subtree: true, childList: true, attributes: true, attributeFilter: watched});

		if (typeof ResizeObserver !== 'undefined') {
			this.Sizer = new ResizeObserver(function () {
				self.FitSoon();
			});

			this.Sizer.observe(root);
		}

		this.OnCommand = function (event) {
			self.Ran(event);
		};

		this.OnClose = function (event) {
			self.CloseBackstage(event.detail && event.detail.Focus !== false);
		};

		this.OnPress = function (event) {
			var target = event.composedPath ? event.composedPath()[0] : event.target;
			if (self.Floating && !root.contains(target) && !(target.closest && target.closest('.elemenx-popup, .elemenx-ribbon-group-popup')))
				self.Floating = false;
		};

		this.OnDown = function (event) {
			self.KeyDown(event);
		};

		this.OnUp = function (event) {
			self.KeyUp(event);
		};

		this.OnCover = function () {
			self.Cover();
		};

		root.addEventListener('elemenx-ribbon-command', this.OnCommand);
		root.addEventListener('elemenx-ribbon-close', this.OnClose);
		document.addEventListener('pointerdown', this.OnPress, true);
		document.addEventListener('keydown', this.OnDown, true);
		document.addEventListener('keyup', this.OnUp, true);

		this.Sync();
	},

	/* Asleep (Elemenx.Cache keeps it out of the page) the key tips and the presses outside are not its own. */
	$OnSleep: function () {
		this.HideTips();

		document.removeEventListener('pointerdown', this.OnPress, true);
		document.removeEventListener('keydown', this.OnDown, true);
		document.removeEventListener('keyup', this.OnUp, true);
	},

	$OnWake: function () {
		document.addEventListener('pointerdown', this.OnPress, true);
		document.addEventListener('keydown', this.OnDown, true);
		document.addEventListener('keyup', this.OnUp, true);

		this.Sync();
	},

	$OnDestroy: function () {
		var root = this.$Element();

		if (this.Watcher)
			this.Watcher.disconnect();

		if (this.Sizer)
			this.Sizer.disconnect();

		window.cancelAnimationFrame(this.FitFrame);

		this.HideTips();

		if (root) {
			root.removeEventListener('elemenx-ribbon-command', this.OnCommand);
			root.removeEventListener('elemenx-ribbon-close', this.OnClose);
		}

		document.removeEventListener('pointerdown', this.OnPress, true);
		document.removeEventListener('keydown', this.OnDown, true);
		document.removeEventListener('keyup', this.OnUp, true);
		window.removeEventListener('resize', this.OnCover);
		window.removeEventListener('scroll', this.OnCover, true);
	},

	/* The panels of this Ribbon (not of a Ribbon inside it), read as Tabs reads its tabs (the Panels Service). */
	Panels: function () {
		return this.$Service('Panels').Read(this.$Element(), '.elemenx-ribbon-panel', '.elemenx-ribbon');
	},

	/* Reads the declared tabs, shows the panel of the current one and fits its groups. */
	Sync: function () {
		var root = this.$Element();
		var panels = this.Panels();
		var tabs = [];
		var active;
		var i = 0;


		while (i < panels.length) {
			tabs.push({
				ID: panels[i].getAttribute('data-id') || '',
				Title: panels[i].getAttribute('data-title') || '',
				KeyTip: panels[i].getAttribute('data-keytip') || '',
				Contextual: panels[i].getAttribute('data-contextual') === 'true',
				Context: panels[i].getAttribute('data-context') || '',
				Color: panels[i].getAttribute('data-color') || '',
				Disabled: panels[i].getAttribute('data-disabled') === 'true'
			});

			i++;
		}

		if (JSON.stringify(tabs) !== JSON.stringify(this.Tabs))
			this.Tabs = tabs;

		active = String(this.Active(this.Tab, tabs));

		i = 0;

		while (i < panels.length) {
			panels[i].classList.toggle('active', panels[i].getAttribute('data-id') === active);

			i++;
		}

		if (this.HasBackstage !== !!root.querySelector('.elemenx-ribbon-backstage'))
			this.HasBackstage = !this.HasBackstage;

		this.FitSoon();
	},

	/*
	 * Fits the groups once in the next frame, whatever asked for it meanwhile: the content that builds and the size that
	 * changes ask many times, and every measure of a fit lays out the whole page.
	 */
	FitSoon: function () {
		var self = this;

		if (this.FitFrame) return;

		this.FitFrame = window.requestAnimationFrame(function () {
			self.FitFrame = 0;

			self.Fit();
		});
	},

	/* The panel of the current tab, or null. */
	Current: function () {
		var panels = this.Panels();
		var i = 0;

		while (i < panels.length) {
			if (panels[i].classList.contains('active')) return panels[i];

			i++;
		}

		return null;
	},

	/*
	 * Shrinks the groups of the current panel until they fit, one step of one group at a time (compact: large buttons
	 * become small; icons: the labels go; collapsed: one button). The groups of the lowest Priority go through every
	 * step before a group of a higher one starts; among equal ones the rightmost goes first. The shrinking stops as
	 * soon as the panel has room; when every group is one button and there is still no room, the panel scrolls.
	 */
	Fit: function () {
		var root = this.$Element();

		var bar = root.querySelector('.elemenx-ribbon-bar');
		var tabs = root.querySelector('.elemenx-ribbon-tabs');
		var panel = this.Current();
		var steps = ['compact', 'icons', 'collapsed'];
		var groups;
		var tiers = [];
		var tier;
		var step;
		var i = 0;
		var j;

		/* A ribbon out of sight (asleep, in a hidden panel) has no width to fit in. */
		if (!root.isConnected || !root.offsetWidth) return;

		/* A narrow bar shows the commands of its slots as icons, so the tabs keep their room; without room still, a button lists them. */
		root.classList.remove('narrow', 'tabs-menu');

		if (bar.scrollWidth > bar.clientWidth + 1 || tabs.scrollWidth > tabs.clientWidth + 1)
			root.classList.add('narrow');

		if (tabs.scrollWidth > tabs.clientWidth + 1) root.classList.add('tabs-menu');
		else if (this.TabsOpen) this.TabsOpen = false;

		if (!panel || !panel.offsetWidth) return;

		panel.classList.remove('overflowing');

		groups = Array.prototype.filter.call(panel.querySelectorAll('.elemenx-ribbon-group'), function (group) {
			return group.closest('.elemenx-ribbon-panel') === panel;
		});

		while (i < groups.length) {
			groups[i].classList.remove('compact', 'icons', 'collapsed');

			i++;
		}

		groups.map(function (group, index) {
			return {Group: group, Priority: Number(group.getAttribute('data-priority')) || 0, Index: index};
		}).sort(function (a, b) {
			return a.Priority - b.Priority || b.Index - a.Index;
		}).forEach(function (entry) {
			if (!tiers.length || tiers[tiers.length - 1][0].Priority !== entry.Priority)
				tiers.push([]);

			tiers[tiers.length - 1].push(entry);
		});

		i = 0;

		while (i < tiers.length) {
			tier = tiers[i];
			step = 0;

			while (step < steps.length) {
				j = 0;

				while (j < tier.length) {
					if (panel.scrollWidth <= panel.clientWidth + 1) return;

					if (step)
						tier[j].Group.classList.remove(steps[step - 1]);

					tier[j].Group.classList.add(steps[step]);

					j++;
				}

				step++;
			}

			i++;
		}

		/* Every group is one button and the panel is still too narrow: it scrolls. */
		if (panel.scrollWidth > panel.clientWidth + 1)
			panel.classList.add('overflowing');
	},

	Pick: function (event, node) {
		var id = node.getAttribute('data-id');

		if (node.classList.contains('disabled')) return;

		if (this.Collapsed)
			this.Floating = !(this.Floating && String(id) === String(this.Active(this.Tab, this.Tabs)));

		this.Select(id);
	},

	/* The list of the tabs of a narrow Ribbon: it opens on its selected tab. */
	TabsMenu: function () {
		var self = this;

		this.TabsOpen = !this.TabsOpen;

		if (!this.TabsOpen) return;

		window.setTimeout(function () {
			var list = self.$Element().querySelector('.elemenx-ribbon-tabs-list');
			var target = list && (list.querySelector('.elemenx-option.selected') || list.querySelector('.elemenx-option:not([disabled])'));
			if (target)
				target.focus();
		}, 0);
	},

	TabsButtonKey: function (event) {
		if (Elemenx.Locale.Key(event) !== 'ArrowDown' && Elemenx.Locale.Key(event) !== 'ArrowUp') return;

		event.preventDefault();

		if (!this.TabsOpen)
			this.TabsMenu();
	},

	/* Up and Down move over the tabs that can be chosen, Home and End to the first and the last. */
	TabsListKey: function (event) {
		var options = Array.prototype.filter.call(this.$Element().querySelectorAll('.elemenx-ribbon-tabs-list .elemenx-option'), function (option) {
			return !option.disabled;
		});
		var index = options.indexOf(this.$Element().getRootNode().activeElement);

		if (!options.length) return;

		if (Elemenx.Locale.Key(event) === 'ArrowDown') index = index < options.length - 1 ? index + 1 : 0;
		else if (Elemenx.Locale.Key(event) === 'ArrowUp') index = index > 0 ? index - 1 : options.length - 1;
		else if (Elemenx.Locale.Key(event) === 'Home') index = 0;
		else if (Elemenx.Locale.Key(event) === 'End') index = options.length - 1;
		else return;

		event.preventDefault();

		options[index].focus();
	},

	TabChosen: function (event, node) {
		this.TabsOpen = false;

		this.Pick(event, node);

		this.$Element().querySelector('.elemenx-ribbon-tabs-button').focus();
	},

	TabsClosed: function (event) {
		this.TabsOpen = false;

		if (event.detail && event.detail.Reason === 'escape')
			this.$Element().querySelector('.elemenx-ribbon-tabs-button').focus();
	},

	Select: function (id) {
		if (String(id) === String(this.Active(this.Tab, this.Tabs))) return;

		this.Tab = id;

		this.$Emit('tab', {ID: id});
	},

	/* Collapses the Ribbon to its tabs, or pins it open again. */
	Toggle: function () {
		if (!this.Collapsible || this.Collapsible === 'false') return;

		this.Collapsed = !this.Collapsed;
		this.Floating = false;

		this.$Emit('collapse', {Collapsed: this.Collapsed});
	},

	TabKey: function (event, node) {
		var tabs = Array.prototype.slice.call(node.querySelectorAll('.elemenx-ribbon-tab:not(.disabled)'));
		var index = tabs.indexOf(node.getRootNode().activeElement);
		var next = -1;
		var panel;
		var first;

		if (index === -1) return;

		if (Elemenx.Locale.Key(event) === 'ArrowRight') next = (index + 1) % tabs.length;
		else if (Elemenx.Locale.Key(event) === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
		else if (Elemenx.Locale.Key(event) === 'Home') next = 0;
		else if (Elemenx.Locale.Key(event) === 'End') next = tabs.length - 1;

		if (next !== -1) {
			event.preventDefault();

			tabs[next].focus();

			this.Select(tabs[next].getAttribute('data-id'));

			return;
		}

		if (Elemenx.Locale.Key(event) !== 'ArrowDown' && Elemenx.Locale.Key(event) !== 'Enter' && Elemenx.Locale.Key(event) !== ' ') return;

		event.preventDefault();

		if (this.Collapsed)
			this.Floating = true;

		panel = this.Current();
		first = panel && panel.querySelector('button:not([disabled]), input:not([disabled]), [tabindex="0"]');

		if (first)
			window.setTimeout(function () {
				first.focus();
			}, 0);
	},

	Key: function (event) {
		if (Elemenx.Locale.Key(event) === 'F1' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();

			this.Toggle();

			return;
		}

		if (Elemenx.Locale.Key(event) === 'Escape' && this.Floating) {
			this.Floating = false;

			this.$Element().querySelector('.elemenx-ribbon-tab.active').focus();
		}
	},

	/* A command ran inside the Ribbon: it is reported, and a floating panel closes. */
	Ran: function (event) {
		this.$Emit('command', {ID: event.detail.ID, Item: event.detail.Item || null});

		if (this.Floating)
			this.Floating = false;

		if (this.Tips)
			this.HideTips();

		if (event.detail.Backstage)
			this.CloseBackstage(false);
	},

	Backstage: function () {
		var root = this.$Element();

		return root ? root.querySelector('.elemenx-ribbon-backstage') : null;
	},

	OpenBackstage: function () {
		var backstage = this.Backstage();
		var first;

		if (!backstage) return;

		this.HideTips();

		this.Floating = false;

		backstage.classList.add('open');

		this.Cover();

		window.addEventListener('resize', this.OnCover);
		window.addEventListener('scroll', this.OnCover, true);

		first = backstage.querySelector('.elemenx-ribbon-backstage-item.active') || backstage.querySelector('.elemenx-ribbon-backstage-item');

		if (first)
			first.focus();

		this.$Emit('backstage', {Open: true});
	},

	/*
	 * The open backstage covers the Workspace of the Ribbon, where it stands in the page now (a page around it scrolls,
	 * a header of the page stays over it); without a Workspace, the whole window.
	 */
	Cover: function () {
		var backstage = this.Backstage();
		var workspace = this.$Element() && this.$Element().closest('.elemenx-workspace');
		var box;

		if (!backstage) return;

		if (!workspace) {
			['top', 'left', 'right', 'bottom', 'width', 'height'].forEach(function (name) {
				backstage.style.removeProperty(name);
			});

			return;
		}

		box = workspace.getBoundingClientRect();

		backstage.style.top = box.top + 'px';
		backstage.style.left = box.left + 'px';
		backstage.style.right = 'auto';
		backstage.style.bottom = 'auto';
		backstage.style.width = box.width + 'px';
		backstage.style.height = box.height + 'px';
	},

	CloseBackstage: function (focus) {
		var backstage = this.Backstage();
		var file;

		if (!backstage || !backstage.classList.contains('open')) return;

		backstage.classList.remove('open');

		window.removeEventListener('resize', this.OnCover);
		window.removeEventListener('scroll', this.OnCover, true);

		file = this.$Element().querySelector('.elemenx-ribbon-file');

		if (focus && file)
			file.focus();

		this.$Emit('backstage', {Open: false});
	},

	/* Alt pressed and released alone, or F10, shows the key tips; while they show, keys go to them. */
	KeyDown: function (event) {
		var plain = !event.ctrlKey && !event.metaKey && !event.shiftKey;

		if (this.Tips) {
			this.TipKey(event);

			return;
		}

		this.Alone = Elemenx.Locale.Key(event) === 'Alt' && plain;

		if (Elemenx.Locale.Key(event) === 'F10' && plain && !event.altKey && this.Usable()) {
			event.preventDefault();

			this.ShowTips(null);
		}
	},

	KeyUp: function (event) {
		if (Elemenx.Locale.Key(event) !== 'Alt' || !this.Alone) return;

		this.Alone = false;

		if (!this.Usable()) return;

		event.preventDefault();

		if (this.Tips) this.HideTips();
		else this.ShowTips(null);
	},

	/* Key tips work while the Ribbon is on the page, shown, and no dialog is open over it. */
	Usable: function () {
		var root = this.$Element();
		var backstage = this.Backstage();

		if (!this.KeyTips || this.KeyTips === 'false' || !root || !root.getClientRects().length) return false;

		return !(backstage && backstage.classList.contains('open')) && !document.querySelector('dialog[open]');
	},

	/* The elements that take a key tip in a scope: the bar (scope null), a tab panel or the panel of a shrunk group. */
	Targets: function (scope) {
		var root = this.$Element();
		var selector = '[data-keytip], .elemenx-ribbon-button, .elemenx-ribbon-split, .elemenx-ribbon-group-toggle, .elemenx-ribbon-launcher, .elemenx-ribbon-gallery-more, .elemenx-ribbon-group-body .elemenx-input, .elemenx-ribbon-group-body .elemenx-select-trigger';
		var nodes;

		if (!scope) {
			nodes = Array.prototype.slice.call(root.querySelectorAll('.elemenx-ribbon-file, .elemenx-ribbon-tab:not(.disabled), .elemenx-ribbon-tabs-button, .elemenx-ribbon-quick button, .elemenx-ribbon-quick [data-keytip]'));
		}
		else {
			nodes = Array.prototype.filter.call(scope.querySelectorAll(selector), function (node) {
				var group = node.closest('.elemenx-ribbon-group');

				/* Inside a shrunk group only its button counts, until its panel opens. */
				return !(group && group.classList.contains('collapsed') && !group.classList.contains('open') && !node.classList.contains('elemenx-ribbon-group-toggle'));
			});
		}

		return nodes.filter(function (node, index) {
			return nodes.indexOf(node) === index && !node.disabled && node.getClientRects().length > 0 && !node.closest('.elemenx-ribbon-keytips');
		});
	},

	/*
	 * Gives every target a key: its own data-keytip, or the first free letter of its name, then any free letter or
	 * digit; with more targets than keys, two characters after Y (Y1, YA...), Y being kept for them.
	 */
	Assign: function (nodes) {
		var keys = [];
		var used = {};
		var free = 'ABCDEFGHIJKLMNOPQRSTUVWXZ123456789'.split('');
		var many = nodes.length > free.length;
		var count = 0;
		var i = 0;

		function name (node) {
			return String(node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent || '').toUpperCase();
		}

		while (i < nodes.length) {
			keys.push(String(nodes[i].getAttribute('data-keytip') || '').toUpperCase());

			/* A key of two letters keeps its first letter from the others, so typing it waits for the second. */
			if (keys[i])
				used[keys[i]] = used[keys[i].charAt(0)] = true;

			i++;
		}

		if (!many)
			free.push('Y');

		i = 0;

		while (i < nodes.length) {
			if (!keys[i]) {
				keys[i] = name(nodes[i]).split('').concat(free).filter(function (letter) {
					return /[A-ZА-ЯЁ0-9]/.test(letter) && !used[letter] && !(many && letter === 'Y');
				})[0] || '';

				if (!keys[i]) {
					count++;

					keys[i] = 'Y' + (count < 10 ? count : String.fromCharCode(55 + count));
				}

				used[keys[i]] = true;
			}

			i++;
		}

		return keys;
	},

	ShowTips: function (scope) {
		var self = this;
		var root = this.$Element();
		var nodes = this.Targets(scope);
		var keys = this.Assign(nodes);
		var layer;
		var box;
		var i = 0;

		this.HideTips();

		if (!nodes.length) return;

		layer = document.createElement('div');
		box = root.getBoundingClientRect();

		layer.className = 'elemenx-ribbon-keytips';

		layer.setAttribute('aria-hidden', 'true');

		this.Tips = {Scope: scope, Layer: layer, Typed: '', Items: []};

		while (i < nodes.length) {
			this.Tips.Items.push({Node: nodes[i], Key: keys[i], Badge: this.Badge(layer, nodes[i], keys[i], box)});

			i++;
		}

		root.appendChild(layer);

		this.Leave = function (event) {
			if (!event || !layer.contains(event.composedPath ? event.composedPath()[0] : event.target))
				self.HideTips();
		};

		document.addEventListener('pointerdown', this.Leave, true);
		window.addEventListener('blur', this.Leave);
		window.addEventListener('resize', this.Leave);
	},

	Badge: function (layer, node, key, box) {
		var rect = node.getBoundingClientRect();
		var badge = document.createElement('span');
		var tab = node.classList.contains('elemenx-ribbon-tab') || node.classList.contains('elemenx-ribbon-file');

		badge.className = 'elemenx-ribbon-keytip';
		badge.textContent = key;

		badge.style.left = (rect.left - box.left + rect.width / 2) + 'px';
		badge.style.top = (tab ? rect.bottom - box.top - 6 : rect.bottom - box.top - 10) + 'px';

		layer.appendChild(badge);

		return badge;
	},

	HideTips: function () {
		if (!this.Tips) return;

		if (this.Tips.Layer.parentNode)
			this.Tips.Layer.parentNode.removeChild(this.Tips.Layer);

		this.Tips = null;

		document.removeEventListener('pointerdown', this.Leave, true);
		window.removeEventListener('blur', this.Leave);
		window.removeEventListener('resize', this.Leave);
	},

	/* A key while the tips show: letters narrow them down and run the one they spell, Escape goes back a level. */
	TipKey: function (event) {
		var tips = this.Tips;
		var typed;
		var matches;
		var i = 0;

		if (Elemenx.Locale.Key(event) === 'Escape') {
			event.preventDefault();
			event.stopPropagation();

			if (tips.Typed) this.Narrow('');
			else if (tips.Scope) this.ShowTips(tips.Scope.classList.contains('elemenx-ribbon-group-popup') ? this.Current() : null);
			else this.HideTips();

			return;
		}

		if (Elemenx.Locale.Key(event) === 'Alt' || Elemenx.Locale.Key(event) === 'F10') {
			event.preventDefault();

			this.HideTips();

			return;
		}

		if (Elemenx.Locale.Key(event).length !== 1 || event.ctrlKey || event.metaKey) {
			if (['Shift', 'Control', 'Meta', 'CapsLock'].indexOf(Elemenx.Locale.Key(event)) === -1)
				this.HideTips();

			return;
		}

		event.preventDefault();
		event.stopPropagation();

		typed = tips.Typed + Elemenx.Locale.Key(event).toUpperCase();
		matches = tips.Items.filter(function (item) {
			return item.Key.indexOf(typed) === 0;
		});

		if (!matches.length) return;

		if (matches.length === 1 && matches[0].Key === typed) {
			this.Run(matches[0].Node);

			return;
		}

		while (i < matches.length) {
			if (matches[i].Key === typed) {
				this.Run(matches[i].Node);

				return;
			}

			i++;
		}

		this.Narrow(typed);
	},

	Narrow: function (typed) {
		var items = this.Tips.Items;
		var i = 0;

		this.Tips.Typed = typed;

		while (i < items.length) {
			items[i].Badge.classList.toggle('dim', items[i].Key.indexOf(typed) !== 0);

			i++;
		}
	},

	/* Runs the element of a key tip: a tab opens with the tips of its commands, a shrunk group with the tips inside. */
	Run: function (node) {
		var self = this;
		var group;

		if (node.classList.contains('elemenx-ribbon-tab')) {
			this.HideTips();

			if (this.Collapsed)
				this.Floating = true;

			this.Select(node.getAttribute('data-id'));

			node.focus();

			window.setTimeout(function () {
				self.ShowTips(self.Current());
			}, 0);

			return;
		}

		if (node.classList.contains('elemenx-ribbon-group-toggle')) {
			group = node.closest('.elemenx-ribbon-group');

			this.HideTips();

			node.click();

			window.setTimeout(function () {
				if (group.classList.contains('open'))
					self.ShowTips(group.querySelector('.elemenx-ribbon-group-popup'));
			}, 0);

			return;
		}

		this.HideTips();

		node.focus();

		if (!node.matches('input, textarea, .elemenx-input:not(.elemenx-select-trigger)'))
			node.click();
	}
});
