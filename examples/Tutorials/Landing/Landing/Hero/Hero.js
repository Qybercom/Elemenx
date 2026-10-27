/* The first screen: what the product is, in one sentence, and the two ways on. */
Elemenx.Component('Hero', {
	$TemplateURL: 'Hero.html',
	$StyleURL: 'Hero.css',
	Title: 'Notes that think with you',
	Text: 'Notely links your notes, finds what you forgot and works without the network.',

	Start: function () {
		document.getElementById('signup').scrollIntoView({behavior: 'smooth'});
	},

	Tour: function () {
		this.$Service('Toast').Show({Title: 'A tour is on its way', Message: 'Sign up and we send you the video.', Variant: 'info'});
	}
});
