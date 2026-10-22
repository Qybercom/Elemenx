<!-- generated -->
# FileIcon

Иконка файла по его имени: <FileIcon Name="report.pdf" />, из набора files (Icons.File): около 170 форматов и их других расширений, двойные расширения (.tar.gz) и известные имена (Dockerfile, Makefile, .gitignore). Неизвестные форматы получают иконку обычного файла. Size в пикселях (16); Label называет её для экранных читалок.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Name` | `''` |
| `Size` | `16` |
| `Label` | `''` |

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<div *for="name of Names" *key="name" class="docs-stack" style="align-items: center; width: 88px;"><FileIcon [name]="name" Size="40" /><span class="elemenx-caption">{{name}}</span></div>
</div>
<script>
({
	Names: ['report.pdf', 'app.js', 'photo.png', 'song.mp3', 'data.xlsx', 'archive.tar.gz', 'Dockerfile', '.gitignore', 'unknown.xyz']
})
</script>
```
