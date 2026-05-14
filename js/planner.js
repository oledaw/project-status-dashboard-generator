/* ═══════════════════════════════════════════════════════
   PLANNER.JS  —  Calendar (flatpickr) + Timeline modal
   ═══════════════════════════════════════════════════════ */

import { store, getActiveProject, saveState, setFp, setEditingIndex } from './storage.js';
import { STATUS_COLORS } from './data.js';
import { formatDate, highlightTimeline } from './utils.js';
import { renderTimeline } from './render.js'; // render.js no longer imports planner.js — cycle broken

/* ───── CALENDAR ───── */

export function initCalendar() {
  const proj         = getActiveProject();
  const timelineMap  = new Map((proj.plans.timeline || []).map(m => [m.date, m]));
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

  if (store.fp) store.fp.destroy();

  setFp(flatpickr("#calendar", {
    inline:      true,
    defaultDate: "today",
    enable:      allowedDates,

    onDayCreate(dObj, dStr, instance, dayElem) {
      const key = formatDate(dayElem.dateObj);

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
  }));
}

/* ───── TIMELINE MODAL ───── */

export function openTimelineModal(idx = -1) {
  setEditingIndex(idx);
  document.getElementById("timelineModal").classList.add("active");

  const fpStart = flatpickr("#msStart", { dateFormat: "Y-m-d" });
  const fpEnd   = flatpickr("#msEnd",   { dateFormat: "Y-m-d" });

  if (idx !== -1) {
    const m = getActiveProject().plans.timeline[idx];
    document.getElementById("msName").value      = m.milestone;
    document.getElementById("msStatus").value    = m.status;
    document.getElementById("msUpdated").checked = !!m.isUpdated;
    fpStart.setDate(m.start || "");
    fpEnd.setDate(m.date);
  }
}

export function closeTimelineModal() {
  document.getElementById("timelineModal").classList.remove("active");
  setEditingIndex(-1);
  document.getElementById("msName").value      = "";
  document.getElementById("msStart").value     = "";
  document.getElementById("msEnd").value       = "";
  document.getElementById("msStatus").value    = "planned";
  document.getElementById("msUpdated").checked = false;
}

export function saveTimelineEntry() {
  const milestone = document.getElementById("msName").value.trim();
  const date      = document.getElementById("msEnd").value;
  const start     = document.getElementById("msStart").value;
  const status    = document.getElementById("msStatus").value;
  const isUpdated = document.getElementById("msUpdated").checked ? 1 : 0;

  if (!milestone || !date) { alert("Nazwa i data końcowa są wymagane!"); return; }

  const entry = { milestone, date, start: start || null, status: status || "planned", isUpdated };
  const tl    = getActiveProject().plans.timeline;

  if (store.editingIndex !== -1) tl[store.editingIndex] = entry;
  else tl.push(entry);

  tl.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveState();
  renderTimeline();
  initCalendar();
  closeTimelineModal();
}

export function deleteTimelineEntry(idx) {
  if (!confirm("Czy na pewno chcesz usunąć ten wpis?")) return;
  getActiveProject().plans.timeline.splice(idx, 1);
  saveState();
  renderTimeline();
  initCalendar();
}
