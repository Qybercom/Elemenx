Уведомления, которые показывает ToastHost (поставьте его в раскладку приложения). Show(options) возвращает ID уведомления. Параметры:

- Title, Message, Variant (info, success, warning, danger), Icon (имя или false — без иконки), Class (дополнительные классы);
- AutoHide и Duration (миллисекунды): уведомление закрывается само, если AutoHide не false и Duration не 0;
- Actions: [{Label, Run, Variant}] (Action — одно из них); Closable: false скрывает кнопку закрытия;
- Element (узел DOM, например элемент компонента) или Render(container, toast) для своего содержимого.

Configure({Duration, AutoHide, Limit}) меняет значения по умолчанию. Dismiss(id), Clear(); Pause(id) и Resume(id) останавливают таймер, пока на уведомление наведён указатель или оно в фокусе. OnChange(callback)/OffChange(callback) сообщают список.
