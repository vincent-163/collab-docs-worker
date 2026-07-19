import { DocRoom } from "./doc-room.js";
import { STYLE_CSS, CLIENT_JS } from "./static.js";
import { homePage, editorPage, notFoundPage } from "./pages.js";

export { DocRoom };

const ID_PATTERN = /^[A-Za-z0-9]{6,24}$/;
const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const html = (body, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

function randomId(length = 10) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = "";
  for (const b of bytes) id += ID_ALPHABET[b % ID_ALPHABET.length];
  return id;
}

function room(env, id) {
  return env.DOC_ROOMS.getByName(id);
}

async function createDocument(env, prefix, origin, { title = "", content = "" } = {}) {
  const id = randomId();
  const meta = await room(env, id).fetch("https://room/init", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, content })
  }).then((r) => r.json());
  return {
    document: { document_id: id, ...meta },
    url: `${origin}${prefix}/d/${id}`,
    edit_url: `${origin}${prefix}/d/${id}`
  };
}

async function proxyRoom(env, id, path, init) {
  const stub = room(env, id);
  return stub.fetch(`https://room${path}`, init);
}

async function roomOr404(env, id, path, init) {
  const response = await proxyRoom(env, id, path, init);
  if (response.status === 404) return null;
  return response;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const prefix = env.PUBLIC_PREFIX || "";
    const origin = url.origin;
    const path = url.pathname;
    const method = request.method;

    if (path === "/health") {
      return json({ ok: true, service: "collab-docs" });
    }

    if (path === "/" && method === "GET") {
      return html(homePage(prefix));
    }

    if (path === "/static/style.css") {
      return new Response(STYLE_CSS, { headers: { "content-type": "text/css; charset=utf-8", "cache-control": "public, max-age=300" } });
    }
    if (path === "/static/client.js") {
      return new Response(CLIENT_JS, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=300" } });
    }

    // Form-based anonymous creation from the homepage.
    if (path === "/new" && method === "POST") {
      const form = await request.formData().catch(() => null);
      const title = form ? String(form.get("title") || "") : "";
      const created = await createDocument(env, prefix, origin, { title });
      return Response.redirect(created.edit_url, 303);
    }

    // Editor page + websocket.
    const docMatch = path.match(/^\/d\/([A-Za-z0-9]{6,24})(\/ws)?$/);
    if (docMatch) {
      const id = docMatch[1];
      if (docMatch[2] === "/ws") {
        const response = await roomOr404(env, id, "/ws", request);
        return response || json({ error: "not_found" }, 404);
      }
      if (method !== "GET") return json({ error: "method_not_allowed" }, 405);
      const response = await roomOr404(env, id, "/meta");
      if (!response) return html(notFoundPage(prefix), 404);
      const meta = await response.json();
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      const forwarded = request.headers.get("x-forwarded-prefix");
      const wsUrl = `${wsProtocol}//${url.host}${forwarded || prefix}/d/${id}/ws`;
      return html(editorPage(prefix, id, meta.title, wsUrl));
    }

    // REST API.
    if (path === "/api/v1/documents" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      return json(await createDocument(env, prefix, origin, body), 201);
    }

    const apiMatch = path.match(/^\/api\/v1\/documents\/([A-Za-z0-9]{6,24})(\/[a-z]+)?$/);
    if (apiMatch) {
      const id = apiMatch[1];
      const sub = apiMatch[2] || "";
      if (!ID_PATTERN.test(id)) return json({ error: "bad_id" }, 400);

      if (sub === "" && method === "GET") {
        const response = await roomOr404(env, id, "/meta");
        if (!response) return json({ error: "not_found" }, 404);
        const meta = await response.json();
        return json({
          document: { document_id: id, ...meta },
          url: `${origin}${prefix}/d/${id}`,
          edit_url: `${origin}${prefix}/d/${id}`
        });
      }
      if (sub === "" && method === "PATCH") {
        const body = await request.json().catch(() => ({}));
        const response = await roomOr404(env, id, "/meta", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: body.title })
        });
        if (!response) return json({ error: "not_found" }, 404);
        return json({ document: { document_id: id, ...(await response.json()) } });
      }
      if (sub === "/content" && method === "GET") {
        const revParam = url.searchParams.get("rev");
        const response = await roomOr404(env, id, `/content${revParam ? `?rev=${encodeURIComponent(revParam)}` : ""}`);
        if (!response) return json({ error: "not_found" }, 404);
        const data = await response.json();
        if (!response.ok) return json(data, response.status);
        return json({ document_id: id, ...data });
      }
      if (sub === "/revisions" && method === "GET") {
        const limit = url.searchParams.get("limit") || "100";
        const response = await roomOr404(env, id, `/revisions?limit=${encodeURIComponent(limit)}`);
        if (!response) return json({ error: "not_found" }, 404);
        return json({ document_id: id, ...(await response.json()) });
      }
      if (sub === "/collaborators" && method === "GET") {
        const response = await roomOr404(env, id, "/collaborators");
        if (!response) return json({ error: "not_found" }, 404);
        return json({ document_id: id, ...(await response.json()) });
      }
      if (sub === "/export" && method === "GET") {
        const [metaRes, contentRes] = await Promise.all([
          roomOr404(env, id, "/meta"),
          roomOr404(env, id, "/content")
        ]);
        if (!metaRes || !contentRes) return json({ error: "not_found" }, 404);
        const meta = await metaRes.json();
        const { content } = await contentRes.json();
        const format = url.searchParams.get("format") || "markdown";
        const isTxt = format === "txt";
        const body = isTxt ? content : `# ${meta.title || "未命名文档"}\n\n${content}`;
        const filename = `${meta.title || "document"}-${id}.${isTxt ? "txt" : "md"}`;
        return new Response(body, {
          headers: {
            "content-type": `${isTxt ? "text/plain" : "text/markdown"}; charset=utf-8`,
            "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
          }
        });
      }
      return json({ error: "not_found" }, 404);
    }

    return json({ error: "not_found" }, 404);
  }
};
