/*
 * A centered page for sign-in forms, errors and empty states, built on elemenx-screen and elemenx-column.
 * Slots: brand (above the content), default (the content), actions (buttons under it), footer (at the bottom).
 * Icon, Code, Title and Description draw a standard state (Code is a large number such as 404).
 * Width: small (360px), medium (480px) or large (640px). Card puts the content on a surface.
 */
Elemenx.Component('Centered', {
	$TemplateURL: 'Centered.html',
	$StyleURL: 'Centered.css',
	Icon: '',
	Code: '',
	Title: '',
	Description: '',
	Width: 'medium',
	Card: false
});