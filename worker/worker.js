/**
 * heute — publish worker
 *
 * Commits a new index.html to the repo so the owner can add videos live
 * without a static-site rebuild. The GitHub token lives ONLY here as a
 * secret — never on the public page.
 *
 * Secrets (wrangler secret put ...):
 *   GITHUB_TOKEN    fine-grained PAT, "Contents: read & write" on the repo
 *   PUBLISH_SECRET  shared secret the browser sends to authorise a commit
 *
 * Vars (wrangler.toml [vars]):
 *   REPO   e.g. "rquw/Heute"
 *   BRANCH e.g. "main"
 *   PATH   e.g. "index.html"
 */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST")
      return json(405, { error: "POST only" });

    let body;
    try { body = await request.json(); }
    catch { return json(400, { error: "bad json" }); }

    const { secret, html } = body || {};
    if (!secret || secret !== env.PUBLISH_SECRET) return json(401, { error: "unauthorized" });
    if (typeof html !== "string" || html.length < 1000 || html.length > 5_000_000)
      return json(400, { error: "html missing or implausible size" });

    const api = `https://api.github.com/repos/${env.REPO}/contents/${env.PATH}`;
    const gh = (extra) => fetch(extra ? `${api}?ref=${env.BRANCH}` : api, {
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "user-agent": "heute-worker",
      },
    });

    // current sha (required to update an existing file)
    const cur = await gh(true);
    if (!cur.ok && cur.status !== 404)
      return json(502, { error: "github read failed", status: cur.status });
    const sha = cur.ok ? (await cur.json()).sha : undefined;

    const put = await fetch(api, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "user-agent": "heute-worker",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "neues video (via add-tile)",
        content: b64utf8(html),
        branch: env.BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!put.ok) return json(502, { error: "github write failed", status: put.status });
    return json(200, { ok: true });
  },
};

const json = (status, obj) =>
  new Response(JSON.stringify(obj), {
    status, headers: { "content-type": "application/json", ...CORS },
  });

// base64 of a UTF-8 string (btoa alone breaks on non-ASCII)
const b64utf8 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
