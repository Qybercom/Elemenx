/*
 * The people of a title: its cast and its crew, Items [{ID, Name, Role, Image, Href}], each a photo (an Avatar of the
 * name without one, or while it loads) with the name and the role under it. Layout row scrolls across (a shelf of
 * people), grid fills the lines, list puts them one under another. Title names the list. A press opens a person (the
 * open event); the arrow keys go from one to the next.
 */
Elemenx.Component('CastList', {
	$TemplateURL: 'CastList.html',
	$StyleURL: 'CastList.css',
	$Meta: {
		Group: 'media',
		Icon: 'users',
		Description: 'The cast and the crew of a title: photos, names and roles, in a row, a grid or a list.',
		Events: {
			open: 'A person was pressed: the item.'
		},
		Props: {
			Items: 'The people: [{ID, Name, Role, Image, Href}].',
			Title: 'The name of the list.',
			Layout: {Options: ['row', 'grid', 'list'], Description: 'row (scrolls across), grid or list.'},
			Label: 'The name of the list for screen readers, without a Title.'
		},
		Sample: {Title: 'Cast', Items: [{ID: 'a', Name: 'Ada Lovelace', Role: 'Captain'}, {ID: 'b', Name: 'Alan Turing', Role: 'Engineer'}, {ID: 'c', Name: 'Grace Hopper', Role: 'Navigator'}]}
	},
	Items: [],
	Title: '',
	Layout: 'row',
	Label: '',

	PersonOf: function (event) {
		var node = event.target.closest('[data-person]');
		var id = node ? node.getAttribute('data-person') : null;

		return (this.Items || []).filter(function (person) {
			return String(person.ID) === id;
		})[0] || null;
	},

	Pressed: function (event) {
		var person = this.PersonOf(event);
		if (person)
			this.$Emit('open', person);
	},

	Key: function (event) {
		var people = Array.prototype.slice.call(this.$Element().querySelectorAll('.elemenx-cast-person'));
		var index = people.indexOf(event.target);
		var key = Elemenx.Locale.Key(event);
		var forward = this.Layout === 'list' ? 'ArrowDown' : 'ArrowRight';
		var back = this.Layout === 'list' ? 'ArrowUp' : 'ArrowLeft';
		var next = null;

		if (index === -1) return;

		if (key === 'Enter' || key === ' ') this.Pressed(event);
		else if (key === forward) next = people[index + 1];
		else if (key === back) next = people[index - 1];
		else return;

		event.preventDefault();

		if (next) {
			next.focus();
			next.scrollIntoView({block: 'nearest', inline: 'nearest'});
		}
	}
});
