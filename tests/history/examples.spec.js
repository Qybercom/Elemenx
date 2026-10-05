import { test, expect } from '@playwright/test';

function captureErrors (page) {
	var errors = [];

	page.on('pageerror', function (error) {
		errors.push(error.message);
	});

	page.on('console', function (message) {
		if (message.type() === 'error')
			errors.push(message.text());
	});

	return errors;
}

async function expectBootstrapVisible (locator, errors) {
	var deadline = Date.now() + 5000;

	while (Date.now() < deadline) {
		if (errors.length)
			throw new Error('Elemenx bootstrap failed:\n' + errors.join('\n'));

		if (await locator.isVisible()) return;

		await new Promise(function (resolve) {
			setTimeout(resolve, 50);
		});
	}

	if (errors.length)
		throw new Error('Elemenx bootstrap failed:\n' + errors.join('\n'));

	await expect(locator).toBeVisible({timeout: 0});
}

test('official Simple example runs state, events and persistent storage end to end', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4273/examples/Simple/');
	await expect(page.getByRole('heading', {name: 'Hello from Elemenx'})).toBeVisible();
	await expect(page.locator('.counter-value')).toHaveText('0');
	await page.getByRole('button', {name: 'Increment'}).click();
	await expect(page.locator('.counter-value')).toHaveText('1');

	await page.getByRole('button', {name: /theme$/}).click();
	await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
	await page.reload();
	await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
	await expect(page.getByRole('button', {name: 'Dark theme'})).toBeVisible();

	expect(errors).toEqual([]);
});

test('official Advanced example executes a real Network XHR lifecycle', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Network XHR'}), errors);
	await page.getByRole('button', {name: 'Run XHR request'}).click();
	await expect(page.getByText('Elemenx Network is online', {exact: true})).toBeVisible();
	await expect(page.getByText('Success', {exact: true})).toBeVisible();
	await expect(page.locator('.network-xhr-events')).toContainText('BeforeRequest');
	await expect(page.locator('.network-xhr-events')).toContainText('BeforeResponse');
	await expect(page.locator('.network-xhr-events')).toContainText('Success');

	expect(errors).toEqual([]);
});

test('official Advanced example receives a real SSE stream through Protocol', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Network SSE · live server events'}), errors);
	await page.getByRole('button', {name: 'Open SSE stream'}).click();
	await expect(page.locator('.sse-status')).toHaveText('Completed');
	await expect(page.getByText('3 / 3', {exact: true})).toBeVisible();
	await expect(page.locator('.network-sse-events')).toContainText('BeforeConnect');
	await expect(page.locator('.network-sse-events')).toContainText('Open');
	await expect(page.locator('.network-sse-events')).toContainText('Data');
	await expect(page.locator('.network-sse-events')).toContainText('Close');
	await expect(page.getByText('Elemenx SSE event #3 · id 3', {exact: true})).toBeVisible();

	expect(errors).toEqual([]);
});

test('official Advanced example runs a real LongPolling request loop through Protocol', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Network LongPolling · held request loop'}), errors);
	await page.getByRole('button', {name: 'Start LongPolling'}).click();
	await expect(page.locator('.longpolling-status')).toHaveText('Completed');
	await expect(page.locator('.network-longpolling-showcase').getByText('3 / 3', {exact: true})).toBeVisible();
	await expect(page.locator('.network-longpolling-events')).toContainText('BeforeConnect');
	await expect(page.locator('.network-longpolling-events')).toContainText('BeforeRequest');
	await expect(page.locator('.network-longpolling-events')).toContainText('BeforeResponse');
	await expect(page.locator('.network-longpolling-events')).toContainText('Data');
	await expect(page.locator('.network-longpolling-events')).toContainText('AfterResponse');
	await expect(page.locator('.network-longpolling-events')).toContainText('Close');
	await expect(page.getByText('Elemenx LongPolling event #3', {exact: true})).toBeVisible();

	expect(errors).toEqual([]);
});

test('official Advanced example consumes one real chunked HTTP Stream through Protocol', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Network Stream · chunked HTTP response'}), errors);
	await page.getByRole('button', {name: 'Open HTTP stream'}).click();
	await page.getByRole('button', {name: 'Open HTTP stream'}).click();
	await page.getByRole('button', {name: 'Open HTTP stream'}).click();
	await expect(page.locator('.stream-status')).toHaveText('Completed');
	await expect(page.locator('.network-stream-showcase').getByText('3 / 3', {exact: true})).toBeVisible();
	await expect(page.locator('.network-stream-events')).toContainText('BeforeConnect');
	await expect(page.locator('.network-stream-events')).toContainText('Open');
	await expect(page.locator('.network-stream-events')).toContainText('Data');
	await expect(page.locator('.network-stream-events')).toContainText('End');
	await expect(page.getByText('Elemenx Stream packet #3 · sequence 3', {exact: true})).toBeVisible();

	expect(errors).toEqual([]);
});
test('official Advanced example transfers Quark control and binary chunks over a real local WebRTC DataChannel', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Network WebRTC · Quark + binary DataChannel'}), errors);
	await page.getByRole('button', {name: 'Connect local WebRTC peers'}).click();
	await expect(page.locator('.rtc-status')).toHaveText('Connected', {timeout: 10000});
	await page.getByRole('button', {name: 'Send 512 KiB media transfer'}).click();
	await expect(page.locator('.rtc-received')).toHaveText('524288 bytes · 32 chunks', {timeout: 10000});
	await expect(page.locator('.rtc-ack')).toContainText('ACK 200 · 524288 bytes · 32 chunks');
	await expect(page.locator('.rtc-transfer')).toHaveText('Binary media received over RTCDataChannel');
	await expect(page.locator('.network-webrtc-events')).toContainText('A.BeforeConnect');
	await expect(page.locator('.network-webrtc-events')).toContainText('B.Channel');
	await expect(page.locator('.network-webrtc-events')).toContainText('A.Open');
	await expect(page.locator('.network-webrtc-events')).toContainText('B.Open');

	expect(errors).toEqual([]);
});

test('official Advanced example reports WebRTC Network Metrics automatically', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Network Metrics · automatic WebRTC telemetry'}), errors);
	await page.getByRole('button', {name: 'Connect local WebRTC peers'}).click();
	await expect(page.locator('.rtc-status')).toHaveText('Connected', {timeout: 10000});
	await expect(page.locator('.metrics-status')).toHaveText('Live');
	await page.getByRole('button', {name: 'Send 512 KiB media transfer'}).click();
	await expect(page.locator('.rtc-received')).toHaveText('524288 bytes · 32 chunks', {timeout: 10000});
	await expect(page.locator('.metrics-tx')).not.toHaveText('0 bytes');
	await expect(page.locator('.metrics-rx')).not.toHaveText('0 bytes');

	expect(errors).toEqual([]);
});


test('official Advanced example completes a real Transfer / TransferReceiver roundtrip over WebRTC', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Network Transfer · TransferReceiver over WebRTC'}), errors);
	await page.getByRole('button', {name: 'Connect local WebRTC peers'}).click();
	await expect(page.locator('.rtc-status')).toHaveText('Connected', {timeout: 10000});
	await page.getByRole('button', {name: 'Run Transfer roundtrip'}).click();
	await expect(page.locator('.transfer-status')).toHaveText('Complete', {timeout: 15000});
	await expect(page.locator('.transfer-progress')).toHaveText('1048576 / 1048576 bytes');
	await expect(page.locator('.transfer-receiver-status')).toHaveText('Received');
	await expect(page.locator('.transfer-result')).toHaveText('1048576 bytes received as Blob');
	await expect(page.locator('.network-transfer-events')).toHaveText('Receive');

	expect(errors).toEqual([]);
});
test('official Advanced example moves the same two-file structured object through every Network transport with live Metrics', async ({ page }) => {
	var errors = captureErrors(page);
	var fileA = Buffer.alloc(64 * 1024, 0x41);
	var fileB = Buffer.alloc(96 * 1024, 0x42);
	var results = ['xhr', 'websocket', 'sse', 'longpolling', 'stream', 'webrtc'];
	var i = 0;

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Universal Transfer · two files, every transport'}), errors);
	await page.locator('.network-universal-transfer-showcase input[type=file]').nth(0).setInputFiles({
		name: 'alpha.bin',
		mimeType: 'application/octet-stream',
		buffer: fileA
	});
	await page.locator('.network-universal-transfer-showcase input[type=file]').nth(1).setInputFiles({
		name: 'beta.bin',
		mimeType: 'application/octet-stream',
		buffer: fileB
	});
	await page.getByRole('button', {name: 'Run all transports'}).click();

	while (i < results.length) {
		await expect(page.locator('.universal-' + results[i])).toContainText('Complete · Elemenx structured media object', {timeout: 20000});
		await expect(page.locator('.universal-' + results[i])).toContainText('alpha.bin + beta.bin · 163840 bytes');
		await expect(page.locator('.universal-' + results[i] + '-metrics')).toContainText(/(?:TX|RX)\s+[1-9][0-9.]*\s+(?:bytes|KiB|MiB)/, {timeout: 20000});
		i++;
	}

	expect(errors).toEqual([]);
});

test('official Advanced example exercises stable non-network showcase sections end to end', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Component lifecycle and public methods'}), errors);

	await page.getByRole('button', {name: 'Update()'}).click();
	await expect(page.getByText('Updated through Component.$Update()', {exact: true})).toBeVisible();
	await page.getByRole('button', {name: 'Emit change'}).click();
	await expect(page.locator('.component-lifecycle')).toContainText('Emit change=1');

	await page.getByRole('button', {name: 'Write storage values'}).click();
	await expect(page.locator('.storage-showcase')).toContainText('local value');
	await expect(page.locator('.storage-showcase')).toContainText('session value');

	var structuralProbe = page.locator('.directive-structural-probe');
	var structuralInstance;
	await expect(structuralProbe).toBeVisible();
	structuralInstance = await structuralProbe.textContent();
	await page.getByRole('button', {name: 'Unmount structural child'}).click();
	await expect(structuralProbe).toHaveCount(0);
	await page.getByRole('button', {name: 'Mount structural child'}).click();
	await expect(structuralProbe).toBeVisible();
	expect(await structuralProbe.textContent()).not.toBe(structuralInstance);

	await page.getByRole('button', {name: 'Emit local event'}).click();
	await expect(page.locator('.events-showcase')).toContainText('Event count: 1');
	await page.getByRole('button', {name: 'Run A/B/B/B'}).click();
	await expect(page.locator('.events-showcase')).toContainText('Accepted: B');

	await page.getByRole('button', {name: 'Send to custom ID'}).click();
	await expect(page.locator('.messaging-showcase')).toContainText('received: direct message');

	var inspection = page.locator('.runtime-status').first();
	await expect(inspection).toContainText('Inspection #1');
	await page.getByRole('button', {name: 'Refresh inspection'}).click();
	await expect(inspection).toContainText('Inspection #2');
	await page.getByRole('button', {name: 'Destroy child'}).click();
	await expect(page.locator('.runtime-showcase')).toContainText('Child destroyed');
	await page.getByRole('button', {name: 'Recreate child'}).click();
	await expect(page.locator('.runtime-showcase')).toContainText('Child mounted');

	expect(errors).toEqual([]);
});

test('official Advanced Component Reload keeps the live instance and applies the new generation after recreate', async ({ page }) => {
	var errors = captureErrors(page);
	var probe;
	var before;

	await page.goto('http://127.0.0.1:4274/');
	probe = page.locator('.runtime-showcase .component-probe').filter({hasText: 'Runtime child'});
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Development Reload', exact: true}), errors);
	await expect(probe).toBeVisible();
	before = await probe.textContent();
	await page.getByRole('button', {name: 'Reload RuntimeProbe'}).click();
	await expect(page.locator('.runtime-reload').getByText('Reload complete', {exact: true})).toBeVisible({timeout: 10000});
	expect(await probe.textContent()).toBe(before);
	await page.getByRole('button', {name: 'Recreate child'}).click();
	await expect(probe).toContainText('generation 1');
	expect(await probe.textContent()).not.toBe(before);

	expect(errors).toEqual([]);
});

test('official Advanced example exposes Application bootstrap and startup lifecycle', async ({ page }) => {
	var errors = captureErrors(page);
	var runtime;

	await page.goto('http://127.0.0.1:4274/');
	runtime = page.locator('.runtime-showcase');
	await expectBootstrapVisible(runtime.getByRole('heading', {name: 'Application startup lifecycle'}), errors);
	await expect(runtime.locator('.startup-lifecycle')).toContainText('called ·');
	await expect(runtime.locator('.startup-lifecycle')).toContainText('1 call');
	await expect(runtime.locator('.startup-lifecycle')).toContainText('0 calls · hook armed');

	expect(errors).toEqual([]);
});

test('official Advanced example demonstrates lazy Service lifecycle and Service Reload', async ({ page }) => {
	var errors = captureErrors(page);
	var generation;

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Service lifecycle'}), errors);
	await expect(page.locator('.runtime-service-state')).toHaveText('Lazy · not instantiated');
	await page.getByRole('button', {name: 'Create / inspect service'}).click();
	await expect(page.locator('.runtime-service-state')).toHaveText('created · Application-owned');
	generation = Number(await page.locator('.runtime-service-generation').textContent());
	await page.getByRole('button', {name: 'Destroy service'}).click();
	await expect(page.locator('.runtime-service-state')).toContainText('Destroyed');
	await page.getByRole('button', {name: 'Create / inspect service'}).click();
	await expect(page.locator('.runtime-service-generation')).toHaveText(String(generation));
	await page.getByRole('button', {name: 'Reload RuntimeService'}).click();
	await expect(page.locator('.runtime-service-reload-status')).toContainText('Reload complete', {timeout: 10000});
	await expect(page.locator('.runtime-service-generation')).toHaveText(String(generation + 1));
	await expect(page.locator('.runtime-service-state')).toHaveText('created · re-created after reload');

	expect(errors).toEqual([]);
});
test('official Advanced Service accesses Network, Storage, Messaging and Workers', async ({ page }) => {
	var errors = captureErrors(page);
	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.locator('.runtime-showcase'), errors);
	var runtime = page.locator('.runtime-showcase');

	await runtime.getByRole('button', {name: 'Exercise service facades'}).click();
	await expect(runtime.locator('.service-integration-instance')).toHaveText('Instance 1 · active');
	await expect(runtime.locator('.service-integration-network')).toHaveText('XHR handle created');
	await expect(runtime.locator('.service-integration-storage')).toHaveText('storage roundtrip');
	await expect(runtime.locator('.service-integration-messaging')).toHaveText('message roundtrip');
	await expect(runtime.locator('.service-integration-webworker')).toHaveText('AdvancedIntegrationServiceWorker · Running');
	await expect(runtime.locator('.service-integration-serviceworker')).toHaveText('AdvancedIntegrationServiceWorker');

	await runtime.getByRole('button', {name: 'Destroy integration service'}).click();
	await expect(runtime.locator('.service-integration-instance')).toHaveText('Instance 1 · destroyed');
	await expect(runtime.locator('.service-integration-webworker')).toHaveText('AdvancedIntegrationServiceWorker · Stopped · owner destroyed');

	await runtime.getByRole('button', {name: 'Exercise service facades'}).click();
	await expect(runtime.locator('.service-integration-instance')).toHaveText('Instance 2 · active');
	await expect(runtime.locator('.service-integration-webworker')).toHaveText('AdvancedIntegrationServiceWorker · Running');
	expect(errors).toEqual([]);
});


test('official Advanced example registers a dynamic Application Service at runtime', async ({ page }) => {
	var errors = captureErrors(page);
	var runtime;

	await page.goto('http://127.0.0.1:4274/');
	runtime = page.locator('.runtime-showcase');
	await expectBootstrapVisible(runtime.getByRole('heading', {name: 'Dynamic Application Service'}), errors);
	await expect(runtime.locator('.dynamic-service-registration')).toHaveText('Unregistered');
	await expect(runtime.locator('.dynamic-service-instance')).toHaveText('No instance');

	await runtime.getByRole('button', {name: 'Register dynamic Service'}).click();
	await expect(runtime.locator('.dynamic-service-registration')).toHaveText('Registered at runtime · lazy');
	await expect(runtime.locator('.dynamic-service-instance')).toHaveText('No instance');

	await runtime.getByRole('button', {name: 'Create / inspect dynamic Service'}).click();
	await expect(runtime.locator('.dynamic-service-instance')).toHaveText('Instance 1 · generation 0');
	await runtime.getByRole('button', {name: 'Destroy dynamic Service'}).click();
	await expect(runtime.locator('.dynamic-service-instance')).toHaveText('Destroyed · next access creates a new instance');
	await runtime.getByRole('button', {name: 'Create / inspect dynamic Service'}).click();
	await expect(runtime.locator('.dynamic-service-instance')).toHaveText('Instance 2 · generation 0');

	expect(errors).toEqual([]);
});

test('official Advanced example destroys and recreates an isolated Application', async ({ page }) => {
	var errors = captureErrors(page);
	var runtime;

	await page.goto('http://127.0.0.1:4274/');
	runtime = page.locator('.runtime-showcase');
	await expectBootstrapVisible(runtime.getByRole('heading', {name: 'Isolated Application lifecycle'}), errors);
	await expect(runtime.locator('.runtime-application-state')).toHaveText('Mounted · root instance 1');
	await expect(runtime).toContainText('Instance 1');
	await page.getByRole('button', {name: 'Destroy Application'}).click();
	await expect(runtime.locator('.runtime-application-state')).toHaveText('Destroyed · registry released');
	await expect(runtime).not.toContainText('Isolated Application root');
	await page.getByRole('button', {name: 'Recreate Application'}).click();
	await expect(runtime.locator('.runtime-application-state')).toHaveText('Mounted · root instance 2');
	await expect(runtime).toContainText('Instance 2');

	expect(errors).toEqual([]);
});
test('official Advanced example demonstrates deferred child Pending, Ready and Error lifecycle', async ({ page }) => {
	var errors = captureErrors(page);
	var runtime;

	await page.goto('http://127.0.0.1:4274/');
	runtime = page.locator('.runtime-showcase');
	await expectBootstrapVisible(runtime.getByRole('heading', {name: 'Deferred child lifecycle'}), errors);
	await expect(runtime).toContainText('Waiting for RuntimeDeferredReadyTemplate...');
	await expect(runtime.locator('.deferred-child-pending')).toContainText('RuntimeDeferredReadyChild');
	await page.getByRole('button', {name: 'Resolve pending child'}).click();
	await expect(runtime).toContainText('Deferred child ready');
	await expect(runtime.locator('.deferred-child-ready')).toContainText('RuntimeDeferredReadyChild');

	await page.getByRole('button', {name: 'Trigger error child'}).click();
	await expect(runtime).toContainText('Missing TemplateURL · child error rendered');
	await expect(runtime.locator('.deferred-child-error')).toContainText('RuntimeDeferredErrorChild');
	await expect(runtime.locator('.deferred-child-error')).toContainText('Elemenx TemplateURL failed');
	expect(errors.some(function (error) {
		return error.indexOf('Elemenx TemplateURL failed') !== -1;
	})).toBe(true);
});