/*
 * A card: media at the edge (Image, or the media slot), a header, a body (Title, Text and the default slot) and a
 * footer (the footer slot, then the actions slot at its end). Variant: outlined (default), elevated, flat or filled
 * (in Color, the accent by default). Orientation: vertical or horizontal (the media beside the content; under it again
 * on a narrow window). Ratio is the shape of the media ('16:9' by default, '1:1', '4:3'...). Href makes the whole card
 * a link (Target), and the buttons inside it stay buttons. Loading shows skeleton lines in place of Title and Text.
 * The cards of the Library (PostCard, ProfileCard, CommentCard, ProductCard, PlanCard) are built the same way.
 */
Elemenx.Component('Card', {
	$TemplateURL: 'Card.html',
	$Meta: {
		Group: 'layout',
		Icon: 'layout',
		Description: 'A card: media at the edge (Image, or the media slot), a header, a body (Title, Text and the default slot) and a footer (the footer slot, then the actions slot at its end).',
		Container: true,
		Slots: ['media', 'header', 'footer', 'actions'],
		Props: {
			Variant: {Options: ['outlined', 'elevated', 'flat', 'filled'], Description: 'Its look: outlined, elevated, flat or filled.'},
			Orientation: {Options: ['vertical', 'horizontal'], Description: 'vertical (the media on top) or horizontal (the media beside the content).'},
			Title: 'The title of the body.',
			Text: 'The text under the title.',
			Image: 'The URL of the picture of the media.',
			Ratio: 'The shape of the media: 16:9, 1:1, 4:3...',
			Color: 'The color of a filled card (the accent by default).',
			Href: 'Makes the whole card a link.',
			Target: 'The target of the link (_blank...).',
			Label: 'The name of the card for screen readers.',
			Loading: 'Shows skeleton lines in place of the title and the text.'
		},
		Sample: {Variant: 'elevated', Title: 'Mountains', Text: 'The northern range at dawn.', Ratio: '16:9'}
	},
	Variant: 'outlined',
	Orientation: 'vertical',
	Title: '',
	Text: '',
	Image: '',
	ImageAlt: '',
	Ratio: '',
	Color: '',
	Href: '',
	Target: '',
	Label: '',
	Loading: false
});
