/*
 * DemoQuality: the quality of the scenes of all the demos, one for them: kept in the browser between visits (Read), told
 * to the page as it is chosen (Choose: the window event scene-demo-quality, its detail the quality), the choices (List).
 * Regression: the frame of the page (DemoFrame) and the demos (SceneDemo) each kept it and told it by a code of their own.
 */
Elemenx.Service('DemoQuality', {
	Key: 'ui-kit-quality',
	List: [{Value: 'auto', Label: 'Auto'}, {Value: 'low', Label: 'Low'}, {Value: 'medium', Label: 'Medium'}, {Value: 'high', Label: 'High'}, {Value: 'ultra', Label: 'Ultra'}],

	Read: function () {
		try {
			return window.localStorage.getItem(this.Key) || 'auto';
		}
		catch (error) {
			return 'auto';
		}
	},

	Choose: function (value) {
		var quality = String(value || 'auto');

		try {
			window.localStorage.setItem(this.Key, quality);
		}
		catch (error) {
			quality = String(quality);
		}

		window.dispatchEvent(new CustomEvent('scene-demo-quality', {detail: quality}));
	}
});
