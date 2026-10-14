/*
 * A tab of a Ribbon: <RibbonTab ID="home" Title="Home"> with RibbonGroup children. KeyTip names its key tip (a letter
 * of the Title by default). Contextual makes it a tab that shows with its object (put *if on it), in its Color, with
 * Context as its caption ('Table tools'). The Ribbon reads it and shows its panel while it is the current tab.
 */
Elemenx.Component('RibbonTab', {
	$TemplateURL: 'RibbonTab.html',
	ID: '',
	Title: '',
	KeyTip: '',
	Contextual: false,
	Context: '',
	Color: '',
	Disabled: false
});
