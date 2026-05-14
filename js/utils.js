/* ═══════════════════════════════════════════════════════
   UTILS.JS  —  Shared helpers (no module dependencies)
   ═══════════════════════════════════════════════════════ */

export const formatDate = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function escHtml(str) {
  return String(str)
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "&quot;");
}

export function highlightTimeline(date) {
  const d = new Date(date);
  highlightTimelineRange(d, d);
}

export function highlightTimelineRange(start, end) {
  document.querySelectorAll(".timeline-item").forEach(el => el.classList.remove("active"));
  const startTime = start.getTime();
  const endTime   = end.getTime();
  document.querySelectorAll(".timeline-item").forEach(el => {
    const mStart = new Date(el.dataset.start).getTime();
    const mEnd   = new Date(el.dataset.date).getTime();
    if (mStart <= endTime && mEnd >= startTime) el.classList.add("active");
  });
}