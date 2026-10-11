/*
 * Progress of a task. Value from 0 to Max; null shows an indeterminate progress. Variant: bar or ring.
 * Tone: accent, success, warning or danger. ShowValue prints the percent.
 */
Elemenx.Component('Progress', {
	$TemplateURL: 'Progress.html',
	$StyleURL: 'Progress.css',
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