/**
 * Summarizer Module
 * Extracts structured cycle data from user input without exposing sensitive text
 */

export function extractSummary(text) {
  const normalized = text.toLowerCase().trim();
  const tokens = normalized.split(/\W+/);

  // --- DATE PARSING ---
  const dateRegex =
    /(yesterday|today|tomorrow|last (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2} (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\b(january|february|march|april|may|june|july|august|september|october|november|december) \d{1,2}\b)/;
  const dateMatch = normalized.match(dateRegex);
  const periodStart = dateMatch
    ? parseRelativeDate(dateMatch[0])
    : formatDate(new Date());

  // --- SYMPTOM EXTRACTION ---
  const symptomWords = [
    "tired",
    "fatigue",
    "cramps",
    "pain",
    "bloating",
    "bloated",
    "headache",
    "migraine",
    "nausea",
    "sore breasts",
    "mood swings",
    "anxiety",
    "depression",
    "acne",
    "diarrhea",
    "constipation",
    "dizziness",
    "back pain",
    "leg pain",
    "water retention",
    "irritability",
    "tender breasts",
    "food cravings",
    "insomnia",
    "heavy bleeding",
    "light bleeding",
    "spotting",
    "breast tenderness",
    "abdominal pain",
  ];

  const symptoms = symptomWords
    .filter((symptom) => new RegExp(`\\b${symptom}\\b`).test(normalized))
    .map((symptom) =>
      symptom
        .replace("sore breasts", "soreBreasts")
        .replace("mood swings", "moodSwings")
        .replace("tender breasts", "tenderBreasts")
        .replace("breast tenderness", "breastTenderness")
        .replace("back pain", "backPain")
        .replace("leg pain", "legPain")
        .replace("abdominal pain", "abdominalPain")
        .replace("light bleeding", "lightBleeding")
        .replace("heavy bleeding", "heavyBleeding")
        .replace("food cravings", "foodCravings")
        .replace("water retention", "waterRetention")
    );

  // --- MOOD ANALYSIS ---
  const moodWords = {
    positive: [
      "happy",
      "great",
      "good",
      "fine",
      "well",
      "okay",
      "excited",
      "joyful",
      "content",
      "calm",
    ],
    negative: [
      "sad",
      "upset",
      "angry",
      "stressed",
      "anxious",
      "depressed",
      "tired",
      "exhausted",
      "irritable",
      "frustrated",
      "miserable",
      "worried",
      "bad",
    ],
  };

  const positiveScore = tokens.filter((token) =>
    moodWords.positive.includes(token)
  ).length;
  const negativeScore = tokens.filter((token) =>
    moodWords.negative.includes(token)
  ).length;

  let mood = "neutral";
  if (negativeScore > positiveScore) mood = "low";
  else if (positiveScore > negativeScore) mood = "positive";

  return {
    period_start: periodStart,
    symptoms: symptoms.length > 0 ? symptoms : ['no specific symptoms mentioned'],
    mood
  };
}

// --- Helper to parse relative dates ---
function parseRelativeDate(relativeDate) {
  const today = new Date();
  const lowerDate = relativeDate.toLowerCase();

  const dayOffsets = {
    yesterday: -1,
    today: 0,
    tomorrow: 1,
  };

  if (lowerDate in dayOffsets) {
    today.setDate(today.getDate() + dayOffsets[lowerDate]);
    return formatDate(today);
  }

  const dayOfWeekRegex =
    /last (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/;
  const dowMatch = lowerDate.match(dayOfWeekRegex);
  if (dowMatch) {
    const days = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const targetDay = days[dowMatch[1]];
    let daysAgo = today.getDay() - targetDay;
    if (daysAgo <= 0) daysAgo += 7;
    today.setDate(today.getDate() - daysAgo);
    return formatDate(today);
  }

  const shortDate =
    /(\d{1,2}) (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
  const longDate =
    /(january|february|march|april|may|june|july|august|september|october|november|december) (\d{1,2})/i;

  let date = new Date();
  if (shortDate.test(lowerDate)) {
    const [, day, month] = lowerDate.match(shortDate);
    date = new Date(`${month} ${day}, ${date.getFullYear()}`);
  } else if (longDate.test(lowerDate)) {
    const [, month, day] = lowerDate.match(longDate);
    date = new Date(`${month} ${day}, ${date.getFullYear()}`);
  }

  return formatDate(date);
}

// --- Format date as "Month Day" ---
function formatDate(date) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}
