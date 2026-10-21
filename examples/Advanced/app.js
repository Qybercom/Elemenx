Elemenx.Application('ApplicationExample', {
	$Title: 'Elemenx advanced application example',
	$Component: 'Layout',
	$Root: 'application',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Bootstrap: function () {
		/* Keep-alive where the templates ask for it (*keep, $KeepAlive): the panel of the Keep-alive section of the UI Kit. */
		Elemenx.Cache({Instances: {Scope: 'marked'}});

		this.$ShowcaseStartup = {
			BootstrapAt: new Date(),
			Pending: 0,
			Ready: 0,
			Error: 0,
			LastError: null,
			Listener: null
		};
	},
	$OnPending: function () {
		this.$ShowcaseStartup.Pending++;

		if (this.$ShowcaseStartup.Listener)
			this.$ShowcaseStartup.Listener();
	},
	$OnReady: function () {
		this.$ShowcaseStartup.Ready++;

		if (this.$ShowcaseStartup.Listener)
			this.$ShowcaseStartup.Listener();
	},
	$OnError: function (args) {
		this.$ShowcaseStartup.Error++;
		this.$ShowcaseStartup.LastError = args && args.Error ? args.Error : null;

		if (this.$ShowcaseStartup.Listener)
			this.$ShowcaseStartup.Listener();
	},
	$Router: {
		Waiting: 'PageLoading',
		NotFound: 'PageNotFound',
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/ui', Component: 'UIKitPage'},
			{Path: '/authorized', Component: 'AuthorizedPage', Guard: 'Authorized', GuardFailed: 'LoginRequired'},
			{Path: '/redirect-protected', Component: 'RedirectProtectedPage', Guard: 'AuthorizedRedirect'},
			{Path: '/router/:id', Component: 'RouterLabPage'},
			{Path: '/async-guard', Component: 'AsyncGuardedPage', Guard: 'DelayedAccess', Waiting: 'PageLoading'},
			{Path: '/leave-guard', Component: 'LeaveGuardPage'},
			{
				Path: '/project/:id',
				Component: 'ProjectPage',
				Guards: ['Authorized', 'ProjectAccess'],
				GuardFailed: {
					Authorized: 'LoginRequired',
					ProjectAccess: 'AccessDenied'
				},
				Waiting: 'PageLoading'
			}
		]
	}
});