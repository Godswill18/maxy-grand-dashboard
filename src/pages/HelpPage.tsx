import { useState, useMemo } from "react";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  MousePointerClick,
  X,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { getHelpDocsForRole, type HelpDoc } from "../data/helpDocs";

export default function HelpPage() {
  const { user } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // On mobile: null = showing list, non-null = showing detail
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const docs = useMemo(
    () => getHelpDocsForRole(user?.role ?? ""),
    [user?.role]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.steps.some(
          (s) =>
            s.step.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q)
        ) ||
        d.faqs.some(
          (f) =>
            f.question.toLowerCase().includes(q) ||
            f.answer.toLowerCase().includes(q)
        )
    );
  }, [docs, search]);

  const selected: HelpDoc | null =
    filtered.find((d) => d.id === selectedId) ?? null;

  function selectDoc(id: string) {
    setSelectedId(id);
    setMobileView("detail");
  }

  function goBackToList() {
    setMobileView("list");
  }

  // ── Shared sidebar content ────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-primary shrink-0" />
          <h1 className="text-base font-semibold text-foreground">Help & Guide</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search guides..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedId(null);
              setMobileView("list");
            }}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setSelectedId(null); setMobileView("list"); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Doc list */}
      <nav className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted-foreground text-center">
            No guides found.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((doc) => {
              const isActive = selected?.id === doc.id;
              return (
                <li key={doc.id}>
                  <button
                    onClick={() => selectDoc(doc.id)}
                    className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="line-clamp-2 leading-snug">{doc.title}</span>
                    <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-opacity ${isActive ? "opacity-100" : "opacity-40"}`} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {filtered.length} guide{filtered.length !== 1 ? "s" : ""} for your role
        </p>
      </div>
    </>
  );

  // ── Shared detail content ─────────────────────────────────────────────────
  const DetailContent = ({ doc }: { doc: HelpDoc }) => (
    <div className="px-4 py-6 sm:px-8 sm:py-8 space-y-8 max-w-3xl mx-auto w-full">
      {/* Title block */}
      <div className="pb-2 border-b border-border">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
          {doc.title}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {doc.description}
        </p>
      </div>

      {/* Steps */}
      {doc.steps.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-md bg-primary/10">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Step-by-Step Guide
            </h3>
          </div>
          <ol className="space-y-4">
            {doc.steps.map((s, i) => (
              <li key={i} className="flex gap-3 sm:gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0 pb-4 border-b border-border last:border-0 last:pb-0">
                  <p className="text-sm font-semibold text-foreground">{s.step}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Button reference */}
      {doc.buttons.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-md bg-primary/10">
              <MousePointerClick className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Button Reference
            </h3>
          </div>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {doc.buttons.map((b, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/30">
                <span className="inline-flex self-start items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0">
                  {b.label}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tips */}
      {doc.tips.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-md bg-amber-500/10">
              <Lightbulb className="h-4 w-4 text-amber-500" />
            </div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Tips
            </h3>
          </div>
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 divide-y divide-amber-100 dark:divide-amber-900/30 overflow-hidden">
            {doc.tips.map((tip, i) => (
              <div key={i} className="flex gap-3 px-4 py-3">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      {doc.faqs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-md bg-primary/10">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Frequently Asked Questions
            </h3>
          </div>
          <div className="space-y-3">
            {doc.faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/40 border-b border-border">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {faq.question}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  return (
    <>
      {/* ── MOBILE layout (< lg) ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:hidden h-[calc(100vh-4rem)] overflow-hidden bg-background">
        {mobileView === "list" ? (
          /* Mobile: Guide list */
          <div className="flex flex-col flex-1 overflow-hidden">
            <SidebarContent />
          </div>
        ) : (
          /* Mobile: Detail view */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Back bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background shrink-0">
              <button
                onClick={goBackToList}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                All Guides
              </button>
              {selected && (
                <span className="text-sm text-muted-foreground truncate">
                  / {selected.title}
                </span>
              )}
            </div>
            {/* Detail scroll area */}
            <div className="flex-1 overflow-y-auto">
              {selected ? (
                <DetailContent doc={selected} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-3">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Select a guide from the list.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP layout (≥ lg) ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
        {/* Sidebar */}
        <aside className="w-72 xl:w-80 shrink-0 border-r border-border flex flex-col">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {selected ? (
            <DetailContent doc={selected} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-3">
              <BookOpen className="h-14 w-14 text-muted-foreground/20" />
              <p className="text-base font-medium text-foreground">Pick a guide to get started</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Select any topic from the sidebar to read step-by-step instructions, button explanations, tips, and FAQs.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
