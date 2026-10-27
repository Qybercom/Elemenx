# Elemenx

**Elemenx** is a browser UI framework in one ES5 file, with the components of **ElemenxUI**. This extension knows your templates and the code of your Components as Elemenx does.

## What it does

- **Completion** of the Components of a template, their props (`Variant`, `[Variant]`), events (`(click)`), the directives (`*if`, `*for`, `*tip`...), the options of a prop, the references of `$Ref('...')` and the Services of `$Service('...')`.
- **Expressions that know their Component**: `{{Title}}` is the field of the Component of the template, with its type: `CallState.` completes the keys of `CallState`, the item of `*for` has the type of the items. A JSDoc above a key gives it a type of its own.
- **Go to definition** of a Component, a prop, an event, a directive (the core ones in `elemenx.js`), a field or a function of a template, and a reference (`#Name` and `$Ref('Name')` both ways).
- **Documentation on hover** of all of them.
- **Diagnostics**: an unknown Component, prop, event or directive, a `$Ref` with no element.
- **Colors** of their own for the Components, bindings, events, directives, references and `{{ }}`, readable in light and dark themes.

## Where it works

In a project with the sources of Elemenx, with the `@qybercom/elemenx` package, or with its builds of `dist` alone: the extension carries the sources of its version, and the definitions go there.

```html
<Card Title="Today" [items]="Items" (pick)="Picked">
	<p *for="item of Items">{{item.Name}}</p>
	<Button #Save Label="Save" (click)="Saved" />
</Card>
```

[Elemenx on GitHub](https://github.com/Qybercom/Elemenx) · [the documentation](https://github.com/Qybercom/Elemenx/tree/main/docs)
