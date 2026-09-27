# Elemenx Directive Composition Policy

## Host ownership

A DOM declaration may have at most one structural directive.

Structural composition is explicit through nesting. Two structural directives on the same host are invalid; use nested hosts when both transformations are required.

A structural directive owns its host before normal descendant traversal. A non-default structural Host capability is dispatched before Component resolution. The default `structural` Host composes with a Component boundary so the Component keeps its own lifecycle and state.

## Arguments

Directive arguments do not own a host. They are valid only when the same declaration has a compatible structural host.

Compatibility is defined by directive metadata, not directive names. `For` on an argument must match the structural directive's `Host` capability. This keeps arguments such as `*key` generic and prevents orphan arguments from silently surviving.

## Behavioral directives

Multiple behavioral directives may coexist on one element.

Lifecycle runs in phases: all directives are created in declaration order, then initially updated in declaration order. Destruction runs in reverse declaration order.

When an element is behind a structural boundary, its behavioral directives belong to the mounted structural subtree. They are created when that subtree mounts and destroyed when it unmounts; the outer owner does not activate them early.

## Component boundaries

Component declarations keep ownership of Component inputs, events and projection.

A default structural directive may control a Component through the Component structural lifecycle. Specialized structural hosts such as collection own the declaration first and create/retain child Components through their host capability.

## Collections

Collection behavior is a structural Host capability, not a directive-name special case.

Collection-local scope is established by the collection host before bindings, child Components and nested directives inside an iteration are evaluated. Keying is supplied through compatible directive arguments.

## Projection

Projection is an ownership boundary, not a traversal dead end.

Projected structure is compiled by its declaring structural owner and must not be compiled a second time by the receiving Component.

## Composition rule

When two structural transformations are needed, express the order in markup:

```html
<section *if="Visible">
	<Card *for="item of Items" *key="item.ID" [value]="item.Value" />
</section>
```

The outer host owns the outer lifetime. The inner host exists only while that lifetime is mounted. This makes directive order explicit instead of depending on HTML attribute order.