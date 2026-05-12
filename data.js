/* ───── DEFAULT PROJECT TEMPLATE ───── */

const DEFAULT_PROJECT_TEMPLATE = () => ({
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  project: {
    name: "Nowy Projekt",
    url: "",
    documents: [
      { label: "Karta Projektu",  url: "" },
      { label: "Harmonogram",     url: "" },
      { label: "Zakres prac",     url: "" },
      { label: "Happy Path",      url: "" },
      { label: "Rejestr Ryzyk",   url: "" },
    ],
  },
  surveyHistory: [],
  predictabilityHistory: [],
  plans: { tasks: [], timeline: [] },
});

/* ───── SEED DATA (pierwszy start) ───── */

const SEED_DATA = [
  {
    id: "seed-project-alpha",
    createdAt: "2026-04-01T00:00:00.000Z",
    project: {
      name: "Project Alpha",
      url: "https://example.com/projects/alpha",
      documents: [
        { label: "Karta Projektu", url: "https://example.com/project-charter" },
        { label: "Harmonogram",    url: "https://example.com/schedule"        },
        { label: "Zakres prac",    url: "https://example.com/scope"           },
        { label: "Happy Path",     url: "https://example.com/happy-path"      },
        { label: "Rejestr Ryzyk",  url: "https://example.com/risk-register"   },
      ],
    },
    surveyHistory: [
      {
        week: "Tydzień 4 maj – 8 maj 2026",
        status: "A",
        score: 73,
        summary: "Projekt wymaga zwiększonego monitoringu. Występują obszary ryzyka wymagające działań PM.",
        criteria: {
          progress:     { name: "Postęp prac",    weight: 0.30, value: "G", label: "On Track"           },
          scope:        { name: "Zakres (Scope)", weight: 0.20, value: "A", label: "Pod kontrolą"       },
          risks:        { name: "Ryzyka",         weight: 0.20, value: "A", label: "Monitorowane"       },
          team:         { name: "Zespół",         weight: 0.15, value: "G", label: "Sprawny"            },
          stakeholders: { name: "Interesariusze", weight: 0.10, value: "A", label: "Sporadyczne luki"   },
          quality:      { name: "Jakość",         weight: 0.05, value: "A", label: "Dopuszczalna"       },
        },
        comment: "Testttt",
        risks:   ["asdasd"],
        actions: ["adsasdda"],
      },
      {
        week: "Tydzień 4 maj – 8 maj 2026",
        status: "A",
        score: 93,
        summary: "Projekt wymaga zwiększonego monitoringu. Występują obszary ryzyka wymagające działań PM.",
        criteria: {
          progress:     { name: "Postęp prac",    weight: 0.30, value: "G", label: "On Track"         },
          scope:        { name: "Zakres (Scope)", weight: 0.20, value: "G", label: "Stabilny"         },
          risks:        { name: "Ryzyka",         weight: 0.20, value: "G", label: "Pod kontrolą"     },
          team:         { name: "Zespół",         weight: 0.15, value: "G", label: "Sprawny"          },
          stakeholders: { name: "Interesariusze", weight: 0.10, value: "A", label: "Sporadyczne luki" },
          quality:      { name: "Jakość",         weight: 0.05, value: "A", label: "Dopuszczalna"     },
        },
        comment: "Test",
      },
      {
        week: "Tydzień 27 kwi – 1 maj 2026",
        status: "A",
        score: 78,
        summary: "Projekt wymaga stabilizacji w obszarze delivery i decyzji stakeholderów.",
        criteria: {
          progress:     { name: "Postęp prac",    weight: 0.30, value: "A", label: "Chwilowe spowolnienie" },
          scope:        { name: "Zakres (Scope)", weight: 0.20, value: "G", label: "On Track"              },
          risks:        { name: "Ryzyka",         weight: 0.20, value: "A", label: "Monitorowane"          },
          team:         { name: "Zespół",         weight: 0.15, value: "G", label: "Sprawny"               },
          stakeholders: { name: "Interesariusze", weight: 0.10, value: "R", label: "Blokada"               },
          quality:      { name: "Jakość",         weight: 0.05, value: "A", label: "Dopuszczalna"          },
        },
        risks:   ["Opóźnienie delivery (2 tyg.)", "Brak decyzji stakeholdera", "Scope creep w module X"],
        actions: ["Eskalacja do sponsora", "Replan sprintów", "Zamrożenie scope"],
      },
    ],
    predictabilityHistory: [
      {
        date: "11.04.2026",
        score: 3.17,
        level: "Wysoka nieprzewidywalność",
        areas: { requirements: 4.5, tech: 2.5, deps: 3.5, team: 2.5, planning: 2.5, risk: 3.5 },
      },
      {
        date: "04.04.2026",
        score: 3.45,
        level: "Średnia nieprzewidywalność",
        areas: { requirements: 4.0, tech: 3.0, deps: 3.0, team: 3.0, planning: 3.0, risk: 3.5 },
      },
    ],
    plans: {
      tasks: [
        { name: "API integration",      status: "in_progress", owner: "Dev Team", due: "2026-05-10" },
        { name: "Stakeholder approval",  status: "blocked",     owner: "PM",       due: "2026-05-08" },
        { name: "QA testing",            status: "todo",        owner: "QA",       due: "2026-05-12" },
      ],
      timeline: [
        { milestone: "Kickoff",   date: "2026-04-01",                       status: "done",        isUpdated: 0 },
        { milestone: "MVP ready", date: "2026-05-05",                       status: "done",        isUpdated: 0 },
        { milestone: "UAT",       date: "2026-05-15", start: "2026-05-12", status: "in_progress", isUpdated: 1 },
        { milestone: "Go-live",   date: "2026-05-20",                       status: "planned",     isUpdated: 1 },
      ],
    },
  },
  {
    id: "seed-project-beta",
    createdAt: "2026-04-15T00:00:00.000Z",
    project: {
      name: "Project Beta",
      url: "",
      documents: [
        { label: "Karta Projektu", url: "" },
        { label: "Harmonogram",    url: "" },
        { label: "Zakres prac",    url: "" },
        { label: "Happy Path",     url: "" },
        { label: "Rejestr Ryzyk",  url: "" },
      ],
    },
    surveyHistory: [
      {
        week: "Tydzień 4 maj – 8 maj 2026",
        status: "G",
        score: 91,
        summary: "Projekt przebiega sprawnie. Brak istotnych zagrożeń.",
        criteria: {
          progress:     { name: "Postęp prac",    weight: 0.30, value: "G", label: "On Track"     },
          scope:        { name: "Zakres (Scope)", weight: 0.20, value: "G", label: "Stabilny"     },
          risks:        { name: "Ryzyka",         weight: 0.20, value: "G", label: "Pod kontrolą" },
          team:         { name: "Zespół",         weight: 0.15, value: "G", label: "Sprawny"      },
          stakeholders: { name: "Interesariusze", weight: 0.10, value: "G", label: "Zaangażowani" },
          quality:      { name: "Jakość",         weight: 0.05, value: "G", label: "Wysoka"       },
        },
      },
    ],
    predictabilityHistory: [],
    plans: { tasks: [], timeline: [] },
  },
];

/* ───── SŁOWNIKI / STAŁE ───── */

const AREA_LABELS = {
  requirements: "Zakres i wymagania",
  tech:         "Technologia",
  deps:         "Zależności zewnętrzne",
  team:         "Zespół",
  planning:     "Planowanie i estymacje",
  risk:         "Zarządzanie ryzykiem",
};

const STATUS_COLORS = {
  done:        "#2E7D32",
  in_progress: "#F9A825",
  planned:     "#6B6560",
  blocked:     "#C62828",
};

/* ───── PROJECT STATUS SUMMARY (dla listy) ───── */

function getProjectStatusSummary(proj) {
  const latest = proj.surveyHistory?.[0];
  if (!latest) return { status: null, score: null, week: null };
  return { status: latest.status, score: latest.score, week: latest.week };
}