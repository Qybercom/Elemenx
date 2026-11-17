# Hardware

`Elemenx.Hardware` reaches devices joined to the computer through the browser: serial ports (`Serial`, Web Serial), USB devices with a driver of their own (`USB`, WebUSB) and the flash of a board (`Firmware`). Every method takes a callback `(error, result)`; `error.name` is the name of the browser error: `NotFoundError` when the user picks nothing, `NotSupportedError` when the browser has no way to the device (Web Serial and WebUSB are in Chrome and Edge on a desktop, over HTTPS or localhost).

A Component, a Service or an Application has its own `$Hardware`, the same as `Elemenx.Hardware`: what it opened is closed, what it flashes is cancelled and its listeners are forgotten when it is destroyed, as `$Network` does with its requests.

## Serial ports

```js
Elemenx.Component('Console', {
	$Template: '<button (click)="Connect">Connect</button>',

	Connect: function () {
		var self = this;

		/* The user picks a port: call it from a press, the browser asks for a gesture. */
		this.$Hardware.Serial.Request({Filters: [{VendorID: 0x10c4}]}, function (error, port) {
			if (error) return;

			port.On('line', function (line) {
				console.log('board:', line);
			});

			port.Open({BaudRate: 115200}, function (failed) {
				if (!failed)
					port.Write('hello\n');
			});
		});
	}
});
```

| Member | Meaning |
| --- | --- |
| `Supported()` | whether the browser has Web Serial |
| `Request({Filters: [{VendorID, ProductID}]}, callback)` | the user picks a port; the result is a port |
| `Ports(callback)` | the ports the user already allowed |
| `On(name, callback)`, `Off(name, callback)` | `connect` and `disconnect`: a port joins or leaves (`{Port}`) |

A port has `Info` (`{VendorID, ProductID}`), `Open({BaudRate, DataBits, StopBits, Parity, FlowControl, Text}, callback)` (it starts reading: the `data` event carries what comes, a text with `Text: true`, the default, or a `Uint8Array`, and `line` each line of text), `Write(data, callback)` (a text or bytes), `Signals({DTR, RTS, Break}, callback)`, `Close(callback)`, `On` and `Off` for `data`, `line`, `error` and `close`, `Opened()` and `Native` (the port of the browser). There is one handle for each port, whoever asks for it.

## USB devices

| Member | Meaning |
| --- | --- |
| `Supported()` | whether the browser has WebUSB |
| `Request({Filters: [{VendorID, ProductID, ClassCode}]}, callback)` | the user picks a device |
| `Devices(callback)` | the devices the user already allowed |
| `On(name, callback)`, `Off(name, callback)` | `connect` and `disconnect` (`{Device}`) |

A device has `Info` (`{VendorID, ProductID, Name, Manufacturer, Serial}`), `Open({Configuration, Interface}, callback)` (it opens it and claims the interface), `TransferIn(endpoint, length, callback)`, `TransferOut(endpoint, data, callback)`, `Control({Type, Recipient, Request, Value, Index}, data or length, callback)`, `Close(callback)`, `Opened()` and `Native`. Keyboards, disks and the other devices the system keeps are not reachable.

## Firmware

`Firmware` writes programs on the flash of a board by protocols. `esp` speaks with the ROM loader of the ESP32 family (ESP32, ESP32-S3, ESP32-C3): it resets the board into its loader by DTR and RTS (the classic circuit, or the USB-JTAG-Serial of S3 and C3), tells the chip, goes faster, erases and writes each part in blocks of 1 KB, checks it by its MD5 and resets the board to run it. It sends no program of its own first, so nothing is compressed: a megabyte takes some 30 seconds at 460800 baud.

```js
var firmware = Elemenx.Hardware.Firmware;

/* The files of a build of arduino-cli at their offsets: bootloader, partitions, boot_app0, the app. */
var parts = firmware.Parts(files, 'ESP32');

var job = firmware.Flash(port, parts, {Baud: 460800, Flash: {Size: '4MB'}, Progress: function (progress) {
	console.log(progress.Stage, progress.Done, '/', progress.Total);
}}, function (error, result) {
	if (error) console.log(error.name, error.message);
	else console.log(result.Chip, result.Written, 'bytes');
});

/* job.Cancel() stops it: the callback gets an AbortError. */
```

| Member | Meaning |
| --- | --- |
| `Flash(port, parts, options, callback)` | writes `[{Offset, Bytes}]`; options `Protocol` (`esp`), `Baud` (460800), `Erase` (the whole flash first), `Verify` (`false`: no MD5 checked), `Reset` (`false`: the board left in its loader), `Flash` (`{Size, Mode, Frequency}`: the header of the bootloader set so), `Partitions` (the table the parts are checked by), `Progress`; returns `{Cancel()}` |
| `Detect(port, options, callback)` | the chip: `{Chip, Family, Bootloader}` |
| `Read(port, offset, length, options, callback)` | bytes of its flash (slow: a table of partitions and the like) |
| `Parts(files, chip)` | a build of arduino-cli (`[{Name, Bytes}]`) at its offsets; a merged image at 0 |
| `Manifest(manifest, chip, read, callback)` | the parts of a manifest of ESP Web Tools, each read by `read(path, callback)` |
| `Patch(image, {Chip, Mode, Frequency, Size})` | an image of a bootloader set for a flash, its SHA-256 made again |
| `Digest(bytes, kind)` | MD5 (`md5`) or SHA-256 (`sha256`) |
| `Define(name, protocol)`, `Names()`, `Chips()` | the protocols (`{Flash, Detect, Read}`) and the chips they know |

Before the board is touched, `Flash` checks the parts: over each other, past the flash, an app longer than its partition are a `DataError`. A loader that does not answer is a `TimeoutError` (hold BOOT and press RESET, then try again).

## The map of the memory

The flash of an ESP32 is laid out by its table of partitions at 0x8000: the app (and its slots of updates), the settings (nvs), the room for files (SPIFFS, LittleFS) and the rest. `Firmware.Partitions` reads, makes and checks it:

```js
var partitions = Elemenx.Hardware.Firmware.Partitions;
var list = partitions.Preset('huge_app');

list.push({Name: 'store', Type: 'data', SubType: 'littlefs', Offset: 0x400000, Size: 0x100000, Flags: []});

partitions.Check(list, 8 * 1024 * 1024);    /* [] when it holds together */

/* Written with the firmware in place of the table of the build. */
parts.push({Offset: partitions.Offset, Bytes: partitions.Make(list)});
```

`Parse(bytes or CSV text)` gives `[{Name, Type, SubType, Offset, Size, Flags}]` (a `partitions.bin`, the flash read from 0x8000, or a CSV of ESP-IDF, where an offset left out follows the partition before), `Make(list)` its bytes with their MD5, `CSV(list)` its text, `Check(list, flashBytes)` what is wrong with it (`[{Partition, Text}]`), `Preset(name)` and `Presets()` the tables of Arduino (`default`, `huge_app`, `min_spiffs`, `no_ota`). The page `/hardware` of the Advanced example shows all of it: the files, the map, the flashing and the monitor of the port.
