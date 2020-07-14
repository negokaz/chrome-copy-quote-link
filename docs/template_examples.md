# Custom Template Examples

## Slack

### Slack (link)

for: `page`

```
<a href="{{url}}">{{title}}</a>
```

### Slack (quote)

for: `selection`

```
<blockquote>
{{#texts}}
<p>{{.}}</p>
{{/texts}}
<a href="{{url}}">{{title}}</a>
</blockquote>
```

### Slack (link to text)

for: `selection`

```
<blockquote>
{{#texts}}
<p>{{.}}</p>
{{/texts}}
<a href="{{url_to_text}}">{{title}}</a>
</blockquote>
```

## Markdown

### Markdown (link)

for: `page`

```
[{{title}}]({{url}})
```

### Markdown (quote)

for: `selection`

```
{{#texts}}
> {{.}}
{{/texts}}
>
> [{{title}}]({{url}})
```

### Markdown (link to text)

for: `selection`

```
{{#texts}}
> {{.}}
{{/texts}}
>
> [{{title}}]({{url_to_text}})
```
