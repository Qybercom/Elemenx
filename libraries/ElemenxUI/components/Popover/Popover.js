/*
 * Floating content next to a trigger. Slots: trigger (the anchor: a Button, a link...) and default (the content).
 * Trigger: click (default) or hover. Open may be set by the owner; the toggle event reports every change.
 * Placement: bottom-start, bottom-end, top-start, right-start.
 */
Elemenx.Component('Popover', {
	$TemplateURL: 'Popover.html',
	$StyleURL: 'Popover.css',
	Open: false,
	Trigger: 'click',
	Placement: 'bottom-start',
	Title: '',
	Width: '',
	Timer: null,

	Set: function (open) {
		if (open === this.Open) return;

		this.Open = open;

		this.$Emit('toggle', open);
	},

	Toggle: function () {
		if (this.Trigger === 'click')
			this.Set(!this.Open);
	},

	Enter: function () {
		if (this.Trigger !== 'hover') return;

		window.clearTimeout(this.Timer);

		this.Set(true);
	},

	Leave: function () {
		var self = this;

		if (this.Trigger !== 'hover') return;

		window.clearTimeout(this.Timer);

		this.Timer = window.setTimeout(function () {
			self.Set(false);
		}, 160);
	},

	Key: function (event) {
		if (this.Trigger === 'hover' && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();

			this.Set(!this.Open);
		}
	},

	Dismissed: function (event) {
		var trigger = this.$Element().querySelector('.elemenx-popover-trigger');
		var focusable;

		this.Set(false);

		if (event.detail.Reason !== 'escape') return;

		focusable = trigger.querySelector('button, a, [tabindex]');

		if (focusable)
			focusable.focus();
	}
});