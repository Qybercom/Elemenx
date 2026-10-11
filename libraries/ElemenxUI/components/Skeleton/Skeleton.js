/* A placeholder while content loads. Shape: text (Lines lines, the last one shorter), rect or circle; Width and Height in CSS units. */
Elemenx.Component('Skeleton', {
	$TemplateURL: 'Skeleton.html',
	Shape: 'text',
	Lines: 3,
	Width: '',
	Height: '',

	$OnCreate: function () {
		this.Rows = function (lines) {
			var rows = [];
			var i = 0;

			while (i < Math.max(1, Number(lines) || 1)) {
				rows.push(i);

				i++;
			}

			return rows;
		};
	}
});