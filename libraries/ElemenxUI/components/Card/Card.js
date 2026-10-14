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
