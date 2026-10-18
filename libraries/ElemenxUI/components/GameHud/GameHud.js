/*
 * The frame of a game screen: the scene (the default slot: a canvas, a picture) and the HUD over it, in nine areas
 * named by slots: top-start, top, top-end, start, center, end, bottom-start, bottom, bottom-end. The areas let the
 * pointer through to the scene; their content takes it. Padding is the distance of the areas from the edges. It is as
 * high as its container.
 */
Elemenx.Component('GameHud', {
	$TemplateURL: 'GameHud.html',
	$StyleURL: 'GameHud.css',
	Padding: 16,
	Label: ''
});
