/*
 * *copy="text" copies text when the element is clicked (or *copy="{Text, Toast}": Toast true or a message shows a
 * toast). For a moment after the copy the element has the class copied and data-copied="true" (a check icon in a
 * Button, for example). Uses the Clipboard Service. The element dispatches "copied" with {Text, Error}.
 */
Elemenx.Directive('copy', {
	$Meta: {
		Description: '*copy="text" copies text when the element is clicked (or *copy="{Text, Toast}": Toast true or a message shows a toast).'
	},
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Click = function () {
			var options = data.Options || {};

			context.Component.$Service('Clipboard').Copy(options.Text, function (error, text) {
				if (!error) {
					element.classList.add('copied');
					element.setAttribute('data-copied', 'true');

					window.clearTimeout(data.Timer);

					data.Timer = window.setTimeout(function () {
						element.classList.remove('copied');
						element.removeAttribute('data-copied');
					}, 1500);
				}

				element.dispatchEvent(new CustomEvent('copied', {detail: {Text: text, Error: error}}));
			}, {Toast: options.Toast});
		};

		element.addEventListener('click', data.Click);
	},

	$OnUpdate: function (context) {
		var value = context.Value;

		context.Data.Options = value && typeof value === 'object' ? value : {Text: value};
	},

	$OnDestroy: function (context) {
		context.Element.removeEventListener('click', context.Data.Click);

		window.clearTimeout(context.Data.Timer);
	}
});
