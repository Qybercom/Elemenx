<!-- generated -->
# FileIcon

The icon of a file by its name: <FileIcon Name="report.pdf" />, from the set files (Icons.File): about 170 formats and their other extensions, double extensions (.tar.gz) and well-known names (Dockerfile, Makefile, .gitignore). Unknown formats get the plain file icon. Size in pixels (16); Label names it for screen readers.

## Properties

| Property | Default |
| --- | --- |
| `Name` | `''` |
| `Size` | `16` |
| `Label` | `''` |

## Example

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

## Tests

- [ButtonGroup groups its buttons for screen readers, attached or in a column, and FileIcon names the icon of a file by its name](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-misc.test.js#L123) — `tests/regression/library-misc.test.js`
