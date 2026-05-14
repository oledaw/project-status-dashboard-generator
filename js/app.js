/* ═══════════════════════════════════════════════════════
   APP.JS  —  Entry point: bind events + boot
   ═══════════════════════════════════════════════════════ */

import { store, boot, getActiveProject, setPredictabilityIndex, setCurrentIndex } from './storage.js';
import {
  renderProjectList, renderDashboard, renderSurvey, renderPredictability,
} from './render.js';
import {
  openTimelineModal, closeTimelineModal, saveTimelineEntry, deleteTimelineEntry, initCalendar,
} from './planner.js';
import {
  switchProject, addProject, deleteProject, duplicateProject,
  importProjectFromFile, exportActiveProject, exportAllProjects,
  toggleSidebar, closeSidebar, filterProjectList,
  initProjectNameEdit, openDocModal, closeDocModal, saveDocModal,
  importFromClipboard, importFromFile, deleteCurrent, resetDashboard,
} from './projects.js';

/* ───── EXPOSE MODAL FUNCTIONS FOR INLINE ONCLICK ───── */

window.closeTimelineModal = closeTimelineModal;
window.saveTimelineEntry  = saveTimelineEntry;
window.closeDocModal      = closeDocModal;
window.saveDocModal       = saveDocModal;

/* ───── EVENT DELEGATION: Project List ───── */

document.getElementById("projectListItems").addEventListener("click", e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id     = btn.dataset.id;

  if (action === "switch-project") { switchProject(id); }
  if (action === "delete-project") { e.stopPropagation(); deleteProject(id); }
});

/* ───── EVENT DELEGATION: Timeline ───── */

document.getElementById("timeline").addEventListener("click", e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const idx    = parseInt(btn.dataset.index, 10);

  if (action === "edit-timeline")   { e.stopPropagation(); openTimelineModal(idx); }
  if (action === "delete-timeline") { e.stopPropagation(); deleteTimelineEntry(idx); }
});

/* ───── EVENT DELEGATION: Project Docs ───── */

document.getElementById("projectDocs").addEventListener("click", e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  if (btn.dataset.action === "open-doc-modal") {
    e.preventDefault();
    openDocModal(parseInt(btn.dataset.index, 10));
  }
});

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

  // Survey nav — predictability
  document.getElementById("predPrev").addEventListener("click",  () => { setPredictabilityIndex(store.predictabilityIndex + 1); renderPredictability(); });
  document.getElementById("predNext").addEventListener("click",  () => { setPredictabilityIndex(store.predictabilityIndex - 1); renderPredictability(); });

  // Survey imports — predictability
  document.getElementById("predImportClip").addEventListener("click", () =>
    importFromClipboard(
      () => getActiveProject().predictabilityHistory,
      () => { setPredictabilityIndex(0); renderPredictability(); }
    )
  );
  document.getElementById("predImportFile").addEventListener("click", () =>
    importFromFile(
      () => getActiveProject().predictabilityHistory,
      () => { setPredictabilityIndex(0); renderPredictability(); }
    )
  );
  document.getElementById("predDelete").addEventListener("click", () =>
    deleteCurrent(
      () => getActiveProject().predictabilityHistory,
      store.predictabilityIndex,
      () => {
        const len = getActiveProject().predictabilityHistory.length;
        if (store.predictabilityIndex >= len) setPredictabilityIndex(Math.max(0, len - 1));
        renderPredictability();
      }
    )
  );

  // Survey nav — status
  document.getElementById("surveyPrev").addEventListener("click", () => { setCurrentIndex(store.currentIndex + 1); renderSurvey(); });
  document.getElementById("surveyNext").addEventListener("click", () => { setCurrentIndex(store.currentIndex - 1); renderSurvey(); });

  // Survey imports — status
  document.getElementById("surveyImportClip").addEventListener("click", () =>
    importFromClipboard(
      () => getActiveProject().surveyHistory,
      () => { setCurrentIndex(0); renderSurvey(); }
    )
  );
  document.getElementById("surveyImportFile").addEventListener("click", () =>
    importFromFile(
      () => getActiveProject().surveyHistory,
      () => { setCurrentIndex(0); renderSurvey(); }
    )
  );
  document.getElementById("surveyDelete").addEventListener("click", () =>
    deleteCurrent(
      () => getActiveProject().surveyHistory,
      store.currentIndex,
      () => {
        const len = getActiveProject().surveyHistory.length;
        if (store.currentIndex >= len) setCurrentIndex(Math.max(0, len - 1));
        renderSurvey();
      }
    )
  );

  // Planner
  document.getElementById("addTimelineBtn").addEventListener("click", () => openTimelineModal());
}

/* ───── INIT ───── */

boot();
renderProjectList();
renderDashboard();
initCalendar();
initProjectNameEdit();
bindEvents();
