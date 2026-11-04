/*
 * *blur makes an element a surface of frosted glass: what is behind it blurred (backdrop-filter) and seen through the
 * tint of the surface of the theme. *blur alone takes the tokens of the theme (--elemenx-blur-radius, -saturate,
 * -tint); *blur="12" blurs 12 pixels; *blur="{Radius: 24, Saturate: 1.4, Tint: 0.5}" sets each (Saturate: 1 keeps the
 * colors, Tint: 0 clear glass, 1 the surface itself). Where the browser cannot blur, or the reader asks for less
 * transparency (prefers-reduced-transparency), the element has the surface, solid. The class is elemenx-blur.
 */
Elemenx.Directive('blur', {
	$Meta: {
		Description: '*blur makes an element a surface of frosted glass: what is behind it blurred and seen through the tint of the surface.'
	},
	$OnUpdate: function (context) {
		var element = context.Element;
		var value = context.Value;
		var settings = value && typeof value === 'object' ? value : {Radius: value};
		var radius = Number(settings.Radius);
		var saturate = Number(settings.Saturate);
		var tint = Number(settings.Tint);

		element.classList.add('elemenx-blur');

		if (settings.Radius !== undefined && settings.Radius !== null && settings.Radius !== '' && settings.Radius !== true && isFinite(radius)) element.style.setProperty('--elemenx-blur-radius', Math.max(0, radius) + 'px');
		else element.style.removeProperty('--elemenx-blur-radius');

		if (settings.Saturate !== undefined && isFinite(saturate)) element.style.setProperty('--elemenx-blur-saturate', Math.max(0, saturate) * 100 + '%');
		else element.style.removeProperty('--elemenx-blur-saturate');

		if (settings.Tint !== undefined && isFinite(tint)) element.style.setProperty('--elemenx-blur-tint', String(Math.max(0, Math.min(1, tint))));
		else element.style.removeProperty('--elemenx-blur-tint');
	},

	$OnDestroy: function (context) {
		context.Element.classList.remove('elemenx-blur');
		context.Element.style.removeProperty('--elemenx-blur-radius');
		context.Element.style.removeProperty('--elemenx-blur-saturate');
		context.Element.style.removeProperty('--elemenx-blur-tint');
	}
});
