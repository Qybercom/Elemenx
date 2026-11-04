Подтверждения и предупреждения из кода, которые показывает DialogHost (поставьте его в раскладку приложения): модальный Dialog без собственного в шаблоне. Confirm(options, callback) показывает диалог и вызывает callback (id): ID нажатого действия или null, если диалог закрыли (Escape, фон, кнопка закрытия). Возвращает ID диалога. Параметры:

- Title, Message, Icon;
- Actions: [{ID, Label, Variant}], по умолчанию «Отмена» и «ОК»; Variant: danger рисует ОК как опасное действие;
- Dismissible: false требует выбрать одно из действий: Escape и фон лишь встряхивают диалог, у которого нет кнопки закрытия.

Alert(options, callback) имеет одно действие — ОК. Строка — это Message параметров. Close(id, action) закрывает диалог из кода и вызывает callback с action. OnChange(callback)/OffChange(callback) сообщают список.
