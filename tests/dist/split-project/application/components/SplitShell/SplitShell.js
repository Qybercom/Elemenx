/* The shell: a link to each route, and the place of the pages. */
Elemenx.Component('SplitShell', {
	$Template: '<div class="split-shell"><nav><a class="to-home" href="/">Home</a> <a class="to-about" href="/about">About</a></nav><main *outlet="Content"></main></div>'
});
