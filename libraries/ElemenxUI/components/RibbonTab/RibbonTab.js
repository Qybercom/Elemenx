/*
 * A tab of a Ribbon: <RibbonTab ID="home" Title="Home"> with RibbonGroup children. KeyTip names its key tip (a letter
 * of the Title by default). Contextual makes it a tab that shows with its object (put *if on it), in its Color, with
 * Context as its caption ('Table tools'). The Ribbon reads it and shows its panel while it is the current tab.
 */
Elemenx.Component('RibbonTab', {
	$TemplateURL: 'RibbonTab.html',
	$Meta: {
		Group: 'navigation',
		Icon: 'menu',
		Description: 'A tab of a Ribbon: <RibbonTab ID="home" Title="Home"> with RibbonGroup children.',
		Container: true,
		Props: {
			ID: 'The ID of the tab.',
			Title: 'The title of the tab.',
			KeyTip: 'The letter of its key tip.',
			Contextual: 'A tab that shows with its object (put *if on it).',
			Context: 'The caption of a contextual tab (Table tools).',
			Color: 'The color of a contextual tab.',
			Disabled: 'Turns it off: it takes no input and looks so.'
		},
		Sample: {ID: 'home', Title: 'Home', KeyTip: 'H'}
	},
	ID: '',
	Title: '',
	KeyTip: '',
	Contextual: false,
	Context: '',
	Color: '',
	Disabled: false
});
