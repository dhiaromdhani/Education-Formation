import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";
async function get(path, signal) {
  const r = await fetch(API + path, { signal, cache: "no-store" });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `API indisponible (${r.status})`);
  return data;
}
const FORM_FIELDS = {
  personnes: [
    ["nom", "Nom complet", "text"],
    ["email", "Email", "email"],
    ["telephone", "Téléphone", "text"],
    ["dateNaissance", "Date de naissance", "date"],
    ["niveauMaitrise", "Niveau de maîtrise", "number"],
  ],
  organismes: [
    ["nom", "Nom", "text"],
    ["ville", "Ville", "text"],
    ["secteurActivite", "Secteur d’activité", "text"],
  ],
};
function App() {
  const [page, setPage] = useState("dashboard"),
    [schema, setSchema] = useState({ personnes: [], organismes: [] }),
    [stats, setStats] = useState(null),
    [rows, setRows] = useState([]),
    [q, setQ] = useState(""),
    [type, setType] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [detail, setDetail] = useState(null),
    [detailError, setDetailError] = useState(""),
    [selected, setSelected] = useState(null),
    [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState(null),
    [saving, setSaving] = useState(false),
    [formError, setFormError] = useState(""),
    [notice, setNotice] = useState(""),
    [sync, setSync] = useState("Connexion au fichier…");
  const lastRevision = useRef(null);
  useEffect(() => {
    const c = new AbortController();
    let busy = false;
    async function tick() {
      if (busy) return;
      busy = true;
      try {
        const data = await get("/health", c.signal);
        if (lastRevision.current !== data.revision) {
          lastRevision.current = data.revision;
          setRetry((x) => x + 1);
        }
        setSync("Fichier surveillé · toutes les 2 s");
      } catch (e) {
        if (e.name !== "AbortError")
          setSync("Synchronisation indisponible : " + e.message);
      } finally {
        busy = false;
      }
    }
    tick();
    const timer = setInterval(tick, 2000);
    return () => {
      clearInterval(timer);
      c.abort();
    };
  }, []);
  async function openCreate() {
    setFormError("");
    setNotice("");
    try {
      const h = await get("/health");
      setEditor({
        module: page,
        id: null,
        revision: h.revision,
        type: page === "personnes" ? "Personne" : "Organisme",
        fields: Object.fromEntries(FORM_FIELDS[page].map(([k]) => [k, ""])),
      });
    } catch (e) {
      setError(e.message);
    }
  }
  function openEdit() {
    setFormError("");
    setNotice("");
    const fields = Object.fromEntries(
      FORM_FIELDS[selected.module].map(([k]) => [
        k,
        detail.attributes.find((a) => a.property === k)?.value || "",
      ]),
    );
    setEditor({
      module: selected.module,
      id: detail.id,
      revision: detail.revision,
      type: detail.types.join(", "),
      fields,
      original: { ...fields },
    });
    setSelected(null);
  }
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError("");
    try {
      const fields = editor.id
        ? Object.fromEntries(
            Object.entries(editor.fields).filter(
              ([k, v]) => v !== editor.original[k],
            ),
          )
        : editor.fields;
      if (!Object.keys(fields).length) {
        setFormError("Aucune modification à enregistrer.");
        return;
      }
      const r = await fetch(
        API +
          "/" +
          editor.module +
          (editor.id ? "/" + encodeURIComponent(editor.id) : ""),
        {
          method: editor.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            revision: editor.revision,
            type: editor.type,
            fields,
          }),
        },
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Enregistrement impossible");
      setEditor(null);
      setNotice(
        "Enregistré dans formation.ttl. Rechargez l’ontologie dans Protégé pour voir cette modification.",
      );
      setQ("");
      setType("");
      setRetry((x) => x + 1);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }
  useEffect(() => {
    const c = new AbortController();
    setError("");
    Promise.all([get("/schema", c.signal), get("/stats", c.signal)])
      .then(([a, b]) => {
        setSchema(a);
        setStats(b);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [retry]);
  useEffect(() => {
    if (page === "dashboard") return;
    const c = new AbortController();
    setLoading(true);
    setError("");
    get(`/${page}?` + new URLSearchParams({ q, type }), c.signal)
      .then(setRows)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [page, q, type, retry]);
  useEffect(() => {
    if (!selected) return;
    const c = new AbortController();
    setDetail(null);
    setDetailError("");
    get(`/${selected.module}/${encodeURIComponent(selected.id)}`, c.signal)
      .then(setDetail)
      .catch((e) => {
        if (e.name !== "AbortError") setDetailError(e.message);
      });
    return () => c.abort();
  }, [selected, retry]);
  useEffect(() => {
    if (!selected) return;
    const close = (e) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selected]);
  const navigate = (p) => {
    setPage(p);
    setQ("");
    setType("");
    setSelected(null);
  };
  return (
    <div className="layout">
      <aside>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("dashboard");
          }}
        >
          <span className="logo">S</span>StackUnity
          <span className="dot">.</span>
        </a>
        <p className="small">ÉDUCATION & FORMATION</p>
        <div className="space">ESPACE UTILISATEUR</div>
        <nav>
          {[
            ["dashboard", "◈", "Vue d’ensemble"],
            ["personnes", "♙", "Personnes"],
            ["organismes", "▦", "Organismes"],
          ].map(([p, i, t]) => (
            <button
              className={page === p ? "active" : ""}
              onClick={() => navigate(p)}
              key={p}
            >
              <span>{i}</span>
              {t}
            </button>
          ))}
        </nav>
        <div className="team">
          <strong>Un projet, cinq membres</strong>
          <p>
            Votre module :<br />
            Personne & Organisme
          </p>
          <span className="badge">Graphe RDF · SPARQL</span>
        </div>
        <footer>StackUnity / Projet Web sémantique</footer>
      </aside>
      <main>
        <header>
          <span>Plateforme d’apprentissage</span>
          <div className="visitor">
            <span className="avatar">V</span> Visiteur{" "}
            <small>Édition locale</small>
          </div>
        </header>
        <div className="content">
          <div className="eyebrow">EXPLORER LE SAVOIR CONNECTÉ</div>
          <h1>
            {page === "dashboard"
              ? "Votre communauté, connectée."
              : page === "personnes"
                ? "Annuaire des personnes"
                : "Explorer les organismes"}
          </h1>
          <p className="intro">
            {page === "dashboard"
              ? "Découvrez les acteurs, leurs compétences et les organismes de notre écosystème éducatif."
              : "Retrouvez les informations et les relations issues de l’ontologie StackUnity."}
          </p>
          <p className="sync-status" role="status">
            {sync}
          </p>
          {notice && (
            <p className="success" role="status">
              {notice}
            </p>
          )}
          {error && (
            <div className="error" role="alert">
              {error}{" "}
              <button onClick={() => setRetry((x) => x + 1)}>Réessayer</button>
            </div>
          )}
          {page === "dashboard" ? (
            <>
              <section className="stats">
                {[
                  ["Personnes", stats?.personnes, "personnes"],
                  ["Organismes¹", stats?.organismes, "organismes"],
                  ["Classes de l’ontologie", stats?.classes],
                  ["Individus", stats?.individus],
                ].map(([label, n, p]) => (
                  <div className="stat" key={label}>
                    <span>{label}</span>
                    <strong>{n ?? "—"}</strong>
                    {p ? (
                      <button onClick={() => navigate(p)}>Explorer ↗</button>
                    ) : (
                      <small>Dans le fichier fourni</small>
                    )}
                  </div>
                ))}
              </section>
              <section className="hero">
                <div>
                  <span className="badge">VOTRE RÉSEAU DE CONNAISSANCES</span>
                  <h2>
                    Des personnes.
                    <br />
                    Des liens. Des possibilités.
                  </h2>
                  <p>
                    Un annuaire sémantique pour comprendre qui enseigne, qui
                    apprend et comment les organismes interagissent.
                  </p>
                  <button
                    className="primary"
                    onClick={() => navigate("personnes")}
                  >
                    Découvrir les personnes →
                  </button>
                </div>
                <div className="network" aria-hidden="true">
                  <div className="orbit"></div>
                  <span className="node center">StackUnity</span>
                  <span className="node n1">Personne</span>
                  <span className="node n2">Compétence</span>
                  <span className="node n3">Organisme</span>
                  <span className="node n4">Formation</span>
                </div>
              </section>
              <h2>Commencer l’exploration</h2>
              <div className="explore">
                {[
                  [
                    "personnes",
                    "01",
                    "Les personnes",
                    "Apprenants, enseignants, tuteurs et personnel médical.",
                  ],
                  [
                    "organismes",
                    "02",
                    "Les organismes",
                    "Universités, entreprises, laboratoires et hiérarchie existante.",
                  ],
                ].map(([p, n, t, d]) => (
                  <button key={p} onClick={() => navigate(p)}>
                    <small>{n} / ANNUAIRE</small>
                    <h3>{t} ↗</h3>
                    <p>{d}</p>
                  </button>
                ))}
              </div>
              <p className="note">
                ¹ Le total inclut les stages et conventions : ils descendent
                d’Organisme dans le fichier fourni.
              </p>
            </>
          ) : (
            <>
              <button className="primary add-button" onClick={openCreate}>
                +{" "}
                {page === "personnes"
                  ? "Ajouter une personne"
                  : "Ajouter un organisme"}
              </button>
              <div className="filters">
                <label>
                  Rechercher
                  <input
                    placeholder="Nom, ville, email…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </label>
                <label>
                  Classe
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">Toutes les classes</option>
                    {schema[page].map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <span>
                  {loading ? "Chargement…" : `${rows.length} résultat(s)`}
                </span>
              </div>
              {page === "organismes" && (
                <p className="note">
                  La hiérarchie actuelle inclut Stage sous Organisme. Le filtre
                  « Entreprise » affiche les entreprises et leurs sous-classes.
                </p>
              )}
              <div className="cards">
                {!loading &&
                  !error &&
                  rows.map((r) => (
                    <article key={r.id}>
                      <div className="cardtop">
                        <div className="entityicon">{r.nom.slice(0, 1)}</div>
                        <span className="tag">{r.types.join(" · ")}</span>
                      </div>
                      <h3>{r.nom}</h3>
                      <p>
                        {page === "personnes"
                          ? r.email || "Email non renseigné"
                          : r.ville || "Ville non renseignée"}
                      </p>
                      <p className="muted">
                        {page === "personnes"
                          ? r.telephone || "Téléphone non renseigné"
                          : r.secteurActivite || "Secteur non renseigné"}
                      </p>
                      <button
                        className="link"
                        onClick={() => {
                          setSelected({ module: page, id: r.id });
                        }}
                      >
                        Consulter la fiche →
                      </button>
                    </article>
                  ))}
              </div>
              {!loading && !error && rows.length === 0 && (
                <p className="empty">Aucun résultat pour ces critères.</p>
              )}
            </>
          )}
        </div>
      </main>
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Fiche de l’individu"
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="close"
              aria-label="Fermer"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
            {detailError ? (
              <p role="alert">{detailError}</p>
            ) : !detail ? (
              <p>Chargement de la fiche…</p>
            ) : (
              <>
                <div className="eyebrow">FICHE SÉMANTIQUE</div>
                <h2>{detail.nom}</h2>
                <p className="tag">{detail.types.join(" · ")}</p>
                <code>{detail.uri}</code>
                <button className="primary" onClick={openEdit}>
                  Modifier les informations
                </button>
                <h3>Informations</h3>
                <dl>
                  {detail.attributes.map((a, i) => (
                    <div key={i}>
                      <dt>{a.label}</dt>
                      <dd>{a.value}</dd>
                    </div>
                  ))}
                </dl>
                <h3>Relations ({detail.relations.length})</h3>
                {detail.relations.length === 0 ? (
                  <p>Aucune relation renseignée.</p>
                ) : (
                  detail.relations.map((r, i) => (
                    <div className="relation" key={i}>
                      <span>
                        {r.direction === "entrante" ? "←" : "→"} {r.label}
                        <small>{r.direction}</small>
                      </span>
                      <strong>{r.targetLabel}</strong>
                    </div>
                  ))
                )}
              </>
            )}
          </section>
        </div>
      )}
      {editor && (
        <div className="overlay">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Formulaire d’édition"
            className="modal"
          >
            <button
              disabled={saving}
              className="close"
              aria-label="Fermer le formulaire"
              onClick={() => setEditor(null)}
            >
              ×
            </button>
            <div className="eyebrow">ÉCRITURE DANS L’ONTOLOGIE</div>
            <h2>
              {editor.id ? "Modifier" : "Ajouter"}{" "}
              {editor.module === "personnes" ? "une personne" : "un organisme"}
            </h2>
            <p className="note">
              Les données sont sauvegardées dans le même fichier que celui
              ouvert dans Protégé.
            </p>
            <form className="edit-form" onSubmit={save}>
              <label>
                Classe
                <select
                  disabled={!!editor.id || saving}
                  value={editor.type}
                  onChange={(e) =>
                    setEditor({ ...editor, type: e.target.value })
                  }
                >
                  {editor.id ? (
                    <option value={editor.type}>{editor.type}</option>
                  ) : (
                    schema[editor.module].map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))
                  )}
                </select>
              </label>
              {FORM_FIELDS[editor.module].map(([key, label, type]) => (
                <label key={key}>
                  {label}
                  {key === "nom" ? " *" : ""}
                  <input
                    autoFocus={key === "nom"}
                    disabled={saving}
                    maxLength={500}
                    required={key === "nom"}
                    type={type}
                    step={type === "number" ? "1" : undefined}
                    value={editor.fields[key]}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        fields: { ...editor.fields, [key]: e.target.value },
                      })
                    }
                  />
                </label>
              ))}
              {formError && (
                <div className="error" role="alert">
                  {formError}
                </div>
              )}
              <div className="form-actions">
                <button disabled={saving} className="primary" type="submit">
                  {saving
                    ? "Enregistrement…"
                    : "Enregistrer dans formation.ttl"}
                </button>
                <button
                  disabled={saving}
                  type="button"
                  onClick={() => setEditor(null)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
