/* ═══════════════════════════════════════════════════════
   STORAGE.JS  —  localStorage persistence + boot
   ═══════════════════════════════════════════════════════ */

import { SEED_DATA } from './data.js';

const STORAGE_PROJECTS  = "pmo_projects";
const STORAGE_ACTIVE_ID = "pmo_active_project_id";

/* ───── PRIVATE STATE ───── */

const state = {
  allProjects:        [],
  activeProjectId:    null,
  currentIndex:       0,
  predictabilityIndex: 0,
  editingIndex:       -1,
  editingDocIndex:    -1,
  fp:                 null,
};

/* ───── PUBLIC STORE (read-only proxy for consumers that only read) ───── */

export const store = state;   // same object — mutations via setters below are preferred

/* ───── TYPED SETTERS ───── */

export const setActiveProjectId    = id  => { state.activeProjectId    = id;  };
export const setCurrentIndex       = n   => { state.currentIndex       = n;   };
export const setPredictabilityIndex = n  => { state.predictabilityIndex = n;  };
export const setEditingIndex       = n   => { state.editingIndex       = n;   };
export const setEditingDocIndex    = n   => { state.editingDocIndex    = n;   };
export const setFp                 = fp  => { state.fp                 = fp;  };
export const setAllProjects        = arr => { state.allProjects        = arr; };

/* ───── ACCESSORS ───── */

export function getActiveProject() {
  return state.allProjects.find(p => p.id === state.activeProjectId) || state.allProjects[0];
}

export function resetViewIndexes() {
  state.currentIndex        = 0;
  state.predictabilityIndex = 0;
  state.editingIndex        = -1;
  state.editingDocIndex     = -1;
}

/* ───── PERSISTENCE ───── */

function persistProjects() {
  localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(state.allProjects));
}

export function persistActiveId() {
  localStorage.setItem(STORAGE_ACTIVE_ID, state.activeProjectId);
}

export function saveState() {
  persistProjects();
  persistActiveId();
}

/* ───── BOOT ───── */

export function boot() {
  const raw = localStorage.getItem(STORAGE_PROJECTS);
  if (raw) {
    try { state.allProjects = JSON.parse(raw); } catch { state.allProjects = []; }
  }

  if (!state.allProjects.length) {
    state.allProjects = [...SEED_DATA];
    persistProjects();
  }

  const savedId = localStorage.getItem(STORAGE_ACTIVE_ID);
  const found   = state.allProjects.find(p => p.id === savedId);
  state.activeProjectId = found ? savedId : state.allProjects[0].id;

  resetViewIndexes();
}
