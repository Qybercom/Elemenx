GameCombat: здоровье того, что можно ранить в игре сцены. Объявляется внутри Scene: `<Scene> ... <GameCombat Bars="hurt" /> </Scene>` (черта SceneBehaviour). Держит реестр сцены (Vitals.Of): объекты с чертой Health, урон от каждого попадания оружия сцены, гибель по Death. Тот же реестр используют GameStrategy и любые другие части игры.

Свойства:
- Bars — полоски здоровья над тем, у кого оно есть: hurt (только у раненых), always, never;
- FriendlyFire — засчитывать удары по своим;
- Authority: local, host (каждое изменение рассылается через Send), client (изменение запрашивается у хозяина через Send, ответы принимает Receive);
- Send — функция транспорта приложения.

Методы: Damage(id, hit), Heal(id, amount, source), Revive(id, value), HealthOf(id), Alive(id), Before(handler), Receive(message), Ledger().

События: damage, heal, death, revive, health. Когда герой убивает цель, прицел на миг краснеет (Scene.Killed).
