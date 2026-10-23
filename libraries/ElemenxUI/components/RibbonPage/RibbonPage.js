/*
 * A page of a RibbonBackstage: <RibbonPage ID="open" Title="Open" Icon="folder-open"> with its content. A page with
 * Command is not a page but a command in the list of the backstage (Save, Print): it runs (command event of the
 * Ribbon) and closes the backstage.
 */
Elemenx.Component('RibbonPage', {
	$TemplateURL: 'RibbonPage.html',
	$Meta: {
		Group: 'navigation',
		Icon: 'menu',
		Description: 'A page of a RibbonBackstage: <RibbonPage ID="open" Title="Open" Icon="folder-open"> with its content.',
		Container: true,
		Props: {
			ID: 'The ID of the page.',
			Title: 'The title in the list of the backstage.',
			Icon: 'The icon in the list.',
			Command: 'A command in the list (Save, Print), not a page.'
		},
		Sample: {ID: 'info', Title: 'Info', Icon: 'info'}
	},
	ID: '',
	Title: '',
	Icon: '',
	Command: false
});
