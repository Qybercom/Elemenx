Elemenx.Component('ProjectShowcase', {
	TemplateURL: 'ProjectShowcase.html',

	ElemenxOnCreate: function () {
		this.State.Projects = [
			{
				id: 'graphene',
				name: 'Graphene',
				description: 'Private networking platform',
				Environments: [
					{
						id: 'production',
						name: 'Production',
						Services: [
							{id: 'coordinator', name: 'Coordinator', online: true, protected: true},
							{id: 'gateway', name: 'Gateway', online: true, protected: false},
							{id: 'telemetry', name: 'Telemetry', online: false, protected: true}
						]
					},
					{
						id: 'staging',
						name: 'Staging',
						Services: [
							{id: 'coordinator', name: 'Coordinator', online: true, protected: false}
						]
					}
				]
			},
			{
				id: 'ephyrx',
				name: 'EphyrX',
				description: 'Media delivery platform',
				Environments: [
					{id: 'preview', name: 'Preview', Services: []}
				]
			}
		];
	}
});