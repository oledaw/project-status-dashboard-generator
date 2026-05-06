/* ───── STATE ───── */

let selectedDate = null;
let currentIndex = 0;
let predictabilityIndex = 0;
let fp = null;

/* ───── HELPERS ───── */

const formatDate = (d) => d.toISOString().slice(0, 10);

/* ───── RENDER: PROJECT HEADER ───── */

function renderProject() {
  document.getElementById("projectTitle").innerText = data.project.name;
  document.getElementById("projectLink").href = data.project.url;
}

/* ───── RENDER: PREDICTABILITY ───── */

function prevPredictability() {
  if (predictabilityIndex < predictabilityHistory.length - 1) {
    predictabilityIndex++;
    renderPredictability();
  }
}

function nextPredictability() {
  if (predictabilityIndex > 0) {
    predictabilityIndex--;
    renderPredictability();
  }
}

function renderPredictability() {
  const p = predictabilityHistory[predictabilityIndex];

  document.getElementById("predictabilityDate").innerText =
    `Ankieta przewidywalności (${p.date})`;
  document.getElementById("predictabilityScore").innerText = p.score;
  document.getElementById("predictabilityLevel").innerHTML =
    `<strong>${p.level}</strong>`;

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

function prevSurvey() {
  if (currentIndex < surveyHistory.length - 1) {
    currentIndex++;
    renderSurvey();
  }
}

function nextSurvey() {
  if (currentIndex > 0) {
    currentIndex--;
    renderSurvey();
  }
}

function renderSurvey() {
  const survey = surveyHistory[currentIndex];

  const statusMap = { G: "🟢 DOBRY", A: "🟡 UWAGA", R: "🔴 ZAGROŻONY" };

  document.getElementById("surveyDate").innerText =
    `Ankieta statusowa (${survey.week})`;
  document.getElementById("status").innerText = statusMap[survey.status];
  document.getElementById("score").innerText = survey.score;

  const diff = survey.score - survey.prevScore;
  document.getElementById("trend").innerText =
    diff === 0 ? "→ bez zmian" :
    diff > 0   ? `📈 +${diff} vs last week` :
                 `📉 ${diff} vs last week`;

  document.getElementById("summary").innerText = survey.summary;

  // KPIs
  const kpiEl = document.getElementById("kpis");
  kpiEl.innerHTML = "";
  survey.kpis.forEach((k) => {
    const el = document.createElement("div");
    el.className = "kpi";
    el.innerHTML = `
      <div class="kpi-title">${k.name}</div>
      <div class="kpi-value-wrap">
        <span class="status-dot ${k.value}"></span>
        <span class="kpi-value">${k.comment}</span>
      </div>
    `;
    kpiEl.appendChild(el);
  });

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

  plans.tasks.forEach((t) => {
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

  plans.timeline.forEach((m) => {
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
      <span>
        ${m.isUpdated ? '<span class="dot"></span>' : ""}
        ${rangeText}
      </span>
    `;

    div.addEventListener("click", () => {
      fp.setDate([m.start || m.date, m.date], true);
      highlightTimelineRange(new Date(m.start || m.date), new Date(m.date));
    });

    el.appendChild(div);
  });
}

/* ───── TIMELINE HIGHLIGHT ───── */

function highlightTimeline(date) {
  document.querySelectorAll(".timeline-item").forEach((el) =>
    el.classList.remove("active")
  );
  const el = document.querySelector(`.timeline-item[data-date="${date}"]`);
  if (el) el.classList.add("active");
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
  const timelineMap = new Map(plans.timeline.map((m) => [m.date, m]));

  const allowedDates = [];

  plans.timeline.forEach((m) => {
    const start = new Date(m.start || m.date);
    const end   = new Date(m.date);
    let d = new Date(start);
    while (d <= end) {
      allowedDates.push(formatDate(d));
      d.setDate(d.getDate() + 1);
    }
  });

  allowedDates.push(formatDate(new Date())); // today always enabled

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
        if (date === selectedDate) dayElem.classList.add("selected-status");
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
      selectedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      highlightTimeline(selectedDate);
      fp.redraw();
    },
  });
}

/* ───── INIT ───── */

renderProject();
renderSurvey();
renderTasks();
renderTimeline();
renderPredictability();
initCalendar();
