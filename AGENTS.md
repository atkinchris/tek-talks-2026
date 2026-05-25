# Agent instructions

## Inline command and tool names

When referencing a command, tool, or technical token inline in slide text (e.g. `binwalk`, `strings`, `ums`, `8N1`), use:

```html
<code class="cmd">binwalk</code>
```

The `.cmd` class is defined in `slides/shared/style.css`. Do not use inline `style` attributes on `<code>` or `<strong>` elements for this purpose.
