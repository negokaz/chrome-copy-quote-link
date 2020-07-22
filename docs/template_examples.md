# 📝 Custom Template Examples

## Slack/Teams

### Slack/Teams (link)

for: `page`

```
<a href="{{url}}">{{title}}</a>
```

### Slack/Teams (quote)

for: `selection`

```
<blockquote>
{{#texts}}
<p>{{.}}</p>
{{/texts}}
<a href="{{url}}">{{title}}</a>
</blockquote>
```

### Slack/Teams (link to text)

for: `selection`

```
<blockquote>
{{#texts}}
<p>{{.}}</p>
{{/texts}}
<a href="{{url_to_text}}">{{title}}</a>
</blockquote>
```

### Slack/Teams (code)

for: `selection`

```
<pre>
{{text}}
</pre>
<p><a href="{{url_to_text}}">{{title}}</a></p>
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

### Markdown (code)

for: `selection`

<pre>
```
{{text}}
```
[{{title}}]({{url_to_text}})
</pre>
