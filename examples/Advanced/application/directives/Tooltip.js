Elemenx.Directive('tooltip', {
	$OnCreate: function (context) {
		var tooltip = document.createElement('span');
		var show = function () {
			var rect = context.Element.getBoundingClientRect();

			tooltip.style.left = (rect.left + rect.width / 2) + 'px';
			tooltip.style.top = (rect.top - 10) + 'px';

			tooltip.classList.add('directive-tooltip-visible');
		};
		var hide = function () {
			tooltip.classList.remove('directive-tooltip-visible');
		};

		tooltip.className = 'directive-tooltip';

		document.body.appendChild(tooltip);

		context.Data.Tooltip = tooltip;
		context.Data.Show = show;
		context.Data.Hide = hide;

		context.Element.addEventListener('mouseenter', show);
		context.Element.addEventListener('mouseleave', hide);
		context.Element.addEventListener('focus', show);
		context.Element.addEventListener('blur', hide);
	},

	$OnUpdate: function (context) {
		context.Data.Tooltip.textContent = context.Value || '';
	},

	$OnDestroy: function (context) {
		context.Element.removeEventListener('mouseenter', context.Data.Show);
		context.Element.removeEventListener('mouseleave', context.Data.Hide);
		context.Element.removeEventListener('focus', context.Data.Show);
		context.Element.removeEventListener('blur', context.Data.Hide);

		if (context.Data.Tooltip.parentNode)
			context.Data.Tooltip.parentNode.removeChild(context.Data.Tooltip);
	}
});