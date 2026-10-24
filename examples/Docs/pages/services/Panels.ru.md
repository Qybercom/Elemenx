<!-- generated -->
# Panels

Панели, которые компонент объявляет в своём шаблоне, как вкладки Tabs (Tab) и Ribbon (RibbonTab): дочерний компонент рисует элемент с классом (свою панель), чьи атрибуты data-* его описывают, а владелец их читает. Read(root, selector, owner) возвращает панели root (элементы selector внутри него, но не внутри другого элемента селектора owner в нём: панели вложенного Tabs принадлежат ему). Data(panel) отдаёт атрибуты data-* панели как {Name: текст}, имена в PascalCase (data-key-tip — KeyTip). Watch(root, selector, callback) вызывает callback, когда панель появляется, исчезает или меняется один из её атрибутов data-*, не чаще раза в кадр, и возвращает функцию, которая это прекращает.

## Методы

- `Read(root, selector, owner)`
- `Data(panel)`
- `Watch(root, selector, callback)`
