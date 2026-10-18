/*
 * A group of commands of a RibbonTab: <RibbonGroup Title="Clipboard" Icon="paste">. Its commands fill columns of three
 * rows: a large RibbonButton takes a whole column, small buttons and other controls stack three to a column.
 * When the Ribbon is too narrow it shrinks its groups step by step, the lowest Priority first and the rightmost of
 * equal ones: large buttons become small, then the labels go, then the group becomes one button (Icon and Title)
 * that opens its commands in a panel. Launcher adds the small button at the corner of the title that opens the full
 * options of the group: event launch.
 */
Elemenx.Component('RibbonGroup', {
	$TemplateURL: 'RibbonGroup.html',
	Title: '',
	Icon: '',
	KeyTip: '',
	Priority: 0,
	Launcher: false,
	Open: false,

	$OnDestroy: function () {
		this.Listen(false);
	},

	/* The panel of a shrunk group opens under its button, and closes on a press outside, on Escape or on a command. */
	Toggle: function () {
		var self = this;
		var root = this.$Element();
		var button = root.querySelector('.elemenx-ribbon-group-toggle');
		var panel = root.querySelector('.elemenx-ribbon-group-popup');
		var rect = button.getBoundingClientRect();

		this.Open = !this.Open;

		if (!this.Open) {
			this.Listen(false);

			return;
		}

		panel.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 8 - panel.offsetWidth)) + 'px';
		panel.style.top = (rect.bottom + 4) + 'px';

		this.Listen(true);

		window.setTimeout(function () {
			var first = panel.querySelector('button:not([disabled]), input, [tabindex="0"]');
			if (first && self.Open)
				first.focus();
		}, 0);
	},

	Close: function (focus) {
		if (!this.Open) return;

		this.Open = false;

		this.Listen(false);

		if (focus)
			this.$Element().querySelector('.elemenx-ribbon-group-toggle').focus();
	},

	Listen: function (on) {
		var self = this;
		var root;

		if (on && !this.Outside) {
			root = this.$Element();

			this.Outside = function (event) {
				var target = event.composedPath ? event.composedPath()[0] : event.target;
				if (!root.contains(target) && !(target.closest && target.closest('.elemenx-popup')))
					self.Close(false);
			};

			this.Done = function () {
				self.Close(false);
			};

			document.addEventListener('pointerdown', this.Outside, true);
			root.addEventListener('elemenx-ribbon-command', this.Done);
		}

		if (!on && this.Outside) {
			document.removeEventListener('pointerdown', this.Outside, true);
			this.$Element().removeEventListener('elemenx-ribbon-command', this.Done);

			this.Outside = null;
		}
	},

	Key: function (event) {
		if (event.key === 'Escape' && this.Open) {
			event.stopPropagation();

			this.Close(true);
		}
	},

	Launch: function () {
		this.$Emit('launch', {Title: this.Title});
	}
});
