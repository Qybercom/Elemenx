<!-- generated -->
# Chronicle

Лента событий, как активность merge request. Items: [{ID, Icon, Variant, Author, Action, Time, Text, Element, Render, Size}]: Variant (default, accent, info, success, warning, danger) окрашивает узел; Text — тело под строкой (комментарий); Element или Render(container, item) дают своё содержимое. Size 'small' делает событие второстепенным (добавлена метка, отправлен коммит): маленький узел, точка, если у элемента нет Icon, и строка мельче. Compact уплотняет отступы. (До 0.10.0 назывался Timeline.)

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Compact` | `false` |

## Пример

```example
<Chronicle [items]="Items" />
<Button Label="Approve" Icon="check" Size="small" (click)="Approve" />
<script>
({
	Items: [
		{ID: 1, Icon: 'branch', Author: 'Ada', Action: 'opened this merge request', Time: '9:00'},
		{ID: 2, Author: 'Alan', Action: 'added the label ui', Time: '9:12', Size: 'small'},
		{ID: 3, Icon: 'comment', Author: 'Alan', Action: 'commented', Time: '11:30', Text: 'Looks good; can the list keep its scroll on reload?'},
		{ID: 4, Author: 'Ada', Action: 'pushed 2 commits', Time: '13:05', Size: 'small', Variant: 'info'},
		{ID: 5, Icon: 'warning', Author: 'CI', Action: 'failed on the e2e tests', Time: '13:20', Variant: 'danger'}
	],

	Approve: function () {
		this.Items = this.Items.concat([{ID: this.Items.length + 1, Icon: 'check', Author: 'You', Action: 'approved', Time: 'now', Variant: 'success'}]);
	}
})
</script>
```

## Тесты

- [Chronicle lists its events in order with their author, action and time, small ones as dots](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-misc.test.js#L171) — `tests/regression/library-misc.test.js`
