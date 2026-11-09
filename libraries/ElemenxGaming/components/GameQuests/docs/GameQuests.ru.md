Задания игры. Items [{ID, Title, Group, Level, Status ('active', 'done' или 'failed'), Tracked, Text, Objectives [{Label, Value, Max}], Rewards [{Icon, Image, Label, Count, Rarity, Color, Type, Stats, Description или Item — сам предмет}]}]. Награда, у которой есть не только название, показывает карточку под указателем, при фокусе или касании (*tip).

- Variant 'log' (по умолчанию): журнал — задания по Group слева (стрелки, Home и End двигают), открытое справа с текстом, целями и наградами и кнопкой отслеживания. Value — ID открытого задания; change отправляет ID другого, track — {ID, Tracked}.
- Variant 'tracker': цели отслеживаемых активных заданий для игрового экрана; нажатие на задание отправляет change с его ID.

Label называет список для экранных читалок, Empty — текст при отсутствии заданий.
