/* ───── STATE ───── */

let projectData = JSON.parse(localStorage.getItem("pmo_project")) || { ...project };
let surveyHistoryData = JSON.parse(localStorage.getItem("pmo_survey_history")) || [...surveyHistory];
let predictabilityHistoryData = JSON.parse(localStorage.getItem("pmo_predictability_history")) || [...predictabilityHistory];
let plansData = JSON.parse(localStorage.getItem("pmo_plans")) || { ...plans };

let currentIndex = 0;
let predictabilityIndex = 0;
let editingIndex = -1;
let fp = null;
let editingDocIndex = -1;

/* ───── HELPERS ───── */

const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function saveState() {
  localStorage.setItem("pmo_project", JSON.stringify(projectData));
  localStorage.setItem("pmo_survey_history", JSON.stringify(surveyHistoryData));
  localStorage.setItem("pmo_predictability_history", JSON.stringify(predictabilityHistoryData));
  localStorage.setItem("pmo_plans", JSON.stringify(plansData));
}

/* ───── NAV BUTTONS STATE ───── */

function updateNavButtons() {
  document.getElementById("predPrev").disabled = predictabilityIndex >= predictabilityHistoryData.length - 1;
  document.getElementById("predNext").disabled = predictabilityIndex <= 0;
  document.getElementById("surveyPrev").disabled = currentIndex >= surveyHistoryData.length - 1;
  document.getElementById("surveyNext").disabled = currentIndex <= 0;
}

/* ───── RENDER: PREDICTABILITY ───── */

function renderPredictability() {
  const p = predictabilityHistoryData[predictabilityIndex];
  updateNavButtons();

  if (!p) {
    document.getElementById("predictabilityDate").innerText = "Ankieta przewidywalności";
    document.getElementById("predictabilityScore").innerText = "-";
    document.getElementById("predictabilityLevel").innerHTML = `<div class="empty-state">✔ Brak ankiet przewidywalności</div>`;
    document.getElementById("areaScores").innerHTML = "";
    document.getElementById("predComment").innerHTML = "";
    return;
  }

  document.getElementById("predictabilityDate").innerText =
    `Ankieta przewidywalności (${p.date})`;
  document.getElementById("predictabilityScore").innerText = p.score;
  document.getElementById("predictabilityLevel").innerHTML =
    `<strong>${p.level}</strong>`;

  // Notes
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

  const getColor = (v) => (v >= 4 ? "G" : v >= 3 ? "A" : "R");

  Object.entries(p.areas).forEach(([key, value]) => {
    const label = AREA_LABELS[key] || key;
    const el = document.createElement("div");
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
  const survey = surveyHistoryData[currentIndex];
  const prev   = surveyHistoryData[currentIndex + 1];
  updateNavButtons();

  if (!survey) {
    document.getElementById("surveyDate").innerText = "Ankieta statusowa";
    document.getElementById("status").innerText = "BRAK DANYCH";
    document.getElementById("score").innerText = "-";
    document.getElementById("trend").style.display = "none";
    document.getElementById("summary").innerHTML = `<div class="empty-state">✔ Brak ankiet statusowych — dodaj pierwszą</div>`;
    document.getElementById("kpis").innerHTML = "";
    document.getElementById("pmComment").innerHTML = "";
    document.getElementById("risks").innerHTML = `<div class="empty-state">✔ Brak istotnych ryzyk</div>`;
    document.getElementById("actions").innerHTML = `<div class="empty-state">✔ Brak działań do wykonania</div>`;
    return;
  }

  const statusMap = { G: "🟢 DOBRY", A: "🟡 UWAGA", R: "🔴 ZAGROŻONY" };

  document.getElementById("surveyDate").innerText = `Ankieta statusowa (${survey.week})`;
  document.getElementById("status").innerText = statusMap[survey.status] || survey.status;
  document.getElementById("score").innerText = survey.score;

  const trendEl = document.getElementById("trend");
  if (prev) {
    const diff = survey.score - prev.score;
    trendEl.innerText =
      diff === 0 ? "→ bez zmian" :
      diff > 0   ? `📈 +${diff} vs last week` :
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
    Object.values(survey.criteria).forEach((k) => {
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
  const commentPanel   = document.getElementById("pmCommentPanel");
  const commentEl      = document.getElementById("pmComment");
  const commentDetails = document.getElementById("pmCommentDetails");
  if (survey.comment) {
    commentEl.innerText = survey.comment;
    commentDetails.removeAttribute("data-empty");
  } else {
    commentEl.innerHTML = `<div class="empty-state">✔ Brak komentarza PM dla tej ankiety</div>`;
    commentDetails.setAttribute("data-empty", "true");
  }
  commentPanel.style.display = "";

  // Risks
  const risksEl = document.getElementById("risks");
  risksEl.innerHTML = !survey.risks || survey.risks.length === 0
    ? `<div class="empty-state">✔ Brak istotnych ryzyk</div>`
    : survey.risks.map((r) => `<div class="item">⚠ ${r}</div>`).join("");

  // Actions
  const actionsEl = document.getElementById("actions");
  actionsEl.innerHTML = !survey.actions || survey.actions.length === 0
    ? `<div class="empty-state">✔ Brak działań do wykonania</div>`
    : survey.actions.map((a) => `<div class="item">• ${a}</div>`).join("");
}

/* ───── RENDER: TASKS ───── */

function renderTasks() {
  const el = document.getElementById("tasks");
  el.innerHTML = "";

  if (!plansData.tasks || plansData.tasks.length === 0) {
    el.innerHTML = `<div class="empty-state">✔ Brak zadań</div>`;
    return;
  }

  plansData.tasks.forEach((t) => {
    const badge =
      t.status === "done"        ? "✔ DONE" :
      t.status === "in_progress" ? "⏳ IN PROGRESS" :
      t.status === "blocked"     ? "⛔ BLOCKED" :
                                   "• TODO";

    const div = document.createElement("div");
    div.className = `task ${t.status}`;
    div.innerHTML = `
      <strong>${t.name}</strong>
      <span class="badge">${badge}</span><br>
      Owner: ${t.owner}<br>
      Due: ${t.due}
    `;
    el.appendChild(div);
  });
}

/* ───── RENDER: TIMELINE ───── */

function renderTimeline() {
  const el = document.getElementById("timeline");
  el.innerHTML = "";

  if (!plansData.timeline || plansData.timeline.length === 0) {
    el.innerHTML = `<div class="empty-state">✔ Brak wpisów w timeline</div>`;
    if (fp) {
        fp.set("enable", [formatDate(new Date())]);
        fp.redraw();
    }
    return;
  }

  plansData.timeline.forEach((m, idx) => {
    const icon =
      m.status === "done"        ? "✔" :
      m.status === "in_progress" ? "⏳" :
                                   "•";

    const rangeText = m.start ? `${m.start} → ${m.date}` : m.date;

    const div = document.createElement("div");
    div.className = "timeline-item";
    div.dataset.date  = m.date;
    div.dataset.start = m.start || m.date;

    div.innerHTML = `
      <span>${icon} ${m.milestone}</span>
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
    plansData.timeline.splice(idx, 1);
    saveState();
    renderTimeline();
    initCalendar();
}

function openTimelineModal(idx = -1, event = null) {
    if (event) event.stopPropagation();
    editingIndex = idx;
    
    document.getElementById("timelineModal").classList.add("active");
    
    // Init flatpickr
    const fpStart = flatpickr("#msStart", { dateFormat: "Y-m-d" });
    const fpEnd = flatpickr("#msEnd", { dateFormat: "Y-m-d" });

    if (idx !== -1) {
        const m = plansData.timeline[idx];
        document.getElementById("msName").value = m.milestone;
        fpStart.setDate(m.start || "");
        fpEnd.setDate(m.date);
        document.getElementById("msStatus").value = m.status;
        document.getElementById("msUpdated").checked = !!m.isUpdated;
    }
}

function closeTimelineModal() {
    document.getElementById("timelineModal").classList.remove("active");
    editingIndex = -1;
    // Clear inputs
    document.getElementById("msName").value = "";
    document.getElementById("msStart").value = "";
    document.getElementById("msEnd").value = "";
    document.getElementById("msStatus").value = "planned";
    document.getElementById("msUpdated").checked = false;
}

function saveTimelineEntry() {
    const milestone = document.getElementById("msName").value.trim();
    const date = document.getElementById("msEnd").value;
    const start = document.getElementById("msStart").value;
    const status = document.getElementById("msStatus").value;
    const isUpdated = document.getElementById("msUpdated").checked ? 1 : 0;

    if (!milestone || !date) {
        alert("Nazwa i data końcowa są wymagane!");
        return;
    }

    const entry = {
        milestone,
        date,
        start: start || null,
        status: status || "planned",
        isUpdated: isUpdated
    };

    if (editingIndex !== -1) {
        plansData.timeline[editingIndex] = entry;
    } else {
        plansData.timeline.push(entry);
    }

    plansData.timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveState();
    renderTimeline();
    initCalendar();
    closeTimelineModal();
}

function addTimelineEntry() {
    openTimelineModal();
}

/* ───── TIMELINE HIGHLIGHT ───── */

function highlightTimeline(date) {
  const d = new Date(date);
  highlightTimelineRange(d, d);
}

function highlightTimelineRange(start, end) {
  document.querySelectorAll(".timeline-item").forEach((el) =>
    el.classList.remove("active")
  );

  const startTime = start.getTime();
  const endTime   = end.getTime();

  document.querySelectorAll(".timeline-item").forEach((el) => {
    const mStart = new Date(el.dataset.start).getTime();
    const mEnd   = new Date(el.dataset.date).getTime();
    if (mStart <= endTime && mEnd >= startTime) {
      el.classList.add("active");
    }
  });
}

/* ───── CALENDAR INIT ───── */

function initCalendar() {
  const timelineMap = new Map((plansData.timeline || []).map((m) => [m.date, m]));

  const allowedDates = [];

  (plansData.timeline || []).forEach((m) => {
    const start = new Date(m.start || m.date);
    const end   = new Date(m.date);
    let d = new Date(start);
    while (d <= end) {
      allowedDates.push(formatDate(d));
      d.setDate(d.getDate() + 1);
    }
  });

  allowedDates.push(formatDate(new Date())); // today always enabled

  if (fp) fp.destroy();

  fp = flatpickr("#calendar", {
    inline: true,
    defaultDate: "today",
    enable: allowedDates,

    onDayCreate(dObj, dStr, instance, dayElem) {
      const d = dayElem.dateObj;
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const match = timelineMap.get(date);

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
      const d = selectedDates[0];
      highlightTimeline(formatDate(d));
    },
  });
}

/* ───── PROJECT NAME EDIT ───── */

function initProjectNameEdit() {
    const titleEl = document.getElementById("projectTitle");
    titleEl.addEventListener("click", () => {
        const currentName = projectData.name;
        titleEl.innerHTML = `<input type="text" class="project-title-input" id="projectTitleInput" value="${currentName}">`;
        const input = document.getElementById("projectTitleInput");
        input.focus();
        input.select();
        
        const saveName = () => {
            const newName = input.value.trim() || "Bez nazwy";
            projectData.name = newName;
            titleEl.innerText = newName;
            saveState();
        };

        input.addEventListener("blur", saveName);
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") saveName();
            if (e.key === "Escape") titleEl.innerText = currentName;
        });
    });
}

/* ───── PROJECT DOCS ───── */

function renderProjectDocs() {
    const container = document.getElementById("projectDocs");

    if (!projectData.documents) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = projectData.documents.map((doc, index) => {
        const hasUrl = doc.url && doc.url.trim() !== "";

        return `
            <div class="project-doc-row">

                ${
                    hasUrl
                    ? `
                        <a
                          class="project-doc-btn"
                          href="${doc.url}"
                          target="_blank"
                        >
                          ${doc.label}
                        </a>
                    `
                    : `
                        <div class="project-doc-btn disabled">
                          ${doc.label}
                        </div>
                    `
                }

                <button
                  class="project-doc-edit-btn"
                  onclick="openDocModal(${index})"
                  title="Edytuj link"
                >
                  ✏️
                </button>

            </div>
        `;
    }).join("");
}

function updateProjectDoc(index, value) {
    projectData.documents[index].url = value.trim();

    saveState();
    renderProjectDocs();
}

function addProjectDoc() {
    if (!projectData.documents) {
        projectData.documents = [];
    }

    projectData.documents.push({
        label: "Nowy dokument",
        url: "https://"
    });

    saveState();
    renderProjectDocs();
}

function deleteProjectDoc(index) {
    if (!confirm("Usunąć dokument?")) return;

    projectData.documents.splice(index, 1);

    saveState();
    renderProjectDocs();
}

/* ───── PROJECT DOCS ───── */

function openDocModal(index) {
    editingDocIndex = index;

    const doc = projectData.documents[index];

    document.getElementById("docLabel").value = doc.label;
    document.getElementById("docUrl").value = doc.url || "";

    document.getElementById("docModal")
        .classList
        .add("active");
}

function closeDocModal() {
    editingDocIndex = -1;

    document.getElementById("docModal")
        .classList
        .remove("active");
}

function saveDocModal() {
    if (editingDocIndex === -1) return;

    const url = document
        .getElementById("docUrl")
        .value
        .trim();

    projectData.documents[editingDocIndex].url = url;

    saveState();
    renderProjectDocs();
    closeDocModal();
}

/* ───── SURVEY ACTIONS ───── */

async function importFromClipboard(historyArray, callback) {
    try {
        const text = await navigator.clipboard.readText();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
            historyArray.unshift(...data);
        } else {
            historyArray.unshift(data);
        }
        saveState();
        callback();
        alert("Dane zaimportowane pomyślnie.");
    } catch (err) {
        alert("Błąd importu ze schowka. Upewnij się, że masz poprawny JSON.");
    }
}

function importFromFile(historyArray, callback) {
    const input = document.getElementById("importFile");
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (Array.isArray(data)) {
                    historyArray.length = 0;
                    historyArray.push(...data);
                } else {
                    historyArray.unshift(data);
                }
                saveState();
                callback();
                alert("Plik zaimportowany.");
            } catch (err) {
                alert("Błąd pliku JSON.");
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function deleteCurrent(historyArray, indexVar, callback) {
    if (historyArray.length === 0) return;
    if (!confirm("Czy na pewno chcesz usunąć bieżącą ankietę?")) return;
    historyArray.splice(indexVar, 1);
    if (indexVar >= historyArray.length && indexVar > 0) {
        // adjust index if we deleted the last item
    }
    saveState();
    callback();
}

/* ───── RESET DASHBOARD ───── */

function resetDashboard() {
    if (!confirm("CZY NA PEWNO? To wyczyści wszystkie dane dashboardu.")) return;
    
    projectData = { name: "Nowy Projekt", url: "#" };
    surveyHistoryData = [];
    predictabilityHistoryData = [];
    plansData = { tasks: [], timeline: [] };
    
    currentIndex = 0;
    predictabilityIndex = 0;
    
    saveState();
    location.reload(); // Najbezpieczniej odświeżyć żeby wszystko się zresetowało do czystych stanów
}

/* ───── INIT ───── */

document.getElementById("projectTitle").innerText = projectData.name;

renderSurvey();
renderTasks();
renderTimeline();
renderPredictability();
initCalendar();
initProjectNameEdit();
renderProjectDocs();

// Main Events
document.getElementById("resetDashboard").addEventListener("click", resetDashboard);
document.getElementById("clearStorage").addEventListener("click", () => {
    if (confirm("CZY NA PEWNO? To usunie WSZYSTKIE dane z przeglądarki (localStorage).")) {
        localStorage.clear();
        location.reload();
    }
});

// Nav Events
document.getElementById("predPrev").addEventListener("click", () => { predictabilityIndex++; renderPredictability(); });
document.getElementById("predNext").addEventListener("click", () => { predictabilityIndex--; renderPredictability(); });
document.getElementById("surveyPrev").addEventListener("click", () => { currentIndex++; renderSurvey(); });
document.getElementById("surveyNext").addEventListener("click", () => { currentIndex--; renderSurvey(); });

// Survey Actions Events
document.getElementById("surveyImportClip").addEventListener("click", () => importFromClipboard(surveyHistoryData, () => renderSurvey()));
document.getElementById("surveyImportFile").addEventListener("click", () => importFromFile(surveyHistoryData, () => renderSurvey()));
document.getElementById("surveyDelete").addEventListener("click", () => deleteCurrent(surveyHistoryData, currentIndex, () => {
    if (currentIndex >= surveyHistoryData.length) currentIndex = Math.max(0, surveyHistoryData.length - 1);
    renderSurvey();
}));

document.getElementById("predImportClip").addEventListener("click", () => importFromClipboard(predictabilityHistoryData, () => renderPredictability()));
document.getElementById("predImportFile").addEventListener("click", () => importFromFile(predictabilityHistoryData, () => renderPredictability()));
document.getElementById("predDelete").addEventListener("click", () => deleteCurrent(predictabilityHistoryData, predictabilityIndex, () => {
    if (predictabilityIndex >= predictabilityHistoryData.length) predictabilityIndex = Math.max(0, predictabilityHistoryData.length - 1);
    renderPredictability();
}));

// Planner Events
document.getElementById("addTimelineBtn").addEventListener("click", addTimelineEntry);
