<!-- generated -->
# Archive

Archives made in the page: a project, a game or a set of files to download in one.

- Zip(files): a zip of files by their paths ({'index.html': text, 'model.glb': bytes}: texts in UTF-8, bytes as an ArrayBuffer or a Uint8Array), stored as they are, with no compression: the bytes of the archive (a Uint8Array) that any system opens.
- Crc(bytes): the CRC-32 of bytes, as a zip keeps it.

The same functions run in Node: they read no page.

## Methods

- `Crc(bytes)`
- `Zip(files)`

## Tests

- [keeps texts in UTF-8 and bytes as they are, each with its CRC-32, and a directory of them at its end](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Archive/Archive.test.js#L37) — `libraries/ElemenxCommon/services/Archive/Archive.test.js`
- [loads every Service of ElemenxCommon through its entry for Node: a loop runs on timers, FPS waits in silence](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L129) — `tests/regression/headless.test.js`
- [tabs declared with their content show the panel of the current one, and make the component of a tab when it first opens](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3943) — `tests/examples/ui-kit.spec.js`
