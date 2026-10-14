/*
 * A page of a RibbonBackstage: <RibbonPage ID="open" Title="Open" Icon="folder-open"> with its content. A page with
 * Command is not a page but a command in the list of the backstage (Save, Print): it runs (command event of the
 * Ribbon) and closes the backstage.
 */
Elemenx.Component('RibbonPage', {
	$TemplateURL: 'RibbonPage.html',
	ID: '',
	Title: '',
	Icon: '',
	Command: false
});
