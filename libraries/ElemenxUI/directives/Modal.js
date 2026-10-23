/*
 * *modal="Open" opens a <dialog> element as a modal while the expression is truthy and closes it otherwise. It shows
 * in the top layer, over everything, with its backdrop (a popover of the browser, opened at once whatever the size of
 * the page: showModal makes the whole page inert, which costs a long pause on a large page). It is a modal all the
 * same: aria-modal tells the readers of the screen, the backdrop takes the pointer, Tab and Shift+Tab go round inside
 * it, and the focus goes into it when it opens ([autofocus], or its first control) and back to where it was when it
 * closes. Escape and a press on the backdrop dispatch "dismiss" with {Reason: 'escape'} or {Reason: 'backdrop'}; the
 * owner closes the dialog. The dialog on top of several takes the keys. The backdrop of a popover lets the pointer
 * through, so a layer of the directive (elemenx-modal-shade, in the top layer under the dialog) takes the presses
 * outside the dialog.
 */
Elemenx.Directive('modal', {
	$Meta: {
		Description: '*modal="Open" opens a <dialog> element as a modal while the expression is truthy and closes it otherwise.'
	},
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Open = false;

		element.setAttribute('popover', 'manual');
		element.setAttribute('aria-modal', 'true');

		/* The layer under the dialog that takes the presses outside it: a press there is a press on the backdrop. */
		data.Shade = document.createElement('div');
		data.Shade.className = 'elemenx-modal-shade';

		data.Shade.setAttribute('popover', 'manual');
		data.Shade.setAttribute('aria-hidden', 'true');

		data.Pressed = function (event) {
			event.preventDefault();

			data.Dismiss('backdrop');
		};

		data.Shade.addEventListener('mousedown', data.Pressed);

		data.Dismiss = function (reason) {
			element.dispatchEvent(new CustomEvent('dismiss', {detail: {Reason: reason}}));
		};

		/* The cancel event (Escape of the browser, B of a gamepad): a dismiss, never a close of its own. */
		data.Cancel = function (event) {
			event.preventDefault();

			data.Dismiss('escape');
		};

		/* A press on the dialog element itself, outside its content box, is a press on the backdrop. */
		data.Press = function (event) {
			var rect;

			if (event.target !== element) return;

			rect = element.getBoundingClientRect();

			if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
				data.Dismiss('backdrop');
		};

		/* The controls of the dialog the focus may go to, as they show. */
		data.Controls = function () {
			return Array.prototype.filter.call(element.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'), function (control) {
				return !control.closest('[hidden], [inert]') && control.getClientRects().length > 0;
			});
		};

		/* Whether this dialog is the one on top of the open ones. */
		data.Top = function () {
			var top = null;

			Array.prototype.forEach.call(document.querySelectorAll('[data-elemenx-modal]'), function (open) {
				if (!top || Number(open.getAttribute('data-elemenx-modal')) > Number(top.getAttribute('data-elemenx-modal')))
					top = open;
			});

			return top === element;
		};

		/* The keys of the dialog on top: Escape dismisses it, Tab goes round inside it. */
		data.Key = function (event) {
			var controls;
			var first;
			var last;
			var active;

			if (!data.Open || !data.Top() || event.defaultPrevented) return;

			if (event.key === 'Escape') {
				event.preventDefault();

				data.Dismiss('escape');

				return;
			}

			if (event.key !== 'Tab') return;

			controls = data.Controls();
			first = controls[0];
			last = controls[controls.length - 1];
			active = element.getRootNode().activeElement;

			if (!first) {
				event.preventDefault();

				element.focus();

				return;
			}

			if (!element.contains(active) || event.shiftKey && (active === first || active === element) || !event.shiftKey && active === last) {
				event.preventDefault();

				(event.shiftKey ? last : first).focus();
			}
		};

		/* The focus that wanders out of the dialog on top (a press of the page behind, a script) comes back to it. */
		data.Focus = function (event) {
			if (data.Open && data.Top() && !element.contains(event.target))
				data.Enter();
		};

		/* The focus goes into the dialog: [autofocus], its first control, or the dialog itself. */
		data.Enter = function () {
			var target = element.querySelector('[autofocus]') || data.Controls()[0];

			if (!target) {
				if (!element.hasAttribute('tabindex'))
					element.setAttribute('tabindex', '-1');

				target = element;
			}

			target.focus();
		};

		/* A dialog rendered open (by a *for, an *if) joins the page a moment after: it opens then. */
		data.Show = function () {
			if (!data.Open || element.hasAttribute('data-elemenx-modal')) return;

			if (!element.isConnected) {
				window.setTimeout(data.Show, 0);

				return;
			}

			window.ElemenxModals = (window.ElemenxModals || 0) + 1;

			element.setAttribute('data-elemenx-modal', String(window.ElemenxModals));

			if (element.showPopover) {
				element.parentNode.insertBefore(data.Shade, element);

				data.Shade.showPopover();
				element.showPopover();
			}

			element.setAttribute('open', '');

			document.addEventListener('keydown', data.Key);
			document.addEventListener('focusin', data.Focus, true);

			data.Enter();
		};

		data.Hide = function () {
			document.removeEventListener('keydown', data.Key);
			document.removeEventListener('focusin', data.Focus, true);

			element.removeAttribute('data-elemenx-modal');
			element.removeAttribute('open');

			if (element.hidePopover && element.matches(':popover-open'))
				element.hidePopover();

			if (data.Shade.parentNode) {
				if (data.Shade.matches(':popover-open'))
					data.Shade.hidePopover();

				data.Shade.parentNode.removeChild(data.Shade);
			}
		};

		element.addEventListener('cancel', data.Cancel);
		element.addEventListener('mousedown', data.Press);
	},

	$OnUpdate: function (context) {
		var element = context.Element;
		var data = context.Data;
		var open = !!context.Value;
		if (open === data.Open) return;

		data.Open = open;

		if (open) {
			data.Return = element.getRootNode().activeElement;

			data.Show();

			return;
		}

		data.Hide();

		if (data.Return && data.Return.focus && document.contains(data.Return))
			data.Return.focus();

		data.Return = null;
	},

	/* Asleep (Elemenx.Cache keeps it out of the page) an open dialog leaves the top layer and lets the page go; awake it comes back. */
	$OnSleep: function (context) {
		if (context.Data.Open)
			context.Data.Hide();
	},

	$OnWake: function (context) {
		if (context.Data.Open)
			context.Data.Show();
	},

	$OnDestroy: function (context) {
		context.Element.removeEventListener('cancel', context.Data.Cancel);
		context.Element.removeEventListener('mousedown', context.Data.Press);
		context.Data.Shade.removeEventListener('mousedown', context.Data.Pressed);

		context.Data.Open = false;

		context.Data.Hide();
	}
});
