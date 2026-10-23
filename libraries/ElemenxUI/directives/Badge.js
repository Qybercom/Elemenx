/*
 * *badge="value" puts a badge over the corner of any element: an item of a toolbar, of a list, a picture. The value is
 * read by the Badges Service: a number (a count), 'dot' (something new), 'busy' (a task that runs: a ring that turns),
 * another text, or {Value, Tone, Max, Label}; a false or an empty value shows none. The element keeps its layout (it
 * is positioned, unless it is already). A Button takes its badge by its own Badge.
 */
Elemenx.Directive('badge', {
	$Meta: {
		Description: '*badge="value" puts a badge over the corner of any element: an item of a toolbar, of a list, a picture.'
	},
	$OnCreate: function (context) {
		context.Data.Badge = document.createElement('span');
		context.Data.Badge.hidden = true;

		context.Element.classList.add('elemenx-badged');
		context.Element.appendChild(context.Data.Badge);
	},

	$OnUpdate: function (context) {
		var element = context.Data.Badge;
		var badge = context.Component.$Service('Badges').Describe(context.Value);
		var seen = document.createElement('span');
		var said = document.createElement('span');

		element.hidden = !badge.Shown;
		element.className = context.Component.$Service('Badges').Classes(context.Value).join(' ');

		/* The text shown, and what a screen reader says instead when there is a Label (a dot and a ring have one). */
		seen.textContent = badge.Text;
		said.className = 'elemenx-visually-hidden';
		said.textContent = badge.Label;

		if (badge.Label)
			seen.setAttribute('aria-hidden', 'true');

		element.textContent = '';

		element.appendChild(seen);

		if (badge.Label)
			element.appendChild(said);
	},

	$OnDestroy: function (context) {
		var element = context.Data.Badge;
		if (element.parentNode)
			element.parentNode.removeChild(element);

		context.Element.classList.remove('elemenx-badged');
	}
});
