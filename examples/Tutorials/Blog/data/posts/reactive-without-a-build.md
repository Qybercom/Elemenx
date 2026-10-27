# Reactive pages without a build

A counter, its state and its template, in the page itself:

```html
<script src="https://cdn.jsdelivr.net/npm/@qybercom/elemenx@0.10/dist/elemenx.min.js"></script>
<div id="app"></div>
<script>
	Elemenx.Component('Counter', {
		$Template: '<button (click)="Add">Pressed {{Count}} times</button>',
		Count: 0,
		Add: function () { this.Count++; }
	});
	Elemenx.Application('Page', {$Component: 'Counter', $Mount: '#app'});
</script>
```

The field `Count` is state: the button shows the new count after each press.
