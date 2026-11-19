<!-- generated -->
# Progress

The progress of a task. Value from 0 to Max (100); null shows a progress that does not know its end (a moving bar, a turning ring). Variant: bar or ring. Tone: accent, success, warning or danger. Label names it (shown above a bar, read by screen readers); ShowValue prints the percent. Size: small, medium or large.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `null` |
| `Max` | `100` |
| `Variant` | `'bar'` |
| `Tone` | `'accent'` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `ShowValue` | `false` |

## Example

```example
<Progress [value]="Value" Label="Upload" ShowValue="true" />
<Progress [value]="Value" Variant="ring" ShowValue="true" Tone="success" />
<Progress Label="Waiting for the server" />
<Progress Value="90" Tone="danger" Size="small" Label="Disk" ShowValue="true" />
<Button Label="+10%" (click)="More" />
<script>
({
	Value: 40,

	More: function () {
		this.Value = this.Value >= 100 ? 0 : this.Value + 10;
	}
})
</script>
```

## Tests

- [puts the bar of Progress in the splash, with the bytes of the scripts and styles of the page in data-total](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cli-splash.test.js#L65) — `tests/regression/cli-splash.test.js`
- [puts the share of its range on the parts that draw it, its zone and its value told as before](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-meter.test.js#L60) — `tests/regression/library-meter.test.js`
- [shows a value fed on and on at once, with no transition, and glides again when it changes now and then](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-meter.test.js#L85) — `tests/regression/library-meter.test.js`
- [shows the percent the Application gives with Progress: its attribute, its CSS variable, its bar and its text](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/splash.test.js#L103) — `tests/regression/splash.test.js`
- [puts an icon in the favicon, draws a count and a ring over it, and brings the icon of the page back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/services/Platform/Platform.test.js#L112) — `libraries/ElemenxUI/services/Platform/Platform.test.js`
- [in a program gives the windows the icon drawn into a PNG at every change of Elemenx.Icon, and the count and the progress to the system](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/services/Platform/Platform.test.js#L224) — `libraries/ElemenxUI/services/Platform/Platform.test.js`
