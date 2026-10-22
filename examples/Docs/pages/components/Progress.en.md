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
