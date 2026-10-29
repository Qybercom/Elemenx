<!-- generated -->
# USB

USB devices through WebUSB (Chrome and Edge; HTTPS or localhost): devices with a driver of their own, not the ones the system keeps (keyboards, disks). Every method takes callback(error, result); error.name is the name of the browser error ('NotFoundError' when the user picks no device, 'NotSupportedError' without WebUSB).

- Supported(). Request({Filters: [{VendorID, ProductID, ClassCode}]}, callback): the user picks a device (from a press); the result is a device. Devices(callback): the devices the user already allowed.
- A device: Info {VendorID, ProductID, Name, Manufacturer, Serial}; Open({Configuration (1), Interface (0)}, callback) opens it and claims the interface; TransferIn(endpoint, length, callback) reads (a Uint8Array); TransferOut(endpoint, data, callback) writes a text or bytes (the count written); Control({Type, Recipient, Request, Value, Index}, data or length, callback): a control transfer, in with a length, out with data; Close(callback); Opened().
- On('connect' or 'disconnect', callback): a device of the page joins or leaves ({Device}).

## Methods

- `Supported()`
- `Request(options, callback)`
- `Devices(callback)`
- `On(name, callback)`

## Example

```example
<p class="elemenx-text">WebUSB here: <strong>{{Supported ? 'yes' : 'no (Chrome and Edge)'}}</strong></p>
<Button Label="Pick a device" Icon="link" [disabled]="!Supported" (click)="Pick" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Supported: false,
	Note: '',

	$OnCreate: function () {
		this.Supported = this.$Service('USB').Supported();
	},

	Pick: function () {
		var self = this;

		this.$Service('USB').Request({}, function (error, device) {
			self.Note = error ? error.name : device.Info.Manufacturer + ' ' + device.Info.Name + ' (' + device.Info.VendorID + ':' + device.Info.ProductID + ')';
		});
	}
})
</script>
```

## Tests

- [asks for a device, opens and claims it, and transfers data in, out and by control](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L178) — `tests/regression/devices.test.js`
- [devices: the browser tells which of Push, Serial, USB and NFC it has, and each calls back its result or its error](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L8373) — `tests/examples/ui-kit.spec.js`
