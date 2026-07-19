import { DurableObject } from "cloudflare:workers";

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

// Global directory: email -> userId, plus the user id list for monthly billing.
export class DirectoryRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.users = {}; // email -> userId
    ctx.blockConcurrencyWhile(async () => {
      this.users = (await ctx.storage.get("users")) || {};
    });
  }

  async save() {
    await this.ctx.storage.put("users", this.users);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/claim" && request.method === "POST") {
      const { email, userId } = await request.json();
      if (this.users[email] && this.users[email] !== userId) {
        return json({ error: "email_taken" }, 409);
      }
      this.users[email] = userId;
      await this.save();
      return json({ ok: true });
    }

    if (url.pathname === "/lookup" && request.method === "GET") {
      const email = url.searchParams.get("email") || "";
      const userId = this.users[email];
      return userId ? json({ userId }) : json({ error: "not_found" }, 404);
    }

    if (url.pathname === "/users" && request.method === "GET") {
      return json({ userIds: [...new Set(Object.values(this.users))] });
    }

    return json({ error: "not_found" }, 404);
  }
}
