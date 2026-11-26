import { useCallback, useEffect, useId, useRef, useState } from "react";
import { downloadPdf, fetchPreview, fetchTemplates } from "./api.js";
import "./App.css";

const EMPTY_FORM = {
  vards: "",
  uzvards: "",
  iestade: "",
  datums: "",
  saturs: "",
};

function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const FIELDS = [
  { name: "vards", label: "Vārds", autoComplete: "given-name" },
  { name: "uzvards", label: "Uzvārds", autoComplete: "family-name" },
];

export default function App() {
  const baseId = useId();
  const previewRequest = useRef(0);
  const [templates, setTemplates] = useState([]);
  const [templatesError, setTemplatesError] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, datums: todayISO() }));
  const [preview, setPreview] = useState(null);
  const [previewState, setPreviewState] = useState("idle");
  const [previewError, setPreviewError] = useState("");
  const [exportState, setExportState] = useState("idle");
  const [exportError, setExportError] = useState("");

  const template = templates.find((item) => item.id === templateId) ?? templates[0] ?? null;

  useEffect(() => {
    let active = true;

    fetchTemplates()
      .then((items) => {
        if (!active) return;
        setTemplates(items);
        setTemplateId((current) => current || items[0].id);
        setTemplatesError("");
      })
      .catch((error) => {
        if (!active) return;
        setTemplatesError(error.message || "Neizdevās ielādēt veidnes.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!templateId) return undefined;

    const requestId = previewRequest.current + 1;
    previewRequest.current = requestId;
    const handle = setTimeout(() => {
      setPreviewState("loading");
      fetchPreview({ templateId, ...form })
        .then((document) => {
          if (previewRequest.current !== requestId) return;
          setPreview(document);
          setPreviewError("");
          setPreviewState("ready");
        })
        .catch((error) => {
          if (previewRequest.current !== requestId) return;
          setPreviewError(error.message || "Neizdevās sagatavot priekšskatījumu.");
          setPreviewState("error");
        });
    }, 200);

    return () => clearTimeout(handle);
  }, [templateId, form]);

  const updateField = useCallback((name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  }, []);

  const handleDownload = useCallback(async () => {
    if (!templateId || exportState === "working") return;

    setExportError("");
    setExportState("working");

    try {
      await downloadPdf({ templateId, ...form });
      setExportState("done");
    } catch (error) {
      setExportError(error.message || "Neizdevās sagatavot PDF. Mēģiniet vēlreiz.");
      setExportState("error");
    }
  }, [exportState, form, templateId]);

  const lines = preview?.lines ?? [];

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            Dģ
          </span>
          <div>
            <p className="eyebrow">Dokumentu sagatavošana</p>
            <h1>Dokumentu ģenerators</h1>
          </div>
        </div>
        <button
          type="button"
          className={exportState === "working" ? "download-button is-busy" : "download-button"}
          onClick={handleDownload}
          disabled={!templateId || exportState === "working"}
        >
          {exportState === "working" ? "Sagatavo PDF…" : "Lejupielādēt PDF"}
        </button>
      </header>

      {templatesError ? (
        <p className="form-error" role="alert">
          {templatesError}
        </p>
      ) : (
        <>
          <div className="template-list" role="radiogroup" aria-label="Dokumenta veidne">
            {templates.map((item) => {
              const selected = item.id === template?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={selected ? "template-card is-selected" : "template-card"}
                  onClick={() => setTemplateId(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="template-description">{template?.description ?? "Ielādē veidnes…"}</p>
        </>
      )}

      <main className="layout">
        <section className="panel" aria-labelledby={`${baseId}-form-title`}>
          <h2 id={`${baseId}-form-title`}>Dokumenta dati</h2>
          <p className="lead">Aizpildiet laukus. Priekšskatījumu sagatavo serveris.</p>

          <div className="form-grid">
            <div className="name-row">
              {FIELDS.map((field) => (
                <label key={field.name} className="field" htmlFor={`${baseId}-${field.name}`}>
                  <span>{field.label}</span>
                  <input
                    id={`${baseId}-${field.name}`}
                    name={field.name}
                    autoComplete={field.autoComplete}
                    value={form[field.name]}
                    onChange={(event) => updateField(field.name, event.target.value)}
                  />
                </label>
              ))}
            </div>

            <label className="field" htmlFor={`${baseId}-iestade`}>
              <span>Iestāde</span>
              <input
                id={`${baseId}-iestade`}
                name="iestade"
                autoComplete="organization"
                value={form.iestade}
                onChange={(event) => updateField("iestade", event.target.value)}
              />
            </label>

            <label className="field" htmlFor={`${baseId}-datums`}>
              <span>Datums</span>
              <input
                id={`${baseId}-datums`}
                name="datums"
                type="date"
                value={form.datums}
                onChange={(event) => updateField("datums", event.target.value)}
              />
            </label>

            <label className="field" htmlFor={`${baseId}-saturs`}>
              <span>Dokumenta saturs</span>
              <textarea
                id={`${baseId}-saturs`}
                name="saturs"
                rows={9}
                placeholder="Ierakstiet dokumenta tekstu…"
                value={form.saturs}
                onChange={(event) => updateField("saturs", event.target.value)}
              />
            </label>
          </div>

          {exportError ? (
            <p className="form-error" role="alert">
              {exportError}
            </p>
          ) : null}

          <p className="privacy">
            Ievadītie dati tiek nosūtīti vietējam serverim, lai aizpildītu veidni un sagatavotu PDF. Tie netiek
            saglabāti datubāzē.
          </p>
        </section>

        <section className="preview-column" aria-labelledby={`${baseId}-preview-title`}>
          <div className="preview-heading">
            <h2 id={`${baseId}-preview-title`}>Priekšskatījums</h2>
            <p>{preview?.label || template?.label || ""}</p>
          </div>
          {previewError ? (
            <p className="form-error" role="alert">
              {previewError}
            </p>
          ) : null}
          {previewState === "loading" && !preview ? <p className="status">Sagatavo priekšskatījumu…</p> : null}
          <div className="preview-scroll">
            <article className="paper" aria-label="Sagatavotais dokuments" aria-busy={previewState === "loading"}>
              {lines.map((line, index) => {
                if (line.kind === "spacer") {
                  return <div key={index} className="doc-spacer" />;
                }
                if (line.kind === "title") {
                  return (
                    <h3 key={index} className="doc-title">
                      {line.text}
                    </h3>
                  );
                }
                return (
                  <p key={index} className="doc-line">
                    {line.text}
                  </p>
                );
              })}
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
