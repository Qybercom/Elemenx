/*
 * *modal="Open" opens a <dialog> element as a modal (showModal: top layer, the rest of the page inert) while the
 * expression is truthy and closes it otherwise. Escape and a press on the backdrop dispatch "dismiss" with
 * {Reason: 'escape'} or {Reason: 'backdrop'}; the owner closes the dialog. The focus returns to where it was.
 */
Elemenx.Directive('modal', {
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Open = false;

		data.Dismiss = function (reason) {
			element.dispatchEvent(new CustomEvent('dismiss', {detail: {Reason: reason}}));
		};

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
			data.Return = document.activeElement;

			if (!element.open && element.showModal)
				element.showModal();

			return;
		}

		if (element.open)
			element.close();

		if (data.Return && data.Return.focus && document.contains(data.Return))
			data.Return.focus();

		data.Return = null;
	},

	$OnDestroy: function (context) {
		context.Element.removeEventListener('cancel', context.Data.Cancel);
		context.Element.removeEventListener('mousedown', context.Data.Press);

		if (context.Element.open)
			context.Element.close();
	}
});