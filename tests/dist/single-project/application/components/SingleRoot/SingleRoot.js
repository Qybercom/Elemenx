/* The root of the single-file fixture: ElemenxUI components, an image next to the page and a worker. */
Elemenx.Component('SingleRoot', {
	$TemplateURL: 'SingleRoot.html',
	$StyleURL: 'SingleRoot.css',
	Clicks: 0,
	Worker: 'Stopped',

	Clicked: function () {
		this.Clicks++;
	},

	StartWorker: function () {
		var self = this;
		var worker = Elemenx.WebWorker('SingleWorker', {Script: 'worker.js', StartMode: 'manual'});

		worker.On('Running', function () {
			self.Worker = 'Running';
		});

		worker.Start();
	}
});
