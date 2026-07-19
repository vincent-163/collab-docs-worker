---
name: collab-docs
description: Read, create, and update documents on the collab-docs service (workers.v-163.top/docs) using a personal API key. Use when the user asks to list their documents, create a document, fetch or export document content, check revisions, or update a document title via the collab-docs API.
---

# Collab Docs API

Base URL: `https://workers.v-163.top/docs` (self-host: use your own prefix).

All endpoints require an API key, created in the web dashboard (`/docs/app` → API Keys).
Pass it as a bearer token:

```
Authorization: Bearer cdk_<userId>.<secret>
```

The key is shown only once at creation; store it (e.g. `op` / env var) and never commit it.

## Endpoints

All JSON. Document bodies use [Quill Delta](https://quilljs.com/docs/delta) format.

### Create a document

```bash
curl -sS -X POST "$BASE/api/v1/documents" \
  -H "Authorization: Bearer $KEY" -H "content-type: application/json" \
  -d '{"title": "会议纪要", "content": "纯文本内容"}'
```

Body options:
- `{"title": "...", "content": "plain text"}` — plain text seed
- `{"title": "...", "delta": {"ops": [...]}}` — rich content (only whitelisted attributes survive server-side sanitization: bold/italic/underline/strike/code/color/background/header/list/blockquote/code-block/link/image/table; links/images must be http(s))

Response: `{"document": {"document_id", "title", ...}, "url", "edit_url"}`.

### List my documents

```bash
curl -sS "$BASE/api/v1/documents" -H "Authorization: Bearer $KEY"
```

→ `{"documents": [{"document_id", "title", "created_at", "updated_at", "url"}, ...]}` (timestamps are epoch ms).

### Get document metadata / rename

```bash
curl -sS "$BASE/api/v1/documents/<id>" -H "Authorization: Bearer $KEY"
curl -sS -X PATCH "$BASE/api/v1/documents/<id>" \
  -H "Authorization: Bearer $KEY" -H "content-type: application/json" \
  -d '{"title": "新标题"}'
```

### Read content (current or historical revision)

```bash
curl -sS "$BASE/api/v1/documents/<id>/content" -H "Authorization: Bearer $KEY"
curl -sS "$BASE/api/v1/documents/<id>/content?rev=12" -H "Authorization: Bearer $KEY"
```

→ `{"document_id", "revision", "delta": {"ops": [...]}, "text"}`.
`text` is the flattened plain text — usually what you want. Very old revisions may return 410 (compacted).

### List revisions

```bash
curl -sS "$BASE/api/v1/documents/<id>/revisions?limit=50" -H "Authorization: Bearer $KEY"
```

### Export as Markdown / plain text

```bash
curl -sS "$BASE/api/v1/documents/<id>/export?format=markdown" -H "Authorization: Bearer $KEY" -o doc.md
curl -sS "$BASE/api/v1/documents/<id>/export?format=txt" -H "Authorization: Bearer $KEY" -o doc.txt
```

### Live collaborators

```bash
curl -sS "$BASE/api/v1/documents/<id>/collaborators" -H "Authorization: Bearer $KEY"
```

## Notes

- Only your own documents are accessible via the API (403 otherwise). Other people's docs require a share link opened in the browser UI.
- Realtime editing is WebSocket + OT in the browser editor at `/docs/d/<id>`; the REST API is for creation, reading, and metadata.
- There is no REST endpoint for appending content. To "write" content, create a new document with a `delta` body, or direct the user to the editor URL.
- Errors are `{"error": "<code>", "message"?}` with 4xx status.
