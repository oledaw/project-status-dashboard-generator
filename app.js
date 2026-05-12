/* ═══════════════════════════════════════════════════════
   APP.JS  —  PMO Multi-Project Dashboard
   ═══════════════════════════════════════════════════════ */

/* ───── STATE ───── */

let allProjects        = [];
let activeProjectId    = null;

// Per-project view state
let currentIndex          = 0;
let predictabilityIndex   = 0;
let editingIndex          = -1;
let fp                    = null;
let editingDocIndex       = -1;

/* ───── STORAGE KEYS ───── */

const STORAGE_PROJECTS   = "pmo_projects";
const STORAGE_ACTIVE_ID  = "pmo_active_project_id";

/* ───── BOOT ───── */

function boot() {
  const raw = localStorage.getItem(STORAGE_PROJECTS);
  if (raw) {
    try { allProjects = JSON.parse(raw); } catch { allProjects = []; }
  }

  if (!allProjects.length) {
    allProjects = SEED_DATA;
    persistProjects();
  }

  const savedId = localStorage.getItem(STORAGE_ACTIVE_ID);
  const found   = allProjects.find(p => p.id === savedId);
  activeProjectId = found ? savedId : allProjects[0].id;

  resetViewIndexes();
  renderProjectList();
  renderDashboard();
}

/* ───── PERSISTENCE ───── */

function persistProjects() {
  localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(allProjects));
}

function persistActiveId() {
  localStorage.setItem(STORAGE_ACTIVE_ID, activeProjectId);
}

function saveState() {
  persistProjects();
  persistActiveId();
}

/* ───── ACTIVE PROJECT ACCESSOR ───── */

function getActiveProject() {
  return allProjects.find(p => p.id === activeProjectId) || allProjects[0];
}

function resetViewIndexes() {
  currentIndex        = 0;
  predictabilityIndex = 0;
  editingIndex        = -1;
  editingDocIndex     = -1;
}

/* ───── SWITCH PROJECT ───── */

function switchProject(id) {
  activeProjectId = id;
  resetViewIndexes();
  persistActiveId();
  renderProjectList();
  renderDashboard();

  // Close sidebar on mobile
  if (window.innerWidth <= 768) closeSidebar();
}

/* ───── RENDER DASHBOARD (all sections) ───── */

function renderDashboard() {
  const proj = getActiveProject();

  // Header
  document.getElementById("projectTitle").innerText = proj.project.name;

  renderProjectDocs();
  renderSurvey();
  renderTasks();
  renderTimeline();
  renderPredictability();
  initCalendar();
}

/* ───── RENDER: PROJECT LIST ───── */

function renderProjectList() {
  const ul = document.getElementById("projectListItems");
  ul.innerHTML = "";

  allProjects.forEach(proj => {
    const { status, score } = getProjectStatusSummary(proj);
    const isActive = proj.id === activeProjectId;

    const statusDot = status
      ? `<span class="status-dot ${status}" style="flex-shrink:0;"></span>`
      : `<span class="status-dot" style="background:#ccc;flex-shrink:0;"></span>`;

    const scoreChip = score !== null
      ? `<span class="project-list-score">${score}</span>`
      : "";

    const li = document.createElement("li");
    li.className = "project-list-item" + (isActive ? " active" : "");
    li.dataset.id = proj.id;
    li.innerHTML = `
      <button class="project-list-btn" onclick="switchProject('${proj.id}')">
        ${statusDot}
        <span class="project-list-name">${escHtml(proj.project.name)}</span>
        ${scoreChip}
      </button>
      <button class="project-list-delete btn btn-sm btn-danger" onclick="deleteProject('${proj.id}', event)" title="Usuń projekt">🗑</button>
    `;
    ul.appendChild(li);
  });
}

/* ───── ADD PROJECT ───── */

function addProject() {
  const name = prompt("Nazwa nowego projektu:");
  if (!name || !name.trim()) return;

  const newProj = DEFAULT_PROJECT_TEMPLATE();
  newProj.project.name = name.trim();
  allProjects.push(newProj);

  saveState();
  switchProject(newProj.id);
}

/* ───── DELETE PROJECT ───── */

function deleteProject(id, event) {
  event.stopPropagation();

  const proj = allProjects.find(p => p.id === id);
  if (!proj) return;
  if (!confirm(`Usunąć projekt „${proj.project.name}"? Tej operacji nie można cofnąć.`)) return;

  allProjects = allProjects.filter(p => p.id !== id);

  // Ensure at least one project exists
  if (!allProjects.length) {
    const blank = DEFAULT_PROJECT_TEMPLATE();
    blank.project.name = "Nowy Projekt";
    allProjects.push(blank);
  }

  if (activeProjectId === id) {
    activeProjectId = allProjects[0].id;
    resetViewIndexes();
  }

  saveState();
  renderProjectList();
  renderDashboard();
}

/* ───── DUPLICATE PROJECT ───── */

function duplicateProject() {
  const src  = getActiveProject();
  const copy = JSON.parse(JSON.stringify(src));
  copy.id        = crypto.randomUUID();
  copy.createdAt = new Date().toISOString();
  copy.project.name += " (kopia)";

  allProjects.push(copy);
  saveState();
  switchProject(copy.id);
}

/* ───── IMPORT PROJECT FROM JSON ───── */

function importProjectFromFile() {
  const input = document.createElement("input");
  input.type   = "file";
  input.accept = ".json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const projects = Array.isArray(data) ? data : [data];

        projects.forEach(p => {
          // Ensure fresh id to avoid collisions
          p.id = p.id && !allProjects.find(x => x.id === p.id)
            ? p.id
            : crypto.randomUUID();
          if (!p.createdAt) p.createdAt = new Date().toISOString();
          allProjects.push(p);
        });

        saveState();
        renderProjectList();
        // Switch to first imported
        switchProject(projects[0].id);
        alert(`Zaimportowano ${projects.length} projekt(ów).`);
      } catch {
        alert("Błąd pliku JSON. Sprawdź format.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ───── EXPORT ACTIVE PROJECT TO JSON ───── */

function exportActiveProject() {
  const proj = getActiveProject();
  const blob = new Blob([JSON.stringify(proj, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${proj.project.name.replace(/\s+/g, "_")}_export.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ───── EXPORT ALL PROJECTS TO JSON ───── */

function exportAllProjects() {
  const blob = new Blob([JSON.stringify(allProjects, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `pmo_all_projects_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ───── SIDEBAR TOGGLE ───── */

function toggleSidebar() {
  document.getElementById("appShell").classList.toggle("sidebar-open");
}

function closeSidebar() {
  document.getElementById("appShell").classList.remove("sidebar-open");
}

/* ───── HELPERS ───── */

const formatDate = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ───── NAV BUTTONS ───── */

function updateNavButtons() {
  const proj = getActiveProject();
  document.getElementById("predPrev").disabled  = predictabilityIndex >= proj.predictabilityHistory.length - 1;
  document.getElementById("predNext").disabled  = predictabilityIndex <= 0;
  document.getElementById("surveyPrev").disabled = currentIndex >= proj.surveyHistory.length - 1;
  document.getElementById("surveyNext").disabled = currentIndex <= 0;
}

/* ───── RENDER: PREDICTABILITY ───── */

function renderPredictability() {
  const proj = getActiveProject();
  const p    = proj.predictabilityHistory[predictabilityIndex];
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

function renderAreaScores(p) {
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

function renderSurvey() {
  const proj   = getActiveProject();
  const survey = proj.surveyHistory[currentIndex];
  const prev   = proj.surveyHistory[currentIndex + 1];
  updateNavButtons();

  if (!survey) {
    document.getElementById("surveyDate").innerText   = "Ankieta statusowa";
    document.getElementById("status").innerText       = "BRAK DANYCH";
    document.getElementById("score").innerText        = "-";
    document.getElementById("trend").style.display    = "none";
    document.getElementById("summary").innerHTML      =
      `<div class="empty-state">✔ Brak ankiet statusowych — dodaj pierwszą</div>`;
    document.getElementById("kpis").innerHTML         = "";
    document.getElementById("pmComment").innerHTML    = "";
    document.getElementById("risks").innerHTML        =
      `<div class="empty-state">✔ Brak istotnych ryzyk</div>`;
    document.getElementById("actions").innerHTML      =
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
    trendEl.innerText  =
      diff === 0 ? "→ bez zmian"          :
      diff  > 0  ? `📈 +${diff} vs last week` :
                   `📉 ${diff} vs last week`;
    trendEl.style.display = "";
  } else {
    trendEl.style.display = "none";
  }

  document.getElementById("summary").innerText = survey.summary;

  // Criteria
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

function renderTasks() {
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

function renderTimeline() {
  const proj = getActiveProject();
  const el   = document.getElementById("timeline");
  el.innerHTML = "";

  if (!proj.plans.timeline || !proj.plans.timeline.length) {
    el.innerHTML = `<div class="empty-state">✔ Brak wpisów w timeline</div>`;
    if (fp) { fp.set("enable", [formatDate(new Date())]); fp.redraw(); }
    return;
  }

  proj.plans.timeline.forEach((m, idx) => {
    const icon      = m.status === "done" ? "✔" : m.status === "in_progress" ? "⏳" : "•";
    const rangeText = m.start ? `${m.start} → ${m.date}` : m.date;

    const div = document.createElement("div");
    div.className    = "timeline-item";
    div.dataset.date  = m.date;
    div.dataset.start = m.start || m.date;

    div.innerHTML = `
      <span>${icon} ${escHtml(m.milestone)}</span>
      <span class="timeline-item-actions">
        ${m.isUpdated ? '<span class="dot"></span>' : ""}
        ${rangeText}
        <span class="delete-btn" onclick="openTimelineModal(${idx}, event)" title="Edytuj">✏️</span>
        <span class="delete-btn" onclick="deleteTimelineEntry(${idx}, event)" title="Usuń">🗑</span>
      </span>
    `;

    div.addEventListener("click", () => {
      fp.setDate([m.start || m.date, m.date], true);
      highlightTimelineRange(new Date(m.start || m.date), new Date(m.date));
    });

    el.appendChild(div);
  });
}

/* ───── TIMELINE ACTIONS ───── */

function deleteTimelineEntry(idx, event) {
  event.stopPropagation();
  if (!confirm("Czy na pewno chcesz usunąć ten wpis?")) return;
  getActiveProject().plans.timeline.splice(idx, 1);
  saveState();
  renderTimeline();
  initCalendar();
}

function openTimelineModal(idx = -1, event = null) {
  if (event) event.stopPropagation();
  editingIndex = idx;

  document.getElementById("timelineModal").classList.add("active");

  const fpStart = flatpickr("#msStart", { dateFormat: "Y-m-d" });
  const fpEnd   = flatpickr("#msEnd",   { dateFormat: "Y-m-d" });

  if (idx !== -1) {
    const m = getActiveProject().plans.timeline[idx];
    document.getElementById("msName").value         = m.milestone;
    document.getElementById("msStatus").value       = m.status;
    document.getElementById("msUpdated").checked    = !!m.isUpdated;
    fpStart.setDate(m.start || "");
    fpEnd.setDate(m.date);
  }
}

function closeTimelineModal() {
  document.getElementById("timelineModal").classList.remove("active");
  editingIndex = -1;
  document.getElementById("msName").value         = "";
  document.getElementById("msStart").value        = "";
  document.getElementById("msEnd").value          = "";
  document.getElementById("msStatus").value       = "planned";
  document.getElementById("msUpdated").checked    = false;
}

function saveTimelineEntry() {
  const milestone = document.getElementById("msName").value.trim();
  const date      = document.getElementById("msEnd").value;
  const start     = document.getElementById("msStart").value;
  const status    = document.getElementById("msStatus").value;
  const isUpdated = document.getElementById("msUpdated").checked ? 1 : 0;

  if (!milestone || !date) { alert("Nazwa i data końcowa są wymagane!"); return; }

  const entry = { milestone, date, start: start || null, status: status || "planned", isUpdated };
  const tl    = getActiveProject().plans.timeline;

  if (editingIndex !== -1) tl[editingIndex] = entry;
  else tl.push(entry);

  tl.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveState();
  renderTimeline();
  initCalendar();
  closeTimelineModal();
}

/* ───── TIMELINE HIGHLIGHT ───── */

function highlightTimeline(date) {
  const d = new Date(date);
  highlightTimelineRange(d, d);
}

function highlightTimelineRange(start, end) {
  document.querySelectorAll(".timeline-item").forEach(el => el.classList.remove("active"));
  const startTime = start.getTime();
  const endTime   = end.getTime();
  document.querySelectorAll(".timeline-item").forEach(el => {
    const mStart = new Date(el.dataset.start).getTime();
    const mEnd   = new Date(el.dataset.date).getTime();
    if (mStart <= endTime && mEnd >= startTime) el.classList.add("active");
  });
}

/* ───── CALENDAR ───── */

function initCalendar() {
  const proj        = getActiveProject();
  const timelineMap = new Map((proj.plans.timeline || []).map(m => [m.date, m]));
  const allowedDates = [];

  (proj.plans.timeline || []).forEach(m => {
    const start = new Date(m.start || m.date);
    const end   = new Date(m.date);
    let d = new Date(start);
    while (d <= end) {
      allowedDates.push(formatDate(d));
      d.setDate(d.getDate() + 1);
    }
  });

  allowedDates.push(formatDate(new Date()));

  if (fp) fp.destroy();

  fp = flatpickr("#calendar", {
    inline:      true,
    defaultDate: "today",
    enable:      allowedDates,

    onDayCreate(dObj, dStr, instance, dayElem) {
      const d     = dayElem.dateObj;
      const key   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const match = timelineMap.get(key);
      if (match) {
        const color = STATUS_COLORS[match.status];
        if (color) {
          dayElem.style.background   = color;
          dayElem.style.color        = "#fff";
          dayElem.style.borderRadius = "6px";
        }
        dayElem.title = match.milestone;
      }
    },

    onChange(selectedDates) {
      if (!selectedDates.length) return;
      highlightTimeline(formatDate(selectedDates[0]));
    },
  });
}

/* ───── PROJECT NAME INLINE EDIT ───── */

function initProjectNameEdit() {
  const titleEl = document.getElementById("projectTitle");
  titleEl.addEventListener("click", () => {
    const proj        = getActiveProject();
    const currentName = proj.project.name;

    titleEl.innerHTML = `<input type="text" class="project-title-input" id="projectTitleInput" value="${escHtml(currentName)}">`;
    const input = document.getElementById("projectTitleInput");
    input.focus();
    input.select();

    const saveName = () => {
      const newName = input.value.trim() || "Bez nazwy";
      proj.project.name = newName;
      titleEl.innerText = newName;
      saveState();
      renderProjectList();          // refresh list with new name
    };

    input.addEventListener("blur",    saveName);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter")  saveName();
      if (e.key === "Escape") titleEl.innerText = currentName;
    });
  });
}

/* ───── PROJECT DOCS ───── */

function renderProjectDocs() {
  const proj      = getActiveProject();
  const container = document.getElementById("projectDocs");

  if (!proj.project.documents) { container.innerHTML = ""; return; }

  container.innerHTML = proj.project.documents.map((doc, index) => {
    const hasUrl = doc.url && doc.url.trim() !== "";

    if (hasUrl) {
      return `
        <div class="project-doc-row">
          <a class="project-doc-btn" href="${doc.url}" target="_blank">
            ${escHtml(doc.label)}
            <span class="project-doc-edit-icon" onclick="event.preventDefault(); openDocModal(${index})">✏</span>
          </a>
        </div>
      `;
    } else {
      return `
        <div class="project-doc-row">
          <button class="project-doc-btn disabled" onclick="openDocModal(${index})" style="pointer-events:auto; opacity:0.6;">
            ${escHtml(doc.label)}
            <span class="project-doc-edit-icon" style="opacity:1;">✏</span>
          </button>
        </div>
      `;
    }
  }).join("");
}

function openDocModal(index) {
  editingDocIndex = index;
  const doc = getActiveProject().project.documents[index];
  document.getElementById("docLabel").value = doc.label;
  document.getElementById("docUrl").value   = doc.url || "";
  document.getElementById("docModal").classList.add("active");
}

function closeDocModal() {
  editingDocIndex = -1;
  document.getElementById("docModal").classList.remove("active");
}

function saveDocModal() {
  if (editingDocIndex === -1) return;
  getActiveProject().project.documents[editingDocIndex].url =
    document.getElementById("docUrl").value.trim();
  saveState();
  renderProjectDocs();
  closeDocModal();
}

/* ───── SURVEY IMPORT ───── */

async function importFromClipboard(getArray, setArray, callback) {
  try {
    const text = await navigator.clipboard.readText();
    const data = JSON.parse(text);
    const arr  = getArray();
    Array.isArray(data) ? arr.unshift(...data) : arr.unshift(data);
    saveState();
    callback();
    alert("Dane zaimportowane pomyślnie.");
  } catch {
    alert("Błąd importu ze schowka. Upewnij się, że masz poprawny JSON.");
  }
}

function importFromFile(getArray, callback) {
  const input = document.createElement("input");
  input.type   = "file";
  input.accept = ".json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const arr  = getArray();
        if (Array.isArray(data)) { arr.length = 0; arr.push(...data); }
        else arr.unshift(data);
        saveState();
        callback();
        alert("Plik zaimportowany.");
      } catch { alert("Błąd pliku JSON."); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function deleteCurrent(getArray, indexVar, setIndex, callback) {
  const arr = getArray();
  if (!arr.length) return;
  if (!confirm("Czy na pewno chcesz usunąć bieżącą ankietę?")) return;
  arr.splice(indexVar, 1);
  saveState();
  callback();
}

/* ───── RESET / CLEAR ───── */

function resetDashboard() {
  if (!confirm("CZY NA PEWNO? Aktywny projekt zostanie przywrócony do stanu pustego.")) return;
  const proj = getActiveProject();
  proj.surveyHistory          = [];
  proj.predictabilityHistory  = [];
  proj.plans                  = { tasks: [], timeline: [] };
  resetViewIndexes();
  saveState();
  renderDashboard();
}

/* ───── SEARCH / FILTER ───── */

function filterProjectList(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll(".project-list-item").forEach(li => {
    const name = li.querySelector(".project-list-name").textContent.toLowerCase();
    li.style.display = name.includes(q) ? "" : "none";
  });
}

/* ───── BIND ALL EVENTS ───── */

function bindEvents() {
  // Sidebar
  document.getElementById("sidebarToggleBtn").addEventListener("click", toggleSidebar);
  document.getElementById("sidebarOverlay").addEventListener("click", closeSidebar);

  // Project list actions
  document.getElementById("addProjectBtn").addEventListener("click", addProject);
  document.getElementById("importProjectBtn").addEventListener("click", importProjectFromFile);
  document.getElementById("exportAllBtn").addEventListener("click", exportAllProjects);
  document.getElementById("projectSearchInput").addEventListener("input", e => filterProjectList(e.target.value));

  // Dashboard toolbar
  document.getElementById("exportProjectBtn").addEventListener("click", exportActiveProject);
  document.getElementById("duplicateProjectBtn").addEventListener("click", duplicateProject);
  document.getElementById("resetDashboard").addEventListener("click", resetDashboard);
  document.getElementById("clearStorage").addEventListener("click", () => {
    if (confirm("CZY NA PEWNO? To usunie WSZYSTKIE dane z przeglądarki.")) {
      localStorage.clear();
      location.reload();
    }
  });

  // Survey nav
  document.getElementById("predPrev").addEventListener("click",  () => { predictabilityIndex++; renderPredictability(); });
  document.getElementById("predNext").addEventListener("click",  () => { predictabilityIndex--; renderPredictability(); });
  document.getElementById("surveyPrev").addEventListener("click", () => { currentIndex++;        renderSurvey(); });
  document.getElementById("surveyNext").addEventListener("click", () => { currentIndex--;        renderSurvey(); });

  // Survey imports — predictability
  document.getElementById("predImportClip").addEventListener("click", () =>
    importFromClipboard(
      () => getActiveProject().predictabilityHistory,
      () => {},
      () => { predictabilityIndex = 0; renderPredictability(); }
    )
  );
  document.getElementById("predImportFile").addEventListener("click", () =>
    importFromFile(
      () => getActiveProject().predictabilityHistory,
      () => { predictabilityIndex = 0; renderPredictability(); }
    )
  );
  document.getElementById("predDelete").addEventListener("click", () =>
    deleteCurrent(
      () => getActiveProject().predictabilityHistory,
      predictabilityIndex,
      null,
      () => {
        const len = getActiveProject().predictabilityHistory.length;
        if (predictabilityIndex >= len) predictabilityIndex = Math.max(0, len - 1);
        renderPredictability();
      }
    )
  );

  // Survey imports — status
  document.getElementById("surveyImportClip").addEventListener("click", () =>
    importFromClipboard(
      () => getActiveProject().surveyHistory,
      () => {},
      () => { currentIndex = 0; renderSurvey(); }
    )
  );
  document.getElementById("surveyImportFile").addEventListener("click", () =>
    importFromFile(
      () => getActiveProject().surveyHistory,
      () => { currentIndex = 0; renderSurvey(); }
    )
  );
  document.getElementById("surveyDelete").addEventListener("click", () =>
    deleteCurrent(
      () => getActiveProject().surveyHistory,
      currentIndex,
      null,
      () => {
        const len = getActiveProject().surveyHistory.length;
        if (currentIndex >= len) currentIndex = Math.max(0, len - 1);
        renderSurvey();
      }
    )
  );

  // Planner
  document.getElementById("addTimelineBtn").addEventListener("click", () => openTimelineModal());
}

/* ───── INIT ───── */

boot();
initProjectNameEdit();
bindEvents();