/* ═══════════════════════════════════════════════════════
   RENDER.JS  —  All DOM rendering functions
   ═══════════════════════════════════════════════════════ */

import { store, getActiveProject } from './storage.js';
import { AREA_LABELS, getProjectStatusSummary } from './data.js';
import { escHtml, formatDate, highlightTimeline, highlightTimelineRange } from './utils.js';

/* ───── HELPERS ───── */
function updateNavButtons() {
  const proj = getActiveProject();
  document.getElementById("predPrev").disabled   = store.predictabilityIndex >= proj.predictabilityHistory.length - 1;
  document.getElementById("predNext").disabled   = store.predictabilityIndex <= 0;
  document.getElementById("surveyPrev").disabled = store.currentIndex >= proj.surveyHistory.length - 1;
  document.getElementById("surveyNext").disabled = store.currentIndex <= 0;
}

/* ───── RENDER: PROJECT LIST ───── */

export function renderProjectList() {
  const ul = document.getElementById("projectListItems");
  ul.innerHTML = "";

  store.allProjects.forEach(proj => {
    const { status, score } = getProjectStatusSummary(proj);
    const isActive = proj.id === store.activeProjectId;

    const statusDot = status
      ? `<span class="status-dot ${status}" style="flex-shrink:0;"></span>`
      : `<span class="status-dot" style="background:#ccc;flex-shrink:0;"></span>`;

    const scoreChip = score !== null
      ? `<span class="project-list-score">${score}</span>`
      : "";

    const li = document.createElement("li");
    li.className  = "project-list-item" + (isActive ? " active" : "");
    li.dataset.id = proj.id;

    // Use data attributes instead of inline onclick
    li.innerHTML = `
      <button class="project-list-btn" data-action="switch-project" data-id="${proj.id}">
        ${statusDot}
        <span class="project-list-name">${escHtml(proj.project.name)}</span>
        ${scoreChip}
      </button>
      <button class="project-list-delete btn btn-sm btn-danger" data-action="delete-project" data-id="${proj.id}" title="Usuń projekt">🗑</button>
    `;
    ul.appendChild(li);
  });
}

/* ───── RENDER: PREDICTABILITY ───── */

export function renderPredictability() {
  const proj = getActiveProject();
  const p    = proj.predictabilityHistory[store.predictabilityIndex];
  updateNavButtons();

  if (!p) {
    document.getElementById("predictabilityDate").innerText  = "Ankieta przewidywalności";
    document.getElementById("predictabilityScore").innerText = "-";
    document.getElementById("predictabilityLevel").innerHTML =
      `<div class="empty-state">✔ Brak ankiet przewidywalności</div>`;
    document.getElementById("areaScores").innerHTML = "";
    document.getElementById("predComment").innerHTML = "";
    return;
  }

  document.getElementById("predictabilityDate").innerText =
    `Ankieta przewidywalności (${p.date})`;
  document.getElementById("predictabilityScore").innerText = p.score;
  document.getElementById("predictabilityLevel").innerHTML = `<strong>${p.level}</strong>`;

  const predCommentEl      = document.getElementById("predComment");
  const predCommentDetails = document.getElementById("predCommentDetails");
  if (p.notes) {
    predCommentEl.innerText = p.notes;
    predCommentDetails.removeAttribute("data-empty");
  } else {
    predCommentEl.innerHTML = `<div class="empty-state">✔ Brak komentarza do tej ankiety</div>`;
    predCommentDetails.setAttribute("data-empty", "true");
  }

  renderAreaScores(p);
}

export function renderAreaScores(p) {
  const container = document.getElementById("areaScores");
  container.innerHTML = "";
  const getColor = v => (v >= 4 ? "G" : v >= 3 ? "A" : "R");

  Object.entries(p.areas).forEach(([key, value]) => {
    const label = AREA_LABELS[key] || key;
    const el    = document.createElement("div");
    el.className = "kpi";
    el.innerHTML = `
      <div class="kpi-title">${label}</div>
      <div class="kpi-value-wrap">
        <span class="status-dot ${getColor(value)}"></span>
        <span class="kpi-value">${value.toFixed(1)}</span>
      </div>
    `;
    container.appendChild(el);
  });
}

/* ───── RENDER: SURVEY ───── */

export function renderSurvey() {
  const proj   = getActiveProject();
  const survey = proj.surveyHistory[store.currentIndex];
  const prev   = proj.surveyHistory[store.currentIndex + 1];
  updateNavButtons();

  if (!survey) {
    document.getElementById("surveyDate").innerText  = "Ankieta statusowa";
    document.getElementById("status").innerText      = "BRAK DANYCH";
    document.getElementById("score").innerText       = "-";
    document.getElementById("trend").style.display   = "none";
    document.getElementById("summary").innerHTML     =
      `<div class="empty-state">✔ Brak ankiet statusowych — dodaj pierwszą</div>`;
    document.getElementById("kpis").innerHTML        = "";
    document.getElementById("pmComment").innerHTML   = "";
    document.getElementById("risks").innerHTML       =
      `<div class="empty-state">✔ Brak istotnych ryzyk</div>`;
    document.getElementById("actions").innerHTML     =
      `<div class="empty-state">✔ Brak działań do wykonania</div>`;
    return;
  }

  const statusMap = { G: "🟢 DOBRY", A: "🟡 UWAGA", R: "🔴 ZAGROŻONY" };

  document.getElementById("surveyDate").innerText = `Ankieta statusowa (${survey.week})`;
  document.getElementById("status").innerText     = statusMap[survey.status] || survey.status;
  document.getElementById("score").innerText      = survey.score;

  const trendEl = document.getElementById("trend");
  if (prev) {
    const diff = survey.score - prev.score;
    trendEl.innerText =
      diff === 0 ? "→ bez zmian"          :
      diff  > 0  ? `📈 +${diff} vs last week` :
                   `📉 ${diff} vs last week`;
    trendEl.style.display = "";
  } else {
    trendEl.style.display = "none";
  }

  document.getElementById("summary").innerText = survey.summary;

  // Criteria KPIs
  const kpiEl = document.getElementById("kpis");
  kpiEl.innerHTML = "";
  if (survey.criteria) {
    Object.values(survey.criteria).forEach(k => {
      const el = document.createElement("div");
      el.className = "kpi";
      el.innerHTML = `
        <div class="kpi-title">${k.name}</div>
        <div class="kpi-value-wrap">
          <span class="status-dot ${k.value}"></span>
          <span class="kpi-value">${k.label}</span>
        </div>
      `;
      kpiEl.appendChild(el);
    });
  }

  // PM comment
  const commentEl      = document.getElementById("pmComment");
  const commentDetails = document.getElementById("pmCommentDetails");
  if (survey.comment) {
    commentEl.innerText = survey.comment;
    commentDetails.removeAttribute("data-empty");
  } else {
    commentEl.innerHTML = `<div class="empty-state">✔ Brak komentarza PM dla tej ankiety</div>`;
    commentDetails.setAttribute("data-empty", "true");
  }

  // Risks
  document.getElementById("risks").innerHTML =
    !survey.risks || !survey.risks.length
      ? `<div class="empty-state">✔ Brak istotnych ryzyk</div>`
      : survey.risks.map(r => `<div class="item">⚠ ${r}</div>`).join("");

  // Actions
  document.getElementById("actions").innerHTML =
    !survey.actions || !survey.actions.length
      ? `<div class="empty-state">✔ Brak działań do wykonania</div>`
      : survey.actions.map(a => `<div class="item">• ${a}</div>`).join("");
}

/* ───── RENDER: TASKS ───── */

export function renderTasks() {
  const proj = getActiveProject();
  const el   = document.getElementById("tasks");
  el.innerHTML = "";

  if (!proj.plans.tasks || !proj.plans.tasks.length) {
    el.innerHTML = `<div class="empty-state">✔ Brak zadań</div>`;
    return;
  }

  proj.plans.tasks.forEach(t => {
    const badge =
      t.status === "done"        ? "✔ DONE"        :
      t.status === "in_progress" ? "⏳ IN PROGRESS" :
      t.status === "blocked"     ? "⛔ BLOCKED"     :
                                   "• TODO";
    const div = document.createElement("div");
    div.className = `task ${t.status}`;
    div.innerHTML = `
      <strong>${escHtml(t.name)}</strong>
      <span class="badge">${badge}</span><br>
      Owner: ${escHtml(t.owner)}<br>
      Due: ${escHtml(t.due)}
    `;
    el.appendChild(div);
  });
}

/* ───── RENDER: TIMELINE ───── */

export function renderTimeline() {
  const proj = getActiveProject();
  const el   = document.getElementById("timeline");
  el.innerHTML = "";

  if (!proj.plans.timeline || !proj.plans.timeline.length) {
    el.innerHTML = `<div class="empty-state">✔ Brak wpisów w timeline</div>`;
    if (store.fp) { store.fp.set("enable", [formatDate(new Date())]); store.fp.redraw(); }
    return;
  }

  proj.plans.timeline.forEach((m, idx) => {
    const icon      = m.status === "done" ? "✔" : m.status === "in_progress" ? "⏳" : "•";
    const rangeText = m.start ? `${m.start} → ${m.date}` : m.date;

    const div = document.createElement("div");
    div.className     = "timeline-item";
    div.dataset.date  = m.date;
    div.dataset.start = m.start || m.date;
    div.dataset.index = idx;

    div.innerHTML = `
      <span>${icon} ${escHtml(m.milestone)}</span>
      <span class="timeline-item-actions">
        ${m.isUpdated ? '<span class="dot"></span>' : ""}
        ${rangeText}
        <span class="delete-btn" data-action="edit-timeline" data-index="${idx}" title="Edytuj">✏️</span>
        <span class="delete-btn" data-action="delete-timeline" data-index="${idx}" title="Usuń">🗑</span>
      </span>
    `;

    div.addEventListener("click", e => {
      // Ignore clicks on action buttons
      if (e.target.dataset.action) return;
      store.fp.setDate([m.start || m.date, m.date], true);
      highlightTimelineRange(new Date(m.start || m.date), new Date(m.date));
    });

    el.appendChild(div);
  });
}

/* ───── RENDER: PROJECT DOCS ───── */

export function renderProjectDocs() {
  const proj      = getActiveProject();
  const container = document.getElementById("projectDocs");

  if (!proj.project.documents) { container.innerHTML = ""; return; }

  container.innerHTML = proj.project.documents.map((doc, index) => {
    const hasUrl = doc.url && doc.url.trim() !== "";

    if (hasUrl) {
      return `
        <div class="project-doc-row">
          <a class="project-doc-btn" href="${escHtml(doc.url)}" target="_blank">
            ${escHtml(doc.label)}
            <span class="project-doc-edit-icon" data-action="open-doc-modal" data-index="${index}">✏</span>
          </a>
        </div>
      `;
    } else {
      return `
        <div class="project-doc-row">
          <button class="project-doc-btn disabled" data-action="open-doc-modal" data-index="${index}" style="pointer-events:auto; opacity:0.6;">
            ${escHtml(doc.label)}
            <span class="project-doc-edit-icon" style="opacity:1;">✏</span>
          </button>
        </div>
      `;
    }
  }).join("");
}

/* ───── RENDER: DASHBOARD (all sections) ───── */

export function renderDashboard() {
  const proj = getActiveProject();

  document.getElementById("projectTitle").innerText = proj.project.name;

  renderProjectDocs();
  renderSurvey();
  renderTasks();
  renderTimeline();
  renderPredictability();
  // initCalendar is called by the caller (app.js) to avoid circular dependency
}
