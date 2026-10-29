/*
 * The declaration of a stage in the template of a Pipeline: <PipelineStage ID="test" Name="Test"> with its
 * PipelineJob inside. It takes the props of a stage of Pipeline (ID, Name, Status: by default the one of its jobs).
 * It shows nothing by itself: Pipeline reads it.
 */
Elemenx.Component('PipelineStage', {
	$TemplateURL: 'PipelineStage.html',
	$Meta: {
		Group: 'data',
		Icon: 'columns',
		Description: 'The declaration of a stage in the template of a Pipeline: <PipelineStage ID="test" Name="Test">.',
		Container: true,
		Children: ['PipelineJob'],
		Props: {
			ID: 'The ID of the stage.',
			Name: 'Its name.',
			Status: 'Its status (by default the one of its jobs).'
		},
		Sample: {ID: 'test', Name: 'Test'}
	},
	ID: '',
	Name: '',
	Status: '',

	$OnCreate: function () {
		this.Declared = function (id, name, status) {
			return JSON.stringify({ID: id, Name: name, Status: status});
		};
	}
});
