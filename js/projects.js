/* ═══════════════════════════════════════════════════════
   PROJECTS.JS  —  Project CRUD, import/export, doc modal
   ═══════════════════════════════════════════════════════ */

import {
  store, getActiveProject, resetViewIndexes, persistActiveId, saveState,
  setActiveProjectId, setAllProjects, setEditingDocIndex,
} from './storage.js';
import { DEFAULT_PROJECT_TEMPLATE } from './data.js';
import { escHtml } from './utils.js';
import {
  renderProjectList, renderDashboard, renderProjectDocs,
} from './render.js';
import { initCalendar } from './planner.js';

/* ───── SWITCH PROJECT ───── */

export function switchProject(id) {
  setActiveProjectId(id);
  resetViewIndexes();
  persistActiveId();
  renderProjectList();
  renderDashboard();
  initCalendar();

  // Close sidebar on mobile
  if (window.innerWidth <= 768) closeSidebar();
}

/* ───── ADD PROJECT ───── */

export function addProject() {
  const name = prompt("Nazwa nowego projektu:");
  if (!name || !name.trim()) return;

  const newProj = DEFAULT_PROJECT_TEMPLATE();
  newProj.project.name = name.trim();
  store.allProjects.push(newProj);

  saveState();
  switchProject(newProj.id);
}

/* ───── DELETE PROJECT ───── */

export function deleteProject(id) {
  const proj = store.allProjects.find(p => p.id === id);
  if (!proj) return;
  if (!confirm(`Usunąć projekt „${proj.project.name}"? Tej operacji nie można cofnąć.`)) return;

  setAllProjects(store.allProjects.filter(p => p.id !== id));

  // Ensure at least one project exists
  if (!store.allProjects.length) {
    const blank = DEFAULT_PROJECT_TEMPLATE();
    blank.project.name = "Nowy Projekt";
    store.allProjects.push(blank);
  }

  if (store.activeProjectId === id) {
    setActiveProjectId(store.allProjects[0].id);
    resetViewIndexes();
  }

  saveState();
  renderProjectList();
  renderDashboard();
  initCalendar();
}

/* ───── DUPLICATE PROJECT ───── */

export function duplicateProject() {
  const src  = getActiveProject();
  const copy = JSON.parse(JSON.stringify(src));
  copy.id        = crypto.randomUUID();
  copy.createdAt = new Date().toISOString();
  copy.project.name += " (kopia)";

  store.allProjects.push(copy);
  saveState();
  switchProject(copy.id);
}

/* ───── IMPORT PROJECT FROM FILE ───── */

export function importProjectFromFile() {
  const input    = document.createElement("input");
  input.type     = "file";
  input.accept   = ".json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader    = new FileReader();
    reader.onload   = ev => {
      try {
        const data     = JSON.parse(ev.target.result);
        const projects = Array.isArray(data) ? data : [data];

        projects.forEach(p => {
          p.id = p.id && !store.allProjects.find(x => x.id === p.id)
            ? p.id
            : crypto.randomUUID();
          if (!p.createdAt) p.createdAt = new Date().toISOString();
          store.allProjects.push(p);
        });

        saveState();
        renderProjectList();
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

/* ───── EXPORT ACTIVE PROJECT ───── */

export function exportActiveProject() {
  const proj = getActiveProject();
  const blob = new Blob([JSON.stringify(proj, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${proj.project.name.replace(/\s+/g, "_")}_export.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ───── EXPORT ALL PROJECTS ───── */

export function exportAllProjects() {
  const blob = new Blob([JSON.stringify(store.allProjects, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `pmo_all_projects_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ───── SIDEBAR ───── */

export function toggleSidebar() {
  document.getElementById("appShell").classList.toggle("sidebar-open");
}

export function closeSidebar() {
  document.getElementById("appShell").classList.remove("sidebar-open");
}

/* ───── FILTER PROJECT LIST ───── */

export function filterProjectList(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll(".project-list-item").forEach(li => {
    const name = li.querySelector(".project-list-name").textContent.toLowerCase();
    li.style.display = name.includes(q) ? "" : "none";
  });
}

/* ───── PROJECT NAME INLINE EDIT ───── */

export function initProjectNameEdit() {
  const titleEl = document.getElementById("projectTitle");
  titleEl.addEventListener("click", () => {
    const proj        = getActiveProject();
    const currentName = proj.project.name;

    titleEl.innerHTML = `<input type="text" class="project-title-input" id="projectTitleInput" value="${escHtml(currentName)}">`;
    const input = document.getElementById("projectTitleInput");
    input.focus();
    input.select();

    const saveName = () => {
      const newName      = input.value.trim() || "Bez nazwy";
      proj.project.name  = newName;
      titleEl.innerText  = newName;
      saveState();
      renderProjectList();
    };

    input.addEventListener("blur",    saveName);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter")  saveName();
      if (e.key === "Escape") titleEl.innerText = currentName;
    });
  });
}

/* ───── DOC MODAL ───── */

export function openDocModal(index) {
  setEditingDocIndex(index);
  const doc = getActiveProject().project.documents[index];
  document.getElementById("docLabel").value = doc.label;
  document.getElementById("docUrl").value   = doc.url || "";
  document.getElementById("docModal").classList.add("active");
}

export function closeDocModal() {
  setEditingDocIndex(-1);
  document.getElementById("docModal").classList.remove("active");
}

export function saveDocModal() {
  if (store.editingDocIndex === -1) return;
  getActiveProject().project.documents[store.editingDocIndex].url =
    document.getElementById("docUrl").value.trim();
  saveState();
  renderProjectDocs();
  closeDocModal();
}

/* ───── SURVEY IMPORT HELPERS ───── */

export async function importFromClipboard(getArray, callback) {
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

export function importFromFile(getArray, callback) {
  const input    = document.createElement("input");
  input.type     = "file";
  input.accept   = ".json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader  = new FileReader();
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

export function deleteCurrent(getArray, indexVar, callback) {
  const arr = getArray();
  if (!arr.length) return;
  if (!confirm("Czy na pewno chcesz usunąć bieżącą ankietę?")) return;
  arr.splice(indexVar, 1);
  saveState();
  callback();
}

/* ───── RESET / CLEAR ───── */

export function resetDashboard() {
  if (!confirm("CZY NA PEWNO? Aktywny projekt zostanie przywrócony do stanu pustego.")) return;
  const proj = getActiveProject();
  proj.surveyHistory         = [];
  proj.predictabilityHistory = [];
  proj.plans                 = { tasks: [], timeline: [] };
  resetViewIndexes();
  saveState();
  renderDashboard();
  initCalendar();
}
