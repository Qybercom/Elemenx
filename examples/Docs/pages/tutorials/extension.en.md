# A browser extension

A reading list in the button of the browser: press it on a page, save the page in one click, find it later on every browser you sign in to. The same project builds as a page and as an extension for Chrome, Edge and Firefox. The finished project is `examples/Tutorials/Extension`.

What you learn: `elemenx build --extension` and its surfaces, the manifest and the permissions it asks for, the APIs of the extension with a fallback for development, `chrome.storage.sync`, and what the policy of an extension forbids.

## 1. One project, two builds

```bash
npm run dev            # the page in a tab, as any project: fast to write and to test
npm run extension      # elemenx build --extension: dist/extension/chrome, dist/extension/firefox, and a zip of each
```

The settings of the extension are in `elemenx.config.js`:

```js
Extension: {
	Surface: 'popup',
	Name: 'Reading list',
	Description: 'Keeps the pages to read later, on every browser you sign in to.',
	Manifest: {
		permissions: ['activeTab', 'storage']
	}
}
```

- `Surface`: where the page shows. `popup`, the window of the button; `tab`, a tab of its own opened by the button; `side`, the side panel of Chrome and the sidebar of Firefox.
- `Manifest`: keys added to the Manifest V3 the builder writes. Ask for the least: `activeTab` gives the page of the tab only when the user presses the button, where `tabs` and `host_permissions` would warn of "reading all your data on all websites" at the install.
- The version comes from `package.json`; Firefox needs an `ID` to publish.

## 2. The APIs of the extension, and a stand-in

In an extension the page has `chrome.storage` and `chrome.tabs`; in `elemenx dev` it does not. The Service checks once, and stands in with the storage of the page and the page itself, so the whole application runs and is tested as a page:

```js
$OnCreate: function () {
	this.Items = [];
	this.Extension = typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.sync;
	this.Local = this.$Storage.Local.Namespace('reading');
},

Current: function (callback) {
	if (this.Extension && chrome.tabs) {
		chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
			callback(tabs[0] ? {Title: tabs[0].title || tabs[0].url, URL: tabs[0].url} : null);
		});

		return;
	}

	callback({Title: document.title, URL: location.href});
}
```

Only the Service knows about `chrome`: the component calls `Save`, `Remove` and `Open`, and does not change between the two builds. Firefox has the same `chrome` namespace, so one code runs in both.

## 3. A storage that follows the user

`chrome.storage.sync` keeps small data (100 KB in all, 8 KB an item) in the account of the browser: the list shows on every computer the user signs in to. `chrome.storage.local` holds more, on this computer only. Listen to its changes: another window of the extension, or another computer, changes the list while this one is open:

```js
chrome.storage.onChanged.addListener(function (changes, area) {
	if (area === 'sync' && changes.items)
		self.Take(changes.items.newValue || []);
});
```

## 4. A popup is a small page that does not last

- It is as wide as its page asks, up to 800 pixels: the page asks for 360 (`.reading { width: 360px; }`).
- It closes when it loses the focus, and everything in it ends: keep nothing in memory you need later, write it to the storage at once.
- A link would open in the popup: the Service opens a page in a new tab (`chrome.tabs.create`).

## 5. The policy of an extension

The page of an extension may not run code made from a text: no inline `<script>`, no `eval`, no `new Function`. The builder precompiles the expressions of the templates into functions (`Elemenx.Expressions`), so the templates work; and it stops on an inline script of the page, which would not run there. The router of an extension keeps its route in memory: its page is always `index.html`.

## 6. Install it, and publish it

In Chrome or Edge, open `chrome://extensions` (`edge://extensions`), turn on the mode for developers, and load `dist/extension/chrome` as an unpacked extension; in Firefox, `about:debugging`, This Firefox, a temporary add-on: `dist/extension/firefox/manifest.json`. The zips are what the stores take: the Chrome Web Store, Microsoft Edge Add-ons and addons.mozilla.org.

## 7. The tests

The page is tested as any project (`tests/examples/tutorials.spec.js` saves, reloads and removes a page). A second test builds the extension, loads it into Edge with `--load-extension`, saves a page and reads `chrome.storage.sync`: what runs in the store is what was tested.
