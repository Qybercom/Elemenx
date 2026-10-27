/*
 * Sections that fold, one under the other: the Sections inside it (Collapsible). Exclusive (true by default) keeps one
 * open at a time: opening a section folds the others, each with its own toggle event. Bordered draws them as one block
 * with lines between them.
 */
Elemenx.Component('Accordion', {
	$TemplateURL: 'Accordion.html',
	$StyleURL: 'Accordion.css',
	$Meta: {
		Group: 'layout',
		Icon: 'list',
		Description: 'Sections that fold, one under the other: the Sections inside it.',
		Container: true,
		Children: ['Section'],
		Props: {
			Exclusive: 'Keeps one section open at a time.',
			Bordered: 'Draws the sections as one block with lines between them.',
			Label: 'The name of the group for screen readers.'
		}
	},
	Exclusive: true,
	Bordered: true,
	Label: '',

	/* A section of this accordion was unfolded: with Exclusive, the others fold, by their own toggles. */
	Clicked: function (event) {
		var root = this.$Element();
		var toggle = event.target && event.target.closest ? event.target.closest('.elemenx-section-toggle') : null;
		if (!toggle || toggle.closest('.elemenx-accordion') !== root || toggle.getAttribute('aria-expanded') !== 'true') return;
		if (!this.Exclusive || this.Exclusive === 'false') return;

		Array.prototype.forEach.call(root.querySelectorAll('.elemenx-section-toggle[aria-expanded="true"]'), function (other) {
			if (other !== toggle && other.closest('.elemenx-accordion') === root)
				other.click();
		});
	}
});
