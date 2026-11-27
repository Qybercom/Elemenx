<!-- generated -->
# Archive

Archives made in the page: a project, a game or a set of files to download in one.

- Zip(files): a zip of files by their paths ({'index.html': text, 'model.glb': bytes}: texts in UTF-8, bytes as an ArrayBuffer or a Uint8Array), stored as they are, with no compression: the bytes of the archive (a Uint8Array) that any system opens. Over 65535 files, or past 4 GB, it is a ZIP64.
- Unzip(bytes): the files of a zip by their paths, each its bytes (a Uint8Array): what Zip made, or any zip of stored files; a file compressed in it is an error.
- Compress(files, callback(error, bytes)): a zip as Zip makes it, each file deflated where that makes it smaller; Expand(bytes, callback(error, files), options): the files of any zip, stored or deflated; a deflated one unpacks to the size its directory tells at most, its CRC checked ('Archive: <name> is not as its directory tells'), all of them to options MaxBytes (MaxBytes, 1 GB) at most ('Archive: the files unpack to more than <most> bytes').
- Entries(bytes, base): the directory of a zip, of the whole file or of its end alone (bytes from the place base of the file on): [{Name, Method (0 stored, 8 deflated), Crc, Size, Compressed, Offset (of its local header in the file)}]; Data(bytes, entry): the bytes kept of one entry, bytes being the file from its local header on.
- Deflate(bytes, callback(error, bytes)) and Inflate(bytes, callback(error, bytes), most): raw deflate (RFC 1951) of the platform (CompressionStream), in a page, a worker and Node; an error where there is none. Inflate makes most bytes at most (MaxBytes by default): 'Archive: unpacked data of more than <most> bytes'.
- Crc(bytes): the CRC-32 of bytes, as a zip keeps it.

The same functions run in Node: they read no page.

## Methods

- `Crc(bytes)`
- `Zip(files)`
- `Entries(bytes, base)`
- `Data(bytes, entry)`
- `Unzip(bytes)`
- `Deflate(bytes, callback)`
- `Inflate(bytes, callback, most)`
- `Compress(files, callback)`
- `Expand(bytes, callback, options)`

## Tests

- [keeps texts in UTF-8 and bytes as they are, each with its CRC-32, and a directory of them at its end](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Archive/Archive.test.js#L37) — `libraries/ElemenxCommon/services/Archive/Archive.test.js`
- [reads the files of a zip back by their paths, and tells what is no zip or is compressed](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Archive/Archive.test.js#L55) — `libraries/ElemenxCommon/services/Archive/Archive.test.js`
- [deflates the files of a zip where that makes them smaller, and expands any zip back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Archive/Archive.test.js#L78) — `libraries/ElemenxCommon/services/Archive/Archive.test.js`
- [reads the directory of a zip from its end alone, and an entry from its own bytes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Archive/Archive.test.js#L109) — `libraries/ElemenxCommon/services/Archive/Archive.test.js`
- [writes and reads a ZIP64 of more than 65535 files](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Archive/Archive.test.js#L121) — `libraries/ElemenxCommon/services/Archive/Archive.test.js`
- [unpacks a deflated file to the size its directory tells at most, all of them to MaxBytes, a file named __proto__ kept](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Archive/Archive.test.js#L145) — `libraries/ElemenxCommon/services/Archive/Archive.test.js`
- [loads every Service of ElemenxCommon through its entry for Node: a loop runs on timers, FPS waits in silence](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L130) — `tests/regression/headless.test.js`
- [tabs declared with their content show the panel of the current one, and make the component of a tab when it first opens](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3943) — `tests/examples/ui-kit.spec.js`
- [saves a planet to one file and opens it again, the same](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L168) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [opens a planet of the network: a folder of its files, or its one file](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L180) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [opens a planet of the network to some level, its file by ranges of bytes or its folder by files, and reads the rest round a point (Need)](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L448) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
