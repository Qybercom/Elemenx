/*
 * A row of actions for the header of a Workspace or any bar: buttons, menus, fields, separators
 * (<span class="elemenx-divider vertical"></span>) and spacers (<span class="elemenx-spacer"></span>) that push what
 * follows to the end. Vertical stands it upright. Label names it for screen readers (role toolbar).
 */
Elemenx.Component('WorkspaceToolbar', {
	$TemplateURL: 'WorkspaceToolbar.html',
	$StyleURL: 'WorkspaceToolbar.css',
	Label: '',
	Vertical: false
});