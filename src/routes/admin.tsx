import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ARTICLE_CATEGORIES,
  createArticle,
  verifyAdminPassword,
  deleteArticle,
  seedDummyArticles,
  listArticles,
  type Article,
} from "@/lib/articles.functions";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { RichTextEditor } from "@/components/rich-text-editor";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Bharat Pulse" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

const STORAGE_KEY = "bp-admin-pw";

function AdminPage() {
  const [password, setPassword] = useState<string>(() =>
    typeof window !== "undefined" ? window.sessionStorage.getItem(STORAGE_KEY) ?? "" : "",
  );
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [authError, setAuthError] = useState("");

  const verify = useServerFn(verifyAdminPassword);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    setAuthError("");
    try {
      const res = await verify({ data: { password } });
      if (res.ok) {
        window.sessionStorage.setItem(STORAGE_KEY, password);
        setAuthed(true);
      } else {
        setAuthError("Incorrect password.");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 border-b-2 border-foreground pb-3">
          <h1 className="font-serif text-4xl font-bold">Admin · Publish article</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Shared-password access.
          </p>
        </div>

        {!authed ? (
          <form onSubmit={handleLogin} className="max-w-md space-y-4 font-sans">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Admin password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-border bg-card px-3 py-2 outline-none focus:border-primary"
                autoFocus
                required
              />
            </label>
            {authError && (
              <p className="text-sm text-destructive">{authError}</p>
            )}
            <button
              type="submit"
              disabled={checking || !password}
              className="rounded bg-primary px-5 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {checking ? "Checking…" : "Sign in"}
            </button>
          </form>
        ) : (
          <>
            <ArticleForm
              password={password}
              onSignOut={() => {
                window.sessionStorage.removeItem(STORAGE_KEY);
                setAuthed(false);
                setPassword("");
              }}
            />
            <ArticleManager password={password} />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function ArticleForm({ password, onSignOut }: { password: string; onSignOut: () => void }) {
  const navigate = useNavigate();
  const create = useServerFn(createArticle);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState<(typeof ARTICLE_CATEGORIES)[number]>(
    ARTICLE_CATEGORIES[0],
  );
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await create({
        data: {
          password,
          title,
          subtitle,
          body,
          category,
          author,
          cover_image_url: coverUrl,
        },
      });
      navigate({ to: "/article/$slug", params: { slug: res.slug } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-sans">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSignOut}
          className="font-sans text-xs text-muted-foreground underline"
        >
          Sign out
        </button>
      </div>

      <Field label="Headline" required>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded border border-border bg-card px-3 py-2 font-serif text-xl outline-none focus:border-primary"
        />
      </Field>

      <Field label="Standfirst (subtitle)">
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={300}
          className="w-full rounded border border-border bg-card px-3 py-2 font-serif outline-none focus:border-primary"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" required>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="w-full rounded border border-border bg-card px-3 py-2 outline-none focus:border-primary"
          >
            {ARTICLE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Author" required>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            maxLength={100}
            className="w-full rounded border border-border bg-card px-3 py-2 outline-none focus:border-primary"
          />
        </Field>
      </div>

      <Field label="Cover image URL">
        <input
          type="url"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://images.example.com/cover.jpg"
          className="w-full rounded border border-border bg-card px-3 py-2 outline-none focus:border-primary"
        />
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            className="mt-2 aspect-[16/9] w-full max-w-md object-cover"
          />
        )}
      </Field>

      <Field label="Body" required>
        <RichTextEditor value={body} onChange={setBody} />
      </Field>

      {error && (
        <p className="rounded border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-primary px-6 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Publishing…" : "Publish article"}
        </button>
      </div>
    </form>
  );
}

function ArticleManager({ password }: { password: string }) {
  const qc = useQueryClient();
  const deleteFn = useServerFn(deleteArticle);
  const seedFn = useServerFn(seedDummyArticles);

  const [articles, setArticles] = useState<Article[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { load(); }, []);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await listArticles();
      setArticles(res.articles);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    if (!confirm("Insert dummy articles? Existing slugs will be skipped.")) return;
    setSeeding(true);
    setMsg("");
    try {
      const res = await seedFn({ data: { password } });
      setMsg(`Seeded ${res.inserted} new article(s).`);
      await load();
      qc.invalidateQueries({ queryKey: ["articles"] });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    setDeletingId(id);
    setMsg("");
    try {
      await deleteFn({ data: { password, id } });
      setArticles((prev) => prev?.filter((a) => a.id !== id) ?? null);
      qc.invalidateQueries({ queryKey: ["articles"] });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-14 border-t-2 border-foreground pt-8 font-sans">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold">Manage Articles</h2>
        <div className="flex gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="rounded border border-border px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
          >
            {seeding ? "Seeding…" : "Seed dummy articles"}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="rounded bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Loading…" : articles === null ? "Load articles" : "Refresh"}
          </button>
        </div>
      </div>

      {msg && (
        <p className="mb-4 rounded border border-border bg-muted px-3 py-2 text-sm">{msg}</p>
      )}

      {articles !== null && (
        <div className="space-y-0 divide-y divide-border rounded border border-border">
          {articles.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No articles yet.</p>
          )}
          {articles.map((a) => (
            <div key={a.id} className="flex items-start gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-base font-semibold leading-tight">{a.title}</p>
                <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
                  {a.category} · {a.author} ·{" "}
                  {new Date(a.published_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a.id, a.title)}
                disabled={deletingId === a.id}
                className="shrink-0 rounded px-3 py-1 text-xs font-semibold text-destructive ring-1 ring-destructive/40 transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                {deletingId === a.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </span>
      {children}
    </label>
  );
}
