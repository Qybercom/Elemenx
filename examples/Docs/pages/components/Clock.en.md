<!-- generated -->
# Clock

The time now: digital (the time as the language of the page writes it) or analog (a face with hands). TimeZone shows the time of a zone of the IANA (Europe/Paris), and Label names it under the time (a city); Seconds shows the seconds; Hour12 forces 12 or 24 hours (by default, the one of the language). ShowDate adds the date under a digital clock. It moves once a second, and stops while it sleeps (Cache).

## Properties

| Property | Default |
| --- | --- |
| `TimeZone` | `''` |
| `Seconds` | `false` |
| `Hour12` | `null` |
| `ShowDate` | `false` |
| `Label` | `''` |
| `Size` | `'medium'` |

## Example

```example
<div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
	<Clock Seconds="true" ShowDate="true" />
	<Clock Mode="analog" Seconds="true" />
	<Clock TimeZone="America/New_York" Label="New York" Size="small" />
	<Clock TimeZone="Asia/Tokyo" Label="Tokyo" Size="small" />
</div>
```

## Tests

- [Clock shows the time of its zone, digital or analog, and a zone the browser does not know is the one of the device](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L131) — `tests/regression/library-new.test.js`
