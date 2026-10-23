/*
 * The progress of a task. Value from 0 to Max (100); null shows a progress that does not know its end (a moving bar,
 * a turning ring). Variant: bar or ring. Tone: accent, success, warning or danger. Label names it (shown above a bar,
 * read by screen readers); ShowValue prints the percent. Size: small, medium or large.
 */
Elemenx.Component('Progress', {
	$TemplateURL: 'Progress.html',
	$StyleURL: 'Progress.css',
	$Meta: {
		Group: 'display',
		Icon: 'loader',
		Description: 'The progress of a task.',
		Props: {
			Value: 'The progress from 0 to Max; null for a progress that does not know its end.',
			Max: 'The end.',
			Variant: {Options: ['bar', 'ring'], Description: 'bar or ring.'},
			Tone: {Options: ['accent', 'success', 'warning', 'danger'], Description: 'accent, success, warning or danger.'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'},
			Label: 'The name of the task (above a bar).',
			ShowValue: 'Prints the percent.'
		},
		Sample: {Label: 'Upload', ShowValue: true}
	},
	Value: null,
	Max: 100,
	Variant: 'bar',
	Tone: 'accent',
	Size: 'medium',
	Label: '',
	ShowValue: false,

	$OnCreate: function () {
		this.Percent = function (value, max) {
			if (value === null || value === '' || isNaN(value)) return null;

			return Math.max(0, Math.min(100, Number(value) / (Number(max) || 100) * 100));
		};
	}
});