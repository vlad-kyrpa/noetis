import { Hono } from "hono";

type Bindings = {
  secret: 0;
  // secrets, db creds
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/api/hello", (context) => {
  return context.json({ message: "hello world" });
});

app.get("/api/health", (context) => {
  return context.json({ ok: true });
});

app.notFound((context) => context.json({ error: "Not found" }, 404));

export default app;
