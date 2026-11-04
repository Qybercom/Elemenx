Города мира из GeoNames (все города с населением от тысячи человек, CC BY 4.0: показывайте Attribution там, где видны города): их названия, страны, регионы, координаты и часовые пояса. Данные большие и загружаются один раз, когда впервые нужны: data/cities.txt и data/regions.txt (пакет cities), а также названия на языке страницы, если для него есть пакет (data/cities-ru.txt, пакет cities.ru).

Город — {ID, Name, Country, Region, Latitude, Longitude, TimeZone}: Name и Region на языке страницы (иначе по-английски), Country — код ISO 3166 (Label добавляет его название).

- Load(callback): загружает данные; callback (error, count).
- Search(text, options, callback): города, название или слово названия которых начинается с текста, в любых буквах (без учёта регистра и диакритики; латиница находит кириллическое название: moskva находит Москва), по алфавиту. options: Country (код), Limit (20). callback (error, cities).
- Find(id, callback): город по ID или null. Nearest(latitude, longitude, options, callback): ближайший город (options.Country ограничивает одной страной).
- Clock(город или часовой пояс, date): время там, {Date: 'YYYY-MM-DD', Time: 'HH:mm', Offset: '+03:00', TimeZone} (по умолчанию сейчас). Label(city): 'Название, Регион, Страна' на языке страницы; Place(city): 'Регион, Страна'.
