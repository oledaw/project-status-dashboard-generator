/* ───── DANE PROJEKTU ───── */

const data = {
  project: {
    name: "Project Alpha",
    url: "https://example.com/projects/alpha",
  },
};

/* ───── HISTORIA ANKIET STATUSOWYCH ───── */

const surveyHistory = [
  {
    project: {
      name: "Project Alpha",
      url: "https://example.com/projects/alpha",
    },
    week: "2026-W19",
    status: "A",
    score: 78,
    prevScore: 83,
    kpis: [
      { name: "Postęp prac", value: "A", comment: "Chwilowe spowolnienie" },
      { name: "Zakres (Scope)", value: "G", comment: "On Track" },
      { name: "Ryzyka", value: "A", comment: "Monitorowane" },
      { name: "Zespół", value: "G", comment: "Sprawny" },
      { name: "Interesariusze", value: "R", comment: "Blokada" },
    ],
    risks: [
      "Opóźnienie delivery (2 tyg.)",
      "Brak decyzji stakeholdera",
      "Scope creep w module X",
    ],
    actions: [
      "Eskalacja do sponsora",
      "Replan sprintów",
      "Zamrożenie scope",
    ],
    summary:
      "Projekt wymaga stabilizacji w obszarze delivery i decyzji stakeholderów.",
  },
  {
    week: "2026-W18",
    date: "23.04.2026",
    status: "G",
    score: 83,
    prevScore: 80,
    summary: "Poprawa sytuacji...",
    kpis: [
      { name: "Delivery", value: "G", comment: "On Track" },
      { name: "Scope", value: "G", comment: "Stabilny" },
    ],
  },
];

/* ───── HISTORIA ANKIET PRZEWIDYWALNOŚCI ───── */

const predictabilityHistory = [
  {
    date: "11.04.2026",
    score: 3.17,
    level: "Wysoka nieprzewidywalność",
    areas: {
      requirements: 4.5,
      tech: 2.5,
      deps: 3.5,
      team: 2.5,
      planning: 2.5,
      risk: 3.5,
    },
  },
  {
    date: "04.04.2026",
    score: 3.45,
    level: "Średnia nieprzewidywalność",
    areas: {
      requirements: 4.0,
      tech: 3.0,
      deps: 3.0,
      team: 3.0,
      planning: 3.0,
      risk: 3.5,
    },
  },
];

/* ───── PLANNER ───── */

const plans = {
  tasks: [
    { name: "API integration",      status: "in_progress", owner: "Dev Team", due: "2026-05-10" },
    { name: "Stakeholder approval",  status: "blocked",     owner: "PM",       due: "2026-05-08" },
    { name: "QA testing",            status: "todo",        owner: "QA",       due: "2026-05-12" },
  ],
  timeline: [
    { milestone: "Kickoff",   date: "2026-04-01", status: "done",        isUpdated: 0 },
    { milestone: "MVP ready", date: "2026-05-05", status: "done",        isUpdated: 0 },
    { milestone: "UAT",       date: "2026-05-15", start: "2026-05-12", status: "in_progress", isUpdated: 1 },
    { milestone: "Go-live",   date: "2026-05-20", status: "planned",     isUpdated: 1 },
  ],
};

/* ───── SŁOWNIKI / STAŁE ───── */

const AREA_LABELS = {
  requirements: "Zakres i wymagania",
  tech: "Technologia",
  deps: "Zależności zewnętrzne",
  team: "Zespół",
  planning: "Planowanie i estymacje",
  risk: "Zarządzanie ryzykiem",
};

const STATUS_COLORS = {
  done:        "#2E7D32",
  in_progress: "#F9A825",
  planned:     "#6B6560",
  blocked:     "#C62828",
};
