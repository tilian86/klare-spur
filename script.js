const STORAGE_KEY = "klare-spur-state-v2";
const MAX_AUTO_TASKS = 80;
const OCR_LANG = "deu+eng";

const rawInput = document.querySelector("#raw-input");
const ocrOutput = document.querySelector("#ocr-output");
const imageInput = document.querySelector("#image-input");
const previewFrame = document.querySelector("#preview-frame");
const previewImage = document.querySelector("#preview-image");
const clearImageButton = document.querySelector("#clear-image");
const analyzeButton = document.querySelector("#analyze-button");
const processingStatus = document.querySelector("#processing-status");
const engineBadge = document.querySelector("#engine-badge");
const loadDemoButton = document.querySelector("#load-demo");
const resetAppButton = document.querySelector("#reset-app");
const useOcrTextButton = document.querySelector("#use-ocr-text");
const dropzone = document.querySelector("#dropzone");
const triageSection = document.querySelector("#triage-section");
const triageList = document.querySelector("#triage-list");
const triageProgress = document.querySelector("#triage-progress");
const triageAcceptAll = document.querySelector("#triage-accept-all");
const triageConfirmBtn = document.querySelector("#triage-confirm");
const buildDayButton = document.querySelector("#build-day");
const nextStep = document.querySelector("#next-step");
const timeline = document.querySelector("#timeline");
const smartSummary = document.querySelector("#smart-summary");
const quadrantTargets = {
  do: document.querySelector("#quadrant-do"),
  schedule: document.querySelector("#quadrant-schedule"),
  delegate: document.querySelector("#quadrant-delegate"),
  delete: document.querySelector("#quadrant-delete"),
};
const bucketTargets = {
  routine: document.querySelector("#bucket-routine"),
  project: document.querySelector("#bucket-project"),
  idea: document.querySelector("#bucket-idea"),
};
const countTargets = {
  do: document.querySelector("#count-do"),
  schedule: document.querySelector("#count-schedule"),
  delegate: document.querySelector("#count-delegate"),
  delete: document.querySelector("#count-delete"),
  routine: document.querySelector("#count-routine"),
  project: document.querySelector("#count-project"),
  idea: document.querySelector("#count-idea"),
};
const dayStartInput = document.querySelector("#day-start");
const availableHoursInput = document.querySelector("#available-hours");
const energyLevelInput = document.querySelector("#energy-level");

const demoInput = `Rechnung für Internet bezahlen
E-Mail an Kundin mit Angebot senden
Arzttermin verschieben
Unterlagen für Bewerbung zusammensuchen
Idee für Nebenprojekt notieren
Website-Text überarbeiten
Wocheneinkauf planen
daily
10 Minuten aufräumen
20 Minuten Bewegung
Pflanzen gießen`;

const ACTION_KEYWORDS = [
  "anhören",
  "anrufen",
  "anschauen",
  "antworten",
  "aufräumen",
  "bezahlen",
  "besprechen",
  "eröffnen",
  "erledigen",
  "fragen",
  "informieren",
  "kreieren",
  "lernen",
  "lesen",
  "machen",
  "mail",
  "melden",
  "nehmen",
  "notieren",
  "planen",
  "probieren",
  "programmieren",
  "recherchieren",
  "schauen",
  "schicken",
  "schreiben",
  "sortieren",
  "testen",
  "verschieben",
  "versorgen",
];

const QUICK_ADMIN_KEYWORDS = [
  "anrufen",
  "antworten",
  "bezahlen",
  "entschuldigen",
  "eröffnen",
  "mail",
  "melden",
  "nachfragen",
  "verschieben",
  "whatsapp",
];

const ROUTINE_KEYWORDS = [
  "badroutine",
  "daily",
  "dehnroutine",
  "essen zubereiten",
  "haushalt",
  "kraftübungen",
  "kraftuebungen",
  "lesen",
  "meditieren",
  "nachrichten lesen",
  "nagelhaut",
  "routine",
  "tagesreflektion",
  "vitamine",
  "vokabeln",
  "wäsche",
  "waesche",
  "versorgen",
];

const PROJECT_KEYWORDS = [
  "app",
  "ausbildung",
  "bot",
  "buch",
  "firefox store",
  "iphone",
  "kreieren",
  "master",
  "monetarisieren",
  "projekt",
  "schaffen",
  "system",
  "web app",
];

const EXPLORE_KEYWORDS = [
  "anschauen",
  "idea",
  "idee",
  "informieren",
  "probieren",
  "realisierbar",
  "recherchieren",
  "schauen",
  "testen",
];

const FINANCE_KEYWORDS = ["bank", "bezahlen", "einzahlungskonto", "einzahlungskto", "konto", "kto", "miete", "rechnung", "steuer", "vertrag"];
const HEALTH_KEYWORDS = ["arzt", "gesund", "meditieren", "psycho", "routine", "schlaf", "therapie", "vitamine"];
const WORK_KEYWORDS = [
  "angebot",
  "app",
  "beratung",
  "bot",
  "chrome",
  "firefox",
  "kunde",
  "mail",
  "monetarisieren",
  "projekt",
  "programmieren",
  "selbständig",
  "selbststaendig",
  "store",
  "web app",
];
const EDUCATION_KEYWORDS = ["ausbildung", "diploma", "euro fh", "kurs", "lernen", "master", "psychologie", "soziale arbeit", "zertifikat"];
const RELATIONSHIP_KEYWORDS = [
  "abiball",
  "entschuldigen",
  "freund",
  "freunde",
  "freundesliste",
  "geburtstag",
  "kerstin",
  "lea",
  "melden",
  "treffen",
];
const CREATIVE_KEYWORDS = ["buch", "design", "krimi", "podcast", "video", "wissensmanagement"];
const LOW_VALUE_KEYWORDS = ["felgen", "probefahrt", "skillshare", "tesla"];

let state = {
  rawText: "",
  ocrText: "",
  screenshotDataUrl: "",
  tasks: [],
  timeline: [],
  nextStepText: "Warte auf Input.",
  engine: {
    available: false,
    model: "",
    checked: false,
  },
  triageConfirmed: false,
  settings: {
    dayStart: "09:00",
    availableHours: "6",
    energyLevel: "medium",
  },
};

function uid() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function loadState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    state = {
      ...state,
      ...JSON.parse(stored),
    };
  } catch (error) {
    console.warn("State konnte nicht geladen werden.", error);
  }
}

function saveState() {
  state.settings = {
    dayStart: dayStartInput?.value || "09:00",
    availableHours: availableHoursInput?.value || "6",
    energyLevel: energyLevelInput?.value || "medium",
  };

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      rawText: state.rawText,
      ocrText: state.ocrText,
      screenshotDataUrl: state.screenshotDataUrl,
      tasks: state.tasks,
      timeline: state.timeline,
      nextStepText: state.nextStepText,
      engine: state.engine,
      settings: state.settings,
    })
  );
}

function setStatus(message) {
  processingStatus.textContent = message;
}

function setEngineBadge(label, variant) {
  if (!engineBadge) {
    return;
  }

  engineBadge.textContent = label;
  engineBadge.className = "engine-badge";

  if (variant) {
    engineBadge.classList.add(`is-${variant}`);
  }
}

function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeTaskText(text) {
  return normalizeWhitespace(
    String(text || "")
      .replace(/^([*•+\-]|(\d+[.)]))\s+/, "")
      .replace(/^[◦○●☐☑✓]\s*/, "")
      .replace(/^todo[:\s-]*/i, "")
      .replace(/[|]+/g, " ")
  );
}

function isTaskLike(text) {
  if (!text || text.length < 2) {
    return false;
  }

  return /[a-zäöüß]/i.test(text);
}

function isUiMetaLine(text) {
  const lower = text.toLowerCase();

  return (
    /^\+?\s*aufgabe hinzufügen$/i.test(text) ||
    /^\d+$/.test(text) ||
    /^\d+\s*(aufgaben|tasks?)$/i.test(text) ||
    /^\d{1,2}\.\s+[a-zäöü]{3,10}\s+\d{4}.*$/i.test(text) ||
    /^https?:\/\//i.test(lower) ||
    /^↩+$/.test(text)
  );
}

function getSectionKind(text) {
  const lower = text.toLowerCase();

  if (/^daily\b/.test(lower)) {
    return "daily";
  }

  if (/^important to finish soon\b/.test(lower)) {
    return "urgentList";
  }

  if (/^todo\b/.test(lower)) {
    return "general";
  }

  return null;
}

function splitLongLine(text) {
  const primaryParts = text
    .split(/\s*[;•]\s*/g)
    .map(normalizeTaskText)
    .filter(Boolean);

  if (primaryParts.length > 1) {
    return primaryParts;
  }

  if (text.length > 130) {
    return text
      .split(/[.!?]\s+/g)
      .map(normalizeTaskText)
      .filter(Boolean);
  }

  return [text];
}

function parseInputItems(text) {
  const lines = String(text || "").split(/\r?\n/g);
  const seen = new Set();
  const items = [];
  let currentSection = "general";

  lines.forEach((rawLine) => {
    const normalized = normalizeTaskText(rawLine);
    if (!normalized) {
      return;
    }

    const section = getSectionKind(normalized);
    if (section) {
      currentSection = section;
      return;
    }

    if (isUiMetaLine(normalized)) {
      return;
    }

    splitLongLine(normalized).forEach((fragment) => {
      if (!isTaskLike(fragment) || isUiMetaLine(fragment)) {
        return;
      }

      const dedupeKey = fragment.toLowerCase();
      if (seen.has(dedupeKey)) {
        return;
      }

      seen.add(dedupeKey);
      items.push({
        id: uid(),
        title: fragment,
        section: currentSection,
        source: "mixed",
        answers: {
          action: "",
          urgency: "",
          importance: "",
          dueWindow: "",
        },
        dismissedClarification: false,
        manualPlacement: "",
      });
    });
  });

  return items.slice(0, MAX_AUTO_TASKS);
}

function includesAny(lower, keywords) {
  return keywords.some((keyword) => lower.includes(keyword));
}

function countKeywordHits(lower, keywords) {
  return keywords.reduce((count, keyword) => count + (lower.includes(keyword) ? 1 : 0), 0);
}

function countWords(text) {
  return normalizeWhitespace(text).split(/\s+/).filter(Boolean).length;
}

function detectDueWindow(text, section) {
  const lower = text.toLowerCase();

  if (section === "daily") {
    return "today";
  }

  if (/\bheute\b/.test(lower)) {
    return "today";
  }

  if (/\bmorgen\b/.test(lower)) {
    return "tomorrow";
  }

  if (section === "urgentList") {
    return "week";
  }

  if (/\bdiese woche\b/.test(lower) || /\bbis (montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/.test(lower)) {
    return "week";
  }

  if (/\b\d{1,2}:\d{2}\b/.test(lower) || /\b\d{1,2}\.\d{1,2}\b/.test(lower)) {
    return "specific";
  }

  return "someday";
}

function inferType(title, section, dueWindow) {
  const lower = title.toLowerCase();
  const wordCount = countWords(title);
  const hasQuestion = lower.includes("?");
  const hasRoutineSignal =
    section === "daily" ||
    includesAny(lower, ROUTINE_KEYWORDS) ||
    /^(\d+\s*min(?:uten)?|mind\.)/.test(lower);
  const hasProjectSignal =
    includesAny(lower, PROJECT_KEYWORDS) ||
    lower.startsWith("wie ") ||
    hasQuestion ||
    (lower.includes(" und ") && wordCount >= 7) ||
    wordCount >= 10;
  const hasExploreSignal = includesAny(lower, EXPLORE_KEYWORDS);
  const hasAdminSignal = includesAny(lower, QUICK_ADMIN_KEYWORDS);
  const hasHardDue = dueWindow === "today" || dueWindow === "tomorrow" || dueWindow === "specific";

  if (hasRoutineSignal) {
    return "routine";
  }

  if (hasProjectSignal && !hasAdminSignal) {
    return "project";
  }

  if (hasExploreSignal && !hasHardDue && !includesAny(lower, FINANCE_KEYWORDS.concat(HEALTH_KEYWORDS))) {
    return "idea";
  }

  return "task";
}

function determineQuadrant(bucket, importanceScore, urgencyScore) {
  if (bucket !== "matrix") {
    if (importanceScore >= 2.8) {
      return "schedule";
    }
    return "delete";
  }

  if (importanceScore >= 3.4 && urgencyScore >= 2.8) {
    return "do";
  }

  if (importanceScore >= 2.5) {
    return "schedule";
  }

  if (urgencyScore >= 2.8) {
    return "delegate";
  }

  return "delete";
}


function applyManualPlacement(task) {
  const placement = task.manualPlacement || "";

  if (!placement || placement === "auto") {
    return task;
  }

  if (placement === "routine" || placement === "project" || placement === "idea") {
    return {
      ...task,
      bucket: placement,
      type: placement,
      quadrant: placement === "project" ? "schedule" : "delete",
      reasons: ["manuell verschoben", ...task.reasons].slice(0, 4),
      confidence: Math.max(task.confidence, 0.84),
    };
  }

  return {
    ...task,
    bucket: "matrix",
    type: "task",
    quadrant: placement,
    reasons: ["manuell verschoben", ...task.reasons].slice(0, 4),
    confidence: Math.max(task.confidence, 0.84),
  };
}

function scoreTask(task) {
  const effectiveTitle = normalizeWhitespace(task.answers.action || task.title);
  const lower = effectiveTitle.toLowerCase();
  const dueWindow = task.answers.dueWindow || detectDueWindow(effectiveTitle, task.section);
  const type = inferType(effectiveTitle, task.section, dueWindow);
  const reasons = [];
  let signalCount = 0;
  let urgencyScore = 0.4;
  let importanceScore = 0.8;

  const financeHits = countKeywordHits(lower, FINANCE_KEYWORDS);
  const healthHits = countKeywordHits(lower, HEALTH_KEYWORDS);
  const workHits = countKeywordHits(lower, WORK_KEYWORDS);
  const educationHits = countKeywordHits(lower, EDUCATION_KEYWORDS);
  const relationshipHits = countKeywordHits(lower, RELATIONSHIP_KEYWORDS);
  const creativeHits = countKeywordHits(lower, CREATIVE_KEYWORDS);
  const lowValueHits = countKeywordHits(lower, LOW_VALUE_KEYWORDS);
  const quickAdminHits = countKeywordHits(lower, QUICK_ADMIN_KEYWORDS);
  const actionHits = countKeywordHits(lower, ACTION_KEYWORDS);
  const hasQuestion = lower.includes("?");

  if (task.section === "daily") {
    reasons.push("aus Daily-Liste");
    urgencyScore += 2.2;
    importanceScore += 1.2;
    signalCount += 2;
  } else if (task.section === "urgentList") {
    reasons.push("aus Bald-fertig-Liste");
    urgencyScore += 2.6;
    importanceScore += 1.2;
    signalCount += 2;
  }

  if (financeHits) {
    importanceScore += 2.4;
    reasons.push("Finanzen / Orga");
    signalCount += 1;
  }

  if (healthHits) {
    importanceScore += 2.1;
    reasons.push("Gesundheit / Stabilität");
    signalCount += 1;
  }

  if (workHits) {
    importanceScore += 2.1;
    reasons.push("Arbeit / Aufbau");
    signalCount += 1;
  }

  if (educationHits) {
    importanceScore += 1.8;
    reasons.push("Lernen / Zukunft");
    signalCount += 1;
  }

  if (relationshipHits) {
    importanceScore += 1.6;
    reasons.push("Beziehung / Kontakt");
    signalCount += 1;
  }

  if (creativeHits) {
    importanceScore += 1.1;
    reasons.push("kreatives oder strategisches Thema");
    signalCount += 1;
  }

  if (lowValueHits) {
    importanceScore -= 1.1;
    reasons.push("eher nice-to-have");
    signalCount += 1;
  }

  if (quickAdminHits) {
    urgencyScore += 1.2;
    reasons.push("kurz erledigbar");
    signalCount += 1;
  }

  if (financeHits && quickAdminHits) {
    importanceScore += 0.8;
    urgencyScore += 0.6;
    reasons.push("sollte nicht offen bleiben");
    signalCount += 1;
  }

  if (relationshipHits && quickAdminHits) {
    importanceScore += 0.9;
    urgencyScore += 0.5;
    reasons.push("offene Kommunikation");
    signalCount += 1;
  }

  if (lower.includes("treffen") || lower.includes("freundesliste")) {
    importanceScore += 0.8;
    reasons.push("soziales aktiv pflegen");
    signalCount += 1;
  }

  if (actionHits >= 2) {
    signalCount += 1;
  }

  if (dueWindow === "today" || dueWindow === "tomorrow" || dueWindow === "specific") {
    urgencyScore += 2.4;
    reasons.push("zeitnah fällig");
    signalCount += 1;
  } else if (dueWindow === "week") {
    urgencyScore += 1.2;
    reasons.push("diese Woche relevant");
    signalCount += 1;
  }

  if (type === "routine") {
    urgencyScore += 0.8;
    importanceScore += 0.6;
    reasons.push("Routine");
    signalCount += 1;
  }

  if (type === "project") {
    importanceScore += 1.1;
    urgencyScore -= 0.5;
    reasons.push("größeres Vorhaben");
    signalCount += 1;
  }

  if (type === "idea") {
    importanceScore -= 0.4;
    urgencyScore -= 1.0;
    reasons.push("Erkundung / Idee");
    signalCount += 1;
  }

  if (hasQuestion) {
    urgencyScore -= 0.4;
  }

  const urgencyAnswer = task.answers.urgency;
  if (urgencyAnswer === "today") {
    urgencyScore += 2.6;
    reasons.push("von dir als zeitkritisch markiert");
    signalCount += 1;
  } else if (urgencyAnswer === "week") {
    urgencyScore += 1.2;
    signalCount += 1;
  } else if (urgencyAnswer === "later") {
    urgencyScore -= 1.2;
    signalCount += 1;
  }

  const importanceAnswer = task.answers.importance;
  if (importanceAnswer === "high") {
    importanceScore += 2.6;
    reasons.push("von dir als wichtig markiert");
    signalCount += 1;
  } else if (importanceAnswer === "low") {
    importanceScore -= 1.4;
    reasons.push("von dir als eher optional markiert");
    signalCount += 1;
  }

  importanceScore = clamp(importanceScore, -1, 5);
  urgencyScore = clamp(urgencyScore, -1, 5);

  let bucket = "matrix";
  if (type === "routine") {
    bucket = "routine";
  } else if (type === "project") {
    bucket = "project";
  } else if (type === "idea") {
    bucket = "idea";
  }

  const quadrant = determineQuadrant(bucket, importanceScore, urgencyScore);
  const wordCount = countWords(effectiveTitle);
  const tooBroad = effectiveTitle.toLowerCase().includes(" und ") && wordCount >= 8;
  const hasClearAction = includesAny(lower, ACTION_KEYWORDS) || wordCount >= 4;
  const confidence = clamp(
    0.45 + signalCount * 0.07 + (task.section !== "general" ? 0.1 : 0) + (bucket !== "matrix" ? 0.08 : 0),
    0.45,
    0.96
  );

  const rawNeedsClarification =
    !task.dismissedClarification &&
    bucket === "matrix" &&
    (quadrant === "do" || quadrant === "schedule") &&
    task.section === "general" &&
    ((confidence < 0.6 && !hasClearAction) || (confidence < 0.58 && tooBroad));

  return applyManualPlacement({
    ...task,
    title: effectiveTitle,
    type,
    bucket,
    quadrant,
    dueWindow,
    urgencyScore,
    importanceScore,
    reasons: Array.from(new Set(reasons)).slice(0, 4),
    confidence,
  });
}


function buildTasksFromInput() {
  const combinedText = [state.rawText, state.ocrText].filter(Boolean).join("\n");
  buildTasksFromHeuristics(parseInputItems(combinedText));
}

function buildExistingTaskMap() {
  return new Map(
    state.tasks.map((task) => [
      normalizeWhitespace(task.title).toLowerCase(),
      {
        answers: task.answers || {},
        dismissedClarification: Boolean(task.dismissedClarification),
        manualPlacement: task.manualPlacement || "",
      },
    ])
  );
}

function hydrateTaskWithPrevious(task, previous) {
  return {
    ...task,
    answers: {
      ...task.answers,
      ...(previous?.answers || {}),
    },
    dismissedClarification: previous?.dismissedClarification || false,
    manualPlacement: previous?.manualPlacement || "",
  };
}

function buildTasksFromHeuristics(parsedItems) {
  const existingByTitle = buildExistingTaskMap();

  state.tasks = parsedItems.map((task) => {
    const previous = existingByTitle.get(normalizeWhitespace(task.title).toLowerCase());
    return scoreTask(hydrateTaskWithPrevious(task, previous));
  });
}

function applyAiDecision(baseTask, aiTask) {
  if (!aiTask) {
    return baseTask;
  }

  const validBuckets = new Set(["matrix", "routine", "project", "idea"]);
  const validQuadrants = new Set(["do", "schedule", "delegate", "delete"]);
  const bucket = validBuckets.has(aiTask.bucket) ? aiTask.bucket : baseTask.bucket;
  const quadrant = validQuadrants.has(aiTask.quadrant)
    ? aiTask.quadrant
    : bucket === "matrix"
      ? baseTask.quadrant
      : bucket === "project"
        ? "schedule"
        : "delete";

  return applyManualPlacement({
    ...baseTask,
    title: normalizeWhitespace(aiTask.cleaned_title || baseTask.title),
    type: bucket === "matrix" ? "task" : bucket,
    bucket,
    quadrant,
    reasons: Array.from(new Set([...(aiTask.reasons || []), ...baseTask.reasons])).slice(0, 4),
    confidence: clamp(Number(aiTask.confidence || Math.round(baseTask.confidence * 100)) / 100, 0.45, 0.99),
    aiDecision: aiTask,
    aiFollowUpQuestion: aiTask.follow_up_question || "",
    suggestedAction: aiTask.suggested_action || "",
  });
}

function buildTasksFromAi(parsedItems, aiPayload) {
  const existingByTitle = buildExistingTaskMap();
  const byIndex = new Map((aiPayload.tasks || []).map((entry) => [Number(entry.index), entry]));

  state.tasks = parsedItems.map((task, index) => {
    const previous = existingByTitle.get(normalizeWhitespace(task.title).toLowerCase());
    const baseTask = scoreTask(hydrateTaskWithPrevious(task, previous));
    return applyAiDecision(baseTask, byIndex.get(index));
  });

}

async function requestAiSort(parsedItems) {
  if (typeof fetch !== "function") {
    return null;
  }

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller ? window.setTimeout(() => controller.abort(), 9000) : null;

  try {
    const response = await fetch("/api/sort", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller?.signal,
      body: JSON.stringify({
        rawText: state.rawText,
        ocrText: state.ocrText,
        items: parsedItems.map((task, index) => ({
          index,
          title: task.title,
          section: task.section,
        })),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "AI-Sortierung fehlgeschlagen.");
    }

    state.engine = {
      available: true,
      model: payload.model || "",
      checked: true,
    };
    setEngineBadge(`Claude${payload.model ? ` (${payload.model})` : ""}`, "claude");

    return payload;
  } catch (error) {
    console.warn("AI-Sortierung nicht verfügbar, nutze Fallback.", error);
    setEngineBadge("Fallback-Heuristik", "fallback");
    return null;
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function refreshEngineStatus() {
  if (typeof fetch !== "function") {
    return;
  }

  try {
    const response = await fetch("/api/status");
    const payload = await response.json();

    state.engine = {
      available: Boolean(payload.ai_enabled),
      model: payload.model || "",
      checked: true,
    };

    if (payload.ai_enabled) {
      setEngineBadge(`Claude${payload.model ? ` (${payload.model})` : ""}`, "claude");
      setStatus(`Claude-Sortierung bereit (${payload.model || "Modell gesetzt"}).`);
    } else {
      setEngineBadge("Fallback-Heuristik", "fallback");
      setStatus("ANTHROPIC_API_KEY nicht gesetzt. Nutze lokale Fallback-Sortierung.");
    }
  } catch (error) {
    state.engine = {
      available: false,
      model: "",
      checked: true,
    };
    setEngineBadge("Fallback-Heuristik", "fallback");
  }
}

function getQuadrantLabel(quadrant) {
  if (quadrant === "do") {
    return "Jetzt";
  }
  if (quadrant === "schedule") {
    return "Einplanen";
  }
  if (quadrant === "delegate") {
    return "Begrenzen";
  }
  return "Parken";
}

function getTypeLabel(task) {
  if (task.bucket === "routine") {
    return "Routine";
  }
  if (task.bucket === "project") {
    return "Projekt";
  }
  if (task.bucket === "idea") {
    return "Idee";
  }
  return getQuadrantLabel(task.quadrant);
}

function getTaskHint(task) {
  if (task.bucket === "routine") {
    return "Wiederkehrend. Lieber als kleines Paket abarbeiten statt jedes Mal neu priorisieren.";
  }

  if (task.bucket === "project") {
    return "Nicht komplett lösen. Plane nur den nächsten 20-Minuten-Schritt.";
  }

  if (task.bucket === "idea") {
    return "Nur aktivieren, wenn du bewusst Zeit für Exploration freigemacht hast.";
  }

  if (task.quadrant === "do") {
    return "Wenn heute nur wenige Dinge passieren, sollte das dabei sein.";
  }

  if (task.quadrant === "schedule") {
    return "Wichtig, aber nicht alles auf einmal. Bewusst terminieren.";
  }

  if (task.quadrant === "delegate") {
    return "Kurz halten, batchen oder abkürzen.";
  }

  return "Im Moment kein Prioritätskandidat.";
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEmptyState(target, text) {
  const empty = document.createElement("div");
  empty.className = "empty-state-card";
  empty.innerHTML = `<p class="empty-state">${escapeHtml(text)}</p>`;
  target.append(empty);
}

function buildTaskCard(task, { special = false } = {}) {
  const card = document.createElement("article");
  card.className = `task-card task-card--${task.bucket === "matrix" ? task.quadrant : task.bucket}${special ? " is-special" : ""}`;
  const reasons = task.reasons.length
    ? task.reasons.map((reason) => `<span class="reason-chip">${escapeHtml(reason)}</span>`).join("")
    : `<span class="reason-chip">mutig vorsortiert</span>`;

  card.innerHTML = `
    <div class="task-topline">
      <span class="task-badge">${escapeHtml(getTypeLabel(task))}</span>
      <span class="task-badge">${Math.round(task.confidence * 100)}% Klarheit</span>
    </div>
    <h3 class="task-title">${escapeHtml(task.title)}</h3>
    <p class="task-note">${escapeHtml(getTaskHint(task))}</p>
    <div class="task-reasons">${reasons}</div>
    <div class="task-controls">
      <label class="field-label" for="move-${task.id}">Manuell sortieren</label>
      <select class="task-select" id="move-${task.id}" data-move-select="${task.id}">
        <option value="auto"${task.manualPlacement ? "" : " selected"}>Auto: ${escapeHtml(getTypeLabel(task))}</option>
        <option value="do"${task.manualPlacement === "do" ? " selected" : ""}>Jetzt</option>
        <option value="schedule"${task.manualPlacement === "schedule" ? " selected" : ""}>Einplanen</option>
        <option value="delegate"${task.manualPlacement === "delegate" ? " selected" : ""}>Begrenzen</option>
        <option value="delete"${task.manualPlacement === "delete" ? " selected" : ""}>Parken</option>
        <option value="routine"${task.manualPlacement === "routine" ? " selected" : ""}>Routine</option>
        <option value="project"${task.manualPlacement === "project" ? " selected" : ""}>Projekt</option>
        <option value="idea"${task.manualPlacement === "idea" ? " selected" : ""}>Idee</option>
      </select>
    </div>
  `;

  return card;
}

function setManualPlacement(taskId, placement) {
  const task = state.tasks.find((entry) => entry.id === taskId);
  if (!task) {
    return;
  }

  task.manualPlacement = placement === "auto" ? "" : placement;
  Object.assign(task, scoreTask(task));
  buildTimeline();
  saveState();
  renderAll();
}

function renderMatrixTasks() {
  Object.values(quadrantTargets).forEach((target) => {
    target.innerHTML = "";
  });

  const matrixTasks = state.tasks
    .filter((task) => task.bucket === "matrix")
    .slice()
    .sort((left, right) => right.importanceScore + right.urgencyScore - (left.importanceScore + left.urgencyScore));

  matrixTasks.forEach((task) => {
    quadrantTargets[task.quadrant]?.append(buildTaskCard(task));
  });

  Object.entries(quadrantTargets).forEach(([quadrant, target]) => {
    if (countTargets[quadrant]) {
      countTargets[quadrant].textContent = String(matrixTasks.filter((task) => task.quadrant === quadrant).length);
    }
    target.parentElement?.classList.toggle("is-empty", !target.childElementCount);
  });

  Object.entries(quadrantTargets).forEach(([quadrant, target]) => {
    if (!target.childElementCount) {
      renderEmptyState(target, quadrant === "delete" ? "Gerade nichts geparkt." : "Noch keine Aufgabe hier.");
    }
  });
}

function renderSpecialBuckets() {
  Object.values(bucketTargets).forEach((target) => {
    target.innerHTML = "";
  });

  const bucketOrder = {
    routine: (task) => task.urgencyScore + task.importanceScore,
    project: (task) => task.importanceScore * 2 + task.urgencyScore,
    idea: (task) => task.importanceScore + task.confidence,
  };

  Object.entries(bucketTargets).forEach(([bucket, target]) => {
    const bucketTasks = state.tasks
      .filter((task) => task.bucket === bucket)
      .slice()
      .sort((left, right) => bucketOrder[bucket](right) - bucketOrder[bucket](left));

    if (countTargets[bucket]) {
      countTargets[bucket].textContent = String(bucketTasks.length);
    }

    target.parentElement?.classList.toggle("is-empty", !bucketTasks.length);

    bucketTasks.forEach((task) => target.append(buildTaskCard(task, { special: true })));

    if (!target.childElementCount) {
      const fallback =
        bucket === "routine"
          ? "Keine Routinen erkannt."
          : bucket === "project"
            ? "Keine größeren Vorhaben erkannt."
            : "Keine Ideen geparkt.";
      renderEmptyState(target, fallback);
    }
  });

  const directCount = state.tasks.length;
  const routineCount = state.tasks.filter((task) => task.bucket === "routine").length;
  const projectCount = state.tasks.filter((task) => task.bucket === "project").length;
  const ideaCount = state.tasks.filter((task) => task.bucket === "idea").length;

  smartSummary.textContent = `${directCount} sortiert: ${routineCount} Routinen, ${projectCount} Projekte, ${ideaCount} Ideen.`;
}

// ─── Triage ───

function quadrantToTriage(task) {
  const q = task.quadrant || "delete";
  return {
    urgent: q === "do" || q === "delegate",
    important: q === "do" || q === "schedule",
  };
}

function showTriageStep() {
  state.triageConfirmed = false;
  state.tasks.forEach((t) => { t.triageConfirmed = false; });
  triageSection.hidden = false;
  document.getElementById("results-area").hidden = true;
  renderTriage();
  triageSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderTriage() {
  triageList.innerHTML = "";
  const confirmed = state.tasks.filter((t) => t.triageConfirmed).length;
  triageProgress.textContent = `${confirmed} / ${state.tasks.length} bestätigt`;

  state.tasks.forEach((task, i) => {
    const ai = quadrantToTriage(task);
    const isUrgentYes = task.answers.urgency === "today" || (!task.answers.urgency && ai.urgent);
    const isImportantYes = task.answers.importance === "high" || (!task.answers.importance && ai.important);

    const row = document.createElement("article");
    row.className = `triage-row${task.triageConfirmed ? " is-confirmed" : ""}`;
    row.dataset.taskId = task.id;
    row.style.animationDelay = `${i * 0.03}s`;

    const typeChip = task.bucket !== "matrix"
      ? `<span class="triage-type-chip">${task.bucket === "routine" ? "Routine" : task.bucket === "project" ? "Projekt" : "Idee"}</span>`
      : "";

    row.innerHTML = `
      <span class="triage-title">${escapeHtml(task.title)}</span>
      ${typeChip}
      <div class="triage-toggles">
        <div class="triage-group">
          <span class="triage-label">Dringend?</span>
          <button class="triage-btn is-yes${isUrgentYes ? " is-selected" : ""}" type="button" data-triage="urgency" data-value="yes">${!task.answers.urgency && ai.urgent ? 'Ja<span class="ki-hint">KI</span>' : "Ja"}</button>
          <button class="triage-btn is-no${!isUrgentYes ? " is-selected" : ""}" type="button" data-triage="urgency" data-value="no">${!task.answers.urgency && !ai.urgent ? 'Nein<span class="ki-hint">KI</span>' : "Nein"}</button>
        </div>
        <div class="triage-group">
          <span class="triage-label">Wichtig?</span>
          <button class="triage-btn is-yes${isImportantYes ? " is-selected" : ""}" type="button" data-triage="importance" data-value="yes">${!task.answers.importance && ai.important ? 'Ja<span class="ki-hint">KI</span>' : "Ja"}</button>
          <button class="triage-btn is-no${!isImportantYes ? " is-selected" : ""}" type="button" data-triage="importance" data-value="no">${!task.answers.importance && !ai.important ? 'Nein<span class="ki-hint">KI</span>' : "Nein"}</button>
        </div>
      </div>
    `;

    triageList.append(row);
  });
}

function applyTriageToTask(taskId, field, value) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (field === "urgency") {
    task.answers.urgency = value === "yes" ? "today" : "later";
  } else if (field === "importance") {
    task.answers.importance = value === "yes" ? "high" : "low";
  }
  task.triageConfirmed = true;
  saveState();

  const confirmed = state.tasks.filter((t) => t.triageConfirmed).length;
  triageProgress.textContent = `${confirmed} / ${state.tasks.length} bestätigt`;

  const row = triageList.querySelector(`[data-task-id="${taskId}"]`);
  if (row) row.classList.add("is-confirmed");
}

function acceptAllTriageSuggestions() {
  state.tasks.forEach((task) => {
    if (task.triageConfirmed) return;
    const ai = quadrantToTriage(task);
    if (!task.answers.urgency) task.answers.urgency = ai.urgent ? "today" : "later";
    if (!task.answers.importance) task.answers.importance = ai.important ? "high" : "low";
    task.triageConfirmed = true;
  });
  saveState();
  renderTriage();
}

function confirmTriage() {
  state.tasks.forEach((task) => {
    if (!task.triageConfirmed) {
      const ai = quadrantToTriage(task);
      if (!task.answers.urgency) task.answers.urgency = ai.urgent ? "today" : "later";
      if (!task.answers.importance) task.answers.importance = ai.important ? "high" : "low";
      task.triageConfirmed = true;
    }
    Object.assign(task, scoreTask(task));
  });

  state.triageConfirmed = true;
  buildTimeline();
  saveState();
  renderAll();

  triageSection.hidden = true;
  document.getElementById("results-area").hidden = false;
  document.getElementById("results-area").scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatTime(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function parseStartTime(value) {
  const [hours, minutes] = String(value || "09:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function getEnergyMultiplier() {
  if (energyLevelInput.value === "high") {
    return 1.15;
  }
  if (energyLevelInput.value === "low") {
    return 0.82;
  }
  return 1;
}

function estimateMinutes(task) {
  if (task.bucket === "routine") {
    return 10;
  }
  if (task.bucket === "project") {
    return 25;
  }
  if (task.quadrant === "do") {
    return 45;
  }
  if (task.quadrant === "schedule") {
    return 35;
  }
  if (task.quadrant === "delegate") {
    return 20;
  }
  return 15;
}

function scoreForToday(task) {
  return task.importanceScore * 1.8 + task.urgencyScore + task.confidence;
}

function scheduleBlock(block, start) {
  return {
    ...block,
    start,
    end: start + block.duration,
  };
}

function buildTimeline() {
  const startMinutes = parseStartTime(dayStartInput.value);
  const availableMinutes = Math.max(60, Number(availableHoursInput.value || 6) * 60);
  const energyMultiplier = getEnergyMultiplier();

  const actionable = state.tasks
    .filter((task) => task.bucket === "matrix" && task.quadrant !== "delete")
    .slice()
    .sort((left, right) => scoreForToday(right) - scoreForToday(left));

  const projects = state.tasks
    .filter((task) => task.bucket === "project" && task.quadrant === "schedule")
    .slice()
    .sort((left, right) => scoreForToday(right) - scoreForToday(left));

  const routines = state.tasks
    .filter((task) => task.bucket === "routine")
    .slice()
    .sort((left, right) => scoreForToday(right) - scoreForToday(left));

  const blocks = [];
  let currentTime = startMinutes;
  let minutesLeft = availableMinutes;

  const arrivalBlock = {
    label: "Ankommen",
    title: "2 Minuten orientieren und nur eine Startaufgabe wählen",
    duration: 10,
    note: "Kein Neuplanen-Marathon. Nur den Einstieg klarziehen.",
  };

  blocks.push(scheduleBlock(arrivalBlock, currentTime));
  currentTime += arrivalBlock.duration;
  minutesLeft -= arrivalBlock.duration;

  if (routines.length && minutesLeft >= 15) {
    const routineTitles = routines.slice(0, 3).map((task) => task.title).join(" • ");
    const routineBlock = {
      label: "Routinepaket",
      title: routineTitles,
      duration: 15,
      note: "Wiederkehrendes gebündelt erledigen statt verstreut dazwischen.",
      badge: "Routine",
    };
    blocks.push(scheduleBlock(routineBlock, currentTime));
    currentTime += routineBlock.duration;
    minutesLeft -= routineBlock.duration;
  }

  const topTasks = actionable.slice(0, 3);
  topTasks.forEach((task, index) => {
    if (minutesLeft < 25) {
      return;
    }

    const duration = Math.max(15, Math.round(estimateMinutes(task) / energyMultiplier / 5) * 5);
    const boundedDuration = Math.min(duration, minutesLeft - 10);

    if (boundedDuration < 15) {
      return;
    }

    blocks.push(
      scheduleBlock(
        {
          label: task.quadrant === "do" ? "Fokusblock" : task.quadrant === "schedule" ? "Wichtig" : "Admin",
          title: task.title,
          duration: boundedDuration,
          note: task.quadrant === "delegate" ? "Kurz halten. Kein Perfektionismus." : "Nur diese eine Sache.",
          badge: getQuadrantLabel(task.quadrant),
        },
        currentTime
      )
    );
    currentTime += boundedDuration;
    minutesLeft -= boundedDuration;

    if (minutesLeft >= 10 && index < topTasks.length - 1) {
      blocks.push(
        scheduleBlock(
          {
            label: "Pause",
            title: "Aufstehen, trinken, nicht wegdriften",
            duration: 10,
            note: "Kleiner Reset, keine neue Baustelle.",
          },
          currentTime
        )
      );
      currentTime += 10;
      minutesLeft -= 10;
    }
  });

  if (projects.length && minutesLeft >= 25) {
    const project = projects[0];
    const projectDuration = Math.min(25, minutesLeft - 10);

    if (projectDuration >= 15) {
      blocks.push(
        scheduleBlock(
          {
            label: "Projekt-Nächster-Schritt",
            title: `Konkreten nächsten Schritt für: ${project.title}`,
            duration: projectDuration,
            note: "Nicht das ganze Projekt. Nur den ersten klaren Move festlegen.",
            badge: "Projekt",
          },
          currentTime
        )
      );
      currentTime += projectDuration;
      minutesLeft -= projectDuration;
    }
  }

  if (minutesLeft >= 15) {
    const shutdownDuration = Math.min(15, minutesLeft);
    blocks.push(
      scheduleBlock(
        {
          label: "Shutdown",
          title: "Morgen-Starter notieren und offen beenden",
          duration: shutdownDuration,
          note: "Den Wiedereinstieg leichter machen, nicht weiter optimieren.",
        },
        currentTime
      )
    );
  }

  state.timeline = blocks;

  const nextTask = actionable[0] || projects[0] || routines[0];
  if (nextTask?.bucket === "project") {
    state.nextStepText = `Nächsten Schritt für "${nextTask.title}" festlegen`;
  } else {
    state.nextStepText = nextTask?.title || "Erst Input sortieren oder offene Blocker bestätigen.";
  }
}

function renderTimeline() {
  nextStep.innerHTML = `
    <p class="next-step-label">Nächster Schritt</p>
    <strong>${escapeHtml(state.nextStepText)}</strong>
  `;

  if (!state.timeline.length) {
    timeline.innerHTML = `<p class="empty-state">Noch kein Tagesplan erstellt.</p>`;
    return;
  }

  timeline.innerHTML = "";

  state.timeline.forEach((block) => {
    const item = document.createElement("article");
    item.className = "timeline-item";
    const badge = block.badge ? `<span class="timeline-badge">${escapeHtml(block.badge)}</span>` : "";

    item.innerHTML = `
      <div class="timeline-topline">
        <span class="timeline-time">${formatTime(block.start)} - ${formatTime(block.end)}</span>
        <div>
          <p class="timeline-label">${escapeHtml(block.label)}</p>
          <strong>${escapeHtml(block.title)}</strong>
        </div>
      </div>
      <p class="timeline-note">${escapeHtml(block.note)} ${badge}</p>
    `;

    timeline.append(item);
  });
}

let mindElixirInstance = null;

function buildMindmapData() {
  const QUADRANT_LABELS = {
    do:       { topic: "🟢 Sofort",     style: { background: "#dcfce7", color: "#15803d", borderColor: "#16a34a" } },
    schedule: { topic: "🔵 Einplanen",  style: { background: "#dbeafe", color: "#1d4ed8", borderColor: "#3b82f6" } },
    delegate: { topic: "🟡 Delegieren", style: { background: "#fef3c7", color: "#b45309", borderColor: "#f59e0b" } },
    delete:   { topic: "🟣 Parken",     style: { background: "#f3e8ff", color: "#7c3aed", borderColor: "#8b5cf6" } },
  };

  const bucketNodes = {
    do: [], schedule: [], delegate: [], delete: [],
    routine: [], project: [], idea: [],
  };

  state.tasks.forEach((task) => {
    const key = task.bucket === "matrix" ? task.quadrant : task.bucket;
    if (bucketNodes[key]) {
      bucketNodes[key].push({
        topic: task.title,
        id: task.id,
        style: { fontSize: "13px" },
      });
    }
  });

  const matrixChildren = ["do", "schedule", "delegate", "delete"]
    .filter((q) => bucketNodes[q].length > 0)
    .map((q) => ({
      topic: QUADRANT_LABELS[q].topic,
      id: `q-${q}`,
      style: QUADRANT_LABELS[q].style,
      children: bucketNodes[q],
    }));

  const specialChildren = [
    { key: "routine", label: "🟢 Routinen",   color: "#059669" },
    { key: "project", label: "🟣 Projekte",    color: "#8b5cf6" },
    { key: "idea",    label: "🩷 Ideen",       color: "#ec4899" },
  ]
    .filter(({ key }) => bucketNodes[key].length > 0)
    .map(({ key, label, color }) => ({
      topic: label,
      id: `bucket-${key}`,
      style: { color, fontSize: "13px", fontWeight: "bold" },
      children: bucketNodes[key],
    }));

  const rootChildren = [...matrixChildren];
  if (specialChildren.length) rootChildren.push(...specialChildren);

  return {
    nodeData: {
      id: "root",
      topic: "Klare Spur",
      root: true,
      style: {
        background: "#6366f1",
        color: "#fff",
        fontSize: "16px",
        fontWeight: "bold",
        borderRadius: "12px",
      },
      children: rootChildren,
    },
  };
}

function renderMindmap() {
  if (!window.MindElixir) return;
  if (!state.tasks.length) return;

  const container = document.getElementById("mindmap-container");
  if (!container) return;

  const data = buildMindmapData();

  if (mindElixirInstance) {
    mindElixirInstance.refresh(data);
    setTimeout(() => mindElixirInstance.toCenter(), 100);
    return;
  }

  const ME = MindElixir.default || MindElixir;
  mindElixirInstance = new ME({
    el: "#mindmap-container",
    direction: MindElixir.SIDE,
    data,
    draggable: true,
    contextMenu: false,
    toolBar: false,
    nodeMenu: false,
    keypress: false,
    theme: {
      name: "light",
      palette: ["#6366f1","#16a34a","#3b82f6","#f59e0b","#8b5cf6","#ec4899","#64748b"],
      cssVar: {
        "--main-color": "#1a1d2e",
        "--main-bgcolor": "#fafbff",
        "--color": "#1a1d2e",
        "--bgcolor": "#ffffff",
        "--panel-color": "#1a1d2e",
        "--panel-bgcolor": "#f5f6fa",
        "--selected-color": "#fff",
        "--selected-bgcolor": "#6366f1",
      },
    },
  });

  mindElixirInstance.init(data);
  setTimeout(() => mindElixirInstance.toCenter(), 100);
}

function renderAll() {
  renderMatrixTasks();
  renderSpecialBuckets();
  renderTimeline();
  renderMindmap();
  const resultsArea = document.getElementById("results-area");
  if (resultsArea && state.tasks.length > 0) {
    resultsArea.hidden = false;
  }
}

async function runOcrOnFile(file) {
  if (!file) {
    return;
  }

  if (!window.Tesseract) {
    setStatus("OCR-Bibliothek konnte nicht geladen werden. Text geht trotzdem.");
    return;
  }

  const dataUrl = await fileToDataUrl(file);
  state.screenshotDataUrl = dataUrl;
  previewImage.src = dataUrl;
  previewImage.hidden = false;
  previewFrame.querySelector(".preview-empty")?.classList.add("is-hidden");
  saveState();

  try {
    analyzeButton.disabled = true;
    setStatus("Screenshot wird per OCR gelesen ...");

    const result = await window.Tesseract.recognize(file, OCR_LANG, {
      logger(message) {
        if (message.status === "recognizing text") {
          setStatus(`OCR läuft ... ${Math.round((message.progress || 0) * 100)}%`);
        }
      },
    });

    state.ocrText = normalizeWhitespace(result.data.text || "");
    ocrOutput.value = state.ocrText;
    saveState();
    setStatus(state.ocrText ? "OCR fertig. Du kannst direkt sortieren." : "OCR fertig, aber es wurde kaum Text erkannt.");
  } catch (error) {
    console.error(error);
    setStatus("OCR ist fehlgeschlagen. Text kannst du trotzdem manuell einfügen.");
  } finally {
    analyzeButton.disabled = false;
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function clearImage() {
  state.screenshotDataUrl = "";
  state.ocrText = "";
  imageInput.value = "";
  previewImage.src = "";
  previewImage.hidden = true;
  previewFrame.querySelector(".preview-empty")?.classList.remove("is-hidden");
  ocrOutput.value = "";
  saveState();
  setStatus("Screenshot entfernt.");
}

function resetApp() {
  state = {
    rawText: "",
    ocrText: "",
    screenshotDataUrl: "",
    tasks: [],
    timeline: [],
    nextStepText: "Warte auf Input.",
    engine: {
      available: state.engine?.available || false,
      model: state.engine?.model || "",
      checked: state.engine?.checked || false,
    },
    triageConfirmed: false,
    settings: {
      dayStart: "09:00",
      availableHours: "6",
      energyLevel: "medium",
    },
  };

  rawInput.value = "";
  ocrOutput.value = "";
  imageInput.value = "";
  previewImage.src = "";
  previewImage.hidden = true;
  previewFrame.querySelector(".preview-empty")?.classList.remove("is-hidden");
  triageSection.hidden = true;
  dayStartInput.value = "09:00";
  availableHoursInput.value = "6";
  energyLevelInput.value = "medium";

  window.localStorage.removeItem(STORAGE_KEY);
  saveState();
  renderAll();

  if (state.engine.available) {
    setEngineBadge(`OpenAI${state.engine.model ? ` (${state.engine.model})` : ""}`, "openai");
    setStatus("Alles geleert. OpenAI-Sortierung bleibt aktiv.");
  } else {
    setEngineBadge("Fallback-Heuristik", "fallback");
    setStatus("Alles geleert.");
  }
}

async function analyzeInput() {
  state.rawText = rawInput.value.trim();
  state.ocrText = ocrOutput.value.trim();

  if (!state.rawText && !state.ocrText) {
    setStatus("Füge erst Text oder einen Screenshot ein.");
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Sortiere ...";
  setStatus("Sortiere Aufgaben ...");

  try {
    const parsedItems = parseInputItems([state.rawText, state.ocrText].filter(Boolean).join("\n"));

    if (!parsedItems.length) {
      setStatus("Ich habe daraus noch keine Aufgaben erkannt.");
      return;
    }

    const aiPayload = await requestAiSort(parsedItems);

    if (aiPayload?.tasks?.length) {
      buildTasksFromAi(parsedItems, aiPayload);
    } else {
      buildTasksFromHeuristics(parsedItems);
    }

    saveState();
    showTriageStep();

    const engineLabel = aiPayload?.tasks?.length
      ? `Claude${state.engine.model ? ` (${state.engine.model})` : ""}`
      : "Fallback";

    setStatus(`${engineLabel}: ${state.tasks.length} Aufgaben erkannt. Bitte kurz bestätigen: Dringend? Wichtig?`);
  } catch (error) {
    console.error(error);
    setStatus("Beim Sortieren ist ein Fehler passiert. Bitte Seite neu laden oder nochmal versuchen.");
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Aufgaben sortieren";
  }
}

function restoreUi() {
  rawInput.value = state.rawText;
  ocrOutput.value = state.ocrText;
  dayStartInput.value = state.settings?.dayStart || "09:00";
  availableHoursInput.value = state.settings?.availableHours || "6";
  energyLevelInput.value = state.settings?.energyLevel || "medium";

  if (state.screenshotDataUrl) {
    previewImage.src = state.screenshotDataUrl;
    previewImage.hidden = false;
    previewFrame.querySelector(".preview-empty")?.classList.add("is-hidden");
  }

  if (state.tasks.length > 0 && state.triageConfirmed) {
    renderAll();
  } else if (state.tasks.length > 0 && !state.triageConfirmed) {
    showTriageStep();
  }
}

function migrateStoredTasks() {
  if (!Array.isArray(state.tasks) || !state.tasks.length) {
    return;
  }

  state.tasks = state.tasks.map((task) =>
    scoreTask({
      id: task.id || uid(),
      title: task.title || "",
      section: task.section || "general",
      source: task.source || "mixed",
      answers: {
        action: task.answers?.action || "",
        urgency: task.answers?.urgency || "",
        importance: task.answers?.importance || "",
        dueWindow: task.answers?.dueWindow || "",
      },
      dismissedClarification: Boolean(task.dismissedClarification),
      manualPlacement: task.manualPlacement || "",
      triageConfirmed: Boolean(task.triageConfirmed),
    })
  );

  buildTimeline();
  saveState();
}

loadState();
migrateStoredTasks();
restoreUi();
renderAll();
void refreshEngineStatus();

loadDemoButton.addEventListener("click", () => {
  rawInput.value = demoInput;
  state.rawText = demoInput;
  saveState();
  setStatus("Demo-Input geladen.");
});

analyzeButton.addEventListener("click", () => {
  void analyzeInput();
});

document.getElementById("export-pdf")?.addEventListener("click", () => {
  window.print();
});

buildDayButton.addEventListener("click", () => {
  if (!state.tasks.length) {
    void analyzeInput();
    return;
  }

  buildTimeline();
  saveState();
  renderTimeline();
  setStatus("Tagesplan aktualisiert.");
});

useOcrTextButton.addEventListener("click", () => {
  const value = normalizeWhitespace(ocrOutput.value);
  if (!value) {
    setStatus("Noch kein OCR-Text vorhanden.");
    return;
  }

  rawInput.value = rawInput.value ? `${rawInput.value.trim()}\n${value}` : value;
  state.rawText = rawInput.value;
  saveState();
  setStatus("OCR-Text in die Inbox übernommen.");
});

clearImageButton.addEventListener("click", clearImage);
resetAppButton?.addEventListener("click", resetApp);

imageInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (file) {
    await runOcrOnFile(file);
  }
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("is-dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("is-dragover");
});

dropzone.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropzone.classList.remove("is-dragover");
  const file = Array.from(event.dataTransfer?.files || []).find((entry) => entry.type.startsWith("image/"));
  if (file) {
    await runOcrOnFile(file);
  }
});

dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    imageInput.click();
  }
});

document.addEventListener("paste", async (event) => {
  const clipboardItems = Array.from(event.clipboardData?.items || []);
  const imageItem = clipboardItems.find((item) => item.type.startsWith("image/"));

  if (imageItem) {
    const file = imageItem.getAsFile();
    if (file) {
      await runOcrOnFile(file);
      return;
    }
  }

  const text = event.clipboardData?.getData("text");
  if (text && document.activeElement !== rawInput && document.activeElement !== ocrOutput) {
    rawInput.value = rawInput.value ? `${rawInput.value.trim()}\n${text.trim()}` : text.trim();
    state.rawText = rawInput.value;
    saveState();
    setStatus("Eingefügter Text wurde in die Inbox gelegt.");
  }
});

document.addEventListener("change", (event) => {
  const select = event.target.closest("[data-move-select]");
  if (!select) {
    return;
  }

  setManualPlacement(select.dataset.moveSelect, select.value);
  setStatus(select.value === "auto" ? "Automatische Sortierung wieder aktiv." : "Aufgabe manuell verschoben.");
});

triageList.addEventListener("click", (event) => {
  const btn = event.target.closest(".triage-btn");
  if (!btn) return;

  const row = btn.closest(".triage-row");
  const taskId = row?.dataset.taskId;
  const field = btn.dataset.triage;
  const value = btn.dataset.value;
  if (!taskId || !field) return;

  const group = btn.closest(".triage-group");
  group?.querySelectorAll(".triage-btn").forEach((b) => b.classList.remove("is-selected"));
  btn.classList.add("is-selected");

  applyTriageToTask(taskId, field, value);
});

triageAcceptAll?.addEventListener("click", acceptAllTriageSuggestions);
triageConfirmBtn?.addEventListener("click", confirmTriage);

rawInput.addEventListener("input", () => {
  state.rawText = rawInput.value;
  saveState();
});

ocrOutput.addEventListener("input", () => {
  state.ocrText = ocrOutput.value;
  saveState();
});

dayStartInput.addEventListener("change", saveState);
availableHoursInput.addEventListener("change", saveState);
energyLevelInput.addEventListener("change", saveState);

// ─── Inline Tip Popups ───
const tipPopup = document.querySelector("#tip-popup");
let activeTipBtn = null;

function closeTip() {
  tipPopup.hidden = true;
  activeTipBtn = null;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".tip-btn");
  if (!btn || !btn.dataset.tip) {
    if (!e.target.closest(".tip-popup")) closeTip();
    return;
  }
  e.preventDefault();
  e.stopPropagation();

  if (activeTipBtn === btn) { closeTip(); return; }

  activeTipBtn = btn;
  tipPopup.textContent = btn.dataset.tip;
  tipPopup.hidden = false;

  const r = btn.getBoundingClientRect();
  let top = r.bottom + 8;
  let left = r.left + r.width / 2 - 160;
  left = Math.max(12, Math.min(left, window.innerWidth - 332));
  if (top + 120 > window.innerHeight) top = r.top - tipPopup.offsetHeight - 8;
  tipPopup.style.top = top + "px";
  tipPopup.style.left = left + "px";
});

document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeTip(); });

// ─── Help Modal ───
const helpBtn = document.querySelector("#help-btn");
const helpOverlay = document.querySelector("#help-overlay");
const helpClose = document.querySelector("#help-close");
helpBtn?.addEventListener("click", () => { helpOverlay.hidden = false; });
helpClose?.addEventListener("click", () => { helpOverlay.hidden = true; });
helpOverlay?.addEventListener("click", (e) => { if (e.target === helpOverlay) helpOverlay.hidden = true; });
