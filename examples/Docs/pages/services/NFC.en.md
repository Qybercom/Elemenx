<!-- generated -->
# NFC

NFC tags through Web NFC: Chrome on Android, HTTPS. Every method takes callback(error, result); error.name is the name of the browser error ('NotAllowedError' when the user refuses, 'NotSupportedError' without Web NFC).

- Supported().
- Scan(callback): reads the tags held to the device until Stop(); callback(error, tag) for each one, tag {Serial, Records: [{Type, Text, URL, Data (a Uint8Array), MediaType, ID, Language}]} (Text for a text, URL for a link). Stop() ends it.
- Write(message, options, callback): writes a tag held to the device. message: a text, {URL}, {Text, Language} or {Records: [{Type, Text, URL, Data, MediaType, ID}]}; options: {Overwrite (true)}.
- Lock(callback): makes the tag held to the device read only, for good.

## Methods

- `Supported()`
- `Scan(callback)`
- `Stop()`
- `Write(message, options, callback)`
- `Lock(callback)`

## Example

```example
<p class="elemenx-text">Web NFC here: <strong>{{Supported ? 'yes' : 'no (Chrome on Android, HTTPS)'}}</strong></p>
<Button Label="Scan a tag" Icon="search" [disabled]="!Supported" (click)="Scan" />
<Button Label="Stop" Variant="ghost" [disabled]="!Supported" (click)="Stop" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Supported: false,
	Note: '',

	$OnCreate: function () {
		this.Supported = this.$Service('NFC').Supported();
	},

	Scan: function () {
		var self = this;

		this.Note = 'Hold a tag to the device';

		this.$Service('NFC').Scan(function (error, tag) {
			self.Note = error ? error.name : 'Tag ' + tag.Serial + ': ' + tag.Records.map(function (record) {
				return record.Text || record.URL || record.Type;
			}).join(', ');
		});
	},

	Stop: function () {
		this.$Service('NFC').Stop();
		this.Note = 'Stopped';
	},

	$OnDestroy: function () {
		if (this.Supported)
			this.$Service('NFC').Stop();
	}
})
</script>
```

## Tests

- [reads the records of the tags until it stops, and writes texts, links and records](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L251) — `tests/regression/devices.test.js`
- [devices: the browser tells which of Push, Serial, USB and NFC it has, and each calls back its result or its error](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L8268) — `tests/examples/ui-kit.spec.js`
