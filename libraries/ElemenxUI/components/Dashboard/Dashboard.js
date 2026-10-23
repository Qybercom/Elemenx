/*
 * A dashboard layout built on elemenx-screen, elemenx-container and elemenx-column.
 * Slots: nav (the sidebar, often a NavList), header, default (the content: a responsive grid of DashboardWidget
 * elements; any element with the class elemenx-dashboard-wide takes a full row), footer.
 * An area shows only while its slot renders something; the sidebar narrows by itself around a collapsed NavList.
 */
Elemenx.Component('Dashboard', {
	$TemplateURL: 'Dashboard.html',
	$StyleURL: 'Dashboard.css',
	$Meta: {
		Group: 'layout',
		Icon: 'grid',
		Description: 'A dashboard layout built on elemenx-screen, elemenx-container and elemenx-column.',
		Container: true,
		Slots: ['nav', 'header', 'footer']
	}
});