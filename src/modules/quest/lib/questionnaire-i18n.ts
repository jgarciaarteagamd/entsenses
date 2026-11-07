// English translations for the 6 clinical questionnaires used by ENT Senses Quest.
// These are standard published English versions of well-known validated
// instruments (EAT-10, SNOT-22, THI, DHI, ETDQ-7, VHI-30). Question
// order and scoring must match the Spanish structures stored in the DB.

import type { Lang } from "@/modules/quest/i18n";

export interface LocalisedOption {
  label: string;
  value: number;
}
export interface LocalisedItem {
  text: string;
  options: LocalisedOption[];
}
export interface LocalisedQuestionnaire {
  name: string;
  description: string;
  items: LocalisedItem[];
}

// Common option sets
const YES_MAYBE_NO_EN: LocalisedOption[] = [
  { label: "Yes", value: 4 },
  { label: "Sometimes", value: 2 },
  { label: "No", value: 0 },
];

const EAT10_OPTS_EN: LocalisedOption[] = [
  { label: "No problem", value: 0 },
  { label: "Mild problem", value: 1 },
  { label: "Moderate problem", value: 2 },
  { label: "Severe problem", value: 3 },
];

const SNOT22_OPTS_EN: LocalisedOption[] = [
  { label: "No problem", value: 0 },
  { label: "Very mild problem", value: 1 },
  { label: "Mild problem", value: 2 },
  { label: "Moderate problem", value: 3 },
  { label: "Severe problem", value: 4 },
  { label: "Problem as bad as it can be", value: 5 },
];

const ETDQ7_OPTS_EN: LocalisedOption[] = [
  { label: "1 (No problem)", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7 (Severe)", value: 7 },
];

const VHI30_OPTS_EN: LocalisedOption[] = [
  { label: "Never", value: 0 },
  { label: "Almost never", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Almost always", value: 3 },
  { label: "Always", value: 4 },
];

const mkItems = (texts: string[], opts: LocalisedOption[]): LocalisedItem[] =>
  texts.map((text) => ({ text, options: opts }));

const EN: Record<string, LocalisedQuestionnaire> = {
  "eat-10": {
    name: "Eating Assessment Tool (EAT-10)",
    description: "10-item Eating Assessment Tool. Rapid screening for oropharyngeal dysphagia risk.",
    items: mkItems(
      [
        "1. Difficulty swallowing solids",
        "2. Difficulty swallowing liquids",
        "3. Coughing or choking when eating",
        "4. Noisy or stridorous breathing",
        "5. Difficulty breathing during meals",
        "6. Build-up of secretions in the throat",
        "7. Feeling that food gets stuck",
        "8. Painful swallowing",
        "9. Unexplained weight loss",
        "10. Avoiding certain foods because of swallowing difficulty",
      ],
      EAT10_OPTS_EN,
    ),
  },

  "snot-22": {
    name: "Sino-Nasal Outcome Test (SNOT-22)",
    description: "22-item Sino-Nasal Outcome Test. Assesses quality of life related to chronic rhinosinusitis and its treatments.",
    items: mkItems(
      [
        "1. Need to blow nose",
        "2. Sneezing",
        "3. Runny nose",
        "4. Cough",
        "5. Post-nasal discharge",
        "6. Thick nasal discharge",
        "7. Ear fullness",
        "8. Dizziness",
        "9. Ear pain",
        "10. Facial pain/pressure",
        "11. Difficulty falling asleep",
        "12. Waking up at night",
        "13. Lack of a good night's sleep",
        "14. Waking up tired",
        "15. Fatigue",
        "16. Reduced productivity",
        "17. Reduced concentration",
        "18. Frustrated/restless/irritable",
        "19. Sad",
        "20. Embarrassed",
        "21. Sense of taste/smell",
        "22. Blockage/congestion of nose",
      ],
      SNOT22_OPTS_EN,
    ),
  },

  "thi-25": {
    name: "Tinnitus Handicap Inventory (THI-25)",
    description: "25-item Tinnitus Handicap Inventory. Assesses the emotional, functional and catastrophic impact of tinnitus.",
    items: mkItems(
      [
        "Is your tinnitus uncomfortable?",
        "Is your tinnitus uncomfortable when trying to concentrate?",
        "Is your tinnitus uncomfortable when trying to think?",
        "Does your tinnitus make you irritable?",
        "Is your tinnitus uncomfortable when trying to read?",
        "Does your tinnitus make you feel nervous?",
        "Is your tinnitus uncomfortable when trying to rest?",
        "Is your tinnitus uncomfortable when trying to sleep?",
        "Is your tinnitus uncomfortable in social situations?",
        "Does your tinnitus cause frustration?",
        "Is your tinnitus uncomfortable at work?",
        "Is your tinnitus uncomfortable when you are alone?",
        "Does your tinnitus cause you to despair?",
        "Is your tinnitus uncomfortable when surrounded by noise?",
        "Is your tinnitus uncomfortable in quiet places?",
        "Does your tinnitus make you feel that you cannot escape it?",
        "Does your tinnitus cause depression?",
        "Is your tinnitus uncomfortable when you are stressed?",
        "Is your tinnitus uncomfortable when you are tired?",
        "Does your tinnitus make you feel you have a serious illness?",
        "Does your tinnitus cause anxiety?",
        "Is your tinnitus uncomfortable when you are on holiday?",
        "Is your tinnitus uncomfortable when you are with friends?",
        "Does your tinnitus make you feel you cannot control your life?",
        "Does your tinnitus make you feel you are losing your mind?",
      ],
      YES_MAYBE_NO_EN,
    ),
  },

  "dhi-25": {
    name: "Dizziness Handicap Inventory (DHI-25)",
    description: "25-item Dizziness Handicap Inventory. Assesses the physical, functional and emotional impact of chronic dizziness.",
    items: mkItems(
      [
        "Does dizziness make you feel frustrated?",
        "Does dizziness make you focus harder to read?",
        "Does dizziness make you feel depressed?",
        "Does dizziness make it hard to remember things?",
        "Does dizziness bother you when walking in the dark?",
        "Does dizziness interfere with your social and family activities?",
        "Does dizziness make it hard to concentrate?",
        "Does dizziness make you afraid to leave home alone?",
        "Does dizziness make it hard to walk down the street?",
        "Does dizziness make you feel embarrassed in public?",
        "Does dizziness make it hard to climb stairs?",
        "Does dizziness make you avoid extreme head positions?",
        "Does dizziness make it hard to bend over?",
        "Does dizziness make it hard to turn your head quickly?",
        "Does dizziness make it hard to walk on uneven surfaces?",
        "Does dizziness make you feel anxious or nervous?",
        "Does dizziness make it hard to work?",
        "Does dizziness cause stress in your relationships?",
        "Does dizziness make you avoid quick movements?",
        "Does dizziness make it hard to travel by bus or car?",
        "Does dizziness make it hard to sleep?",
        "Does dizziness make you feel tired?",
        "Does dizziness make you feel unsafe?",
        "Does dizziness make you avoid physical activities?",
        "Does dizziness make it hard to take care of yourself?",
      ],
      YES_MAYBE_NO_EN,
    ),
  },

  "etdq-7": {
    name: "Eustachian Tube Dysfunction Questionnaire (ETDQ-7)",
    description: "7-item Eustachian Tube Dysfunction Questionnaire. Assesses symptoms of eustachian tube dysfunction.",
    items: mkItems(
      [
        "1. Pressure in the ears",
        "2. Pain in the ears",
        "3. Feeling of blocked ears",
        "4. Popping or clicking in the ears",
        "5. Feeling of ear fullness",
        "6. Dizziness related to pressure changes",
        "7. Trouble equalising pressure when flying or diving",
      ],
      ETDQ7_OPTS_EN,
    ),
  },

  "vhi-30": {
    name: "Voice Handicap Index (VHI-30)",
    description: "30-item Voice Handicap Index. Assesses the functional, physical and emotional impact of dysphonia.",
    items: mkItems(
      [
        "1. My voice makes it hard for people to hear me.",
        "2. People have difficulty understanding me in a noisy room.",
        "3. My family has difficulty hearing me when I call them.",
        "4. I use the phone less often than I would like.",
        "5. I tend to avoid groups of people because of my voice.",
        "6. I speak with friends, neighbours or relatives less because of my voice.",
        "7. People ask me to repeat myself when speaking face to face.",
        "8. My voice difficulties restrict my personal and social life.",
        "9. I feel left out of conversations because of my voice.",
        "10. My voice problem causes me to lose income.",
        "11. I run out of air when I talk.",
        "12. The sound of my voice varies throughout the day.",
        "13. People ask, 'What is wrong with your voice?'",
        "14. My voice sounds strained or dry.",
        "15. I feel as though I have to strain to produce voice.",
        "16. The clarity of my voice is unpredictable.",
        "17. I try to change my voice to sound different.",
        "18. I use a great deal of effort to speak.",
        "19. My voice is worse in the evening.",
        "20. My voice 'gives out' on me in the middle of speaking.",
        "21. I am tense when talking with others because of my voice.",
        "22. People seem irritated with my voice.",
        "23. I think other people don't understand my voice problem.",
        "24. My voice problem upsets me.",
        "25. I am less outgoing because of my voice problem.",
        "26. My voice makes me feel handicapped.",
        "27. I feel annoyed when people ask me to repeat myself.",
        "28. I feel embarrassed when people ask me to repeat myself.",
        "29. My voice makes me feel incompetent.",
        "30. I am ashamed of my voice problem.",
      ],
      VHI30_OPTS_EN,
    ),
  },
};

// Interpretation category / description translations, keyed by slug + Spanish category.
const INTERP_EN: Record<string, Record<string, { category: string; description: string }>> = {
  "eat-10": {
    Normal: { category: "Normal", description: "No dysphagia risk. No further evaluation required." },
    Riesgo: { category: "At risk", description: "Dysphagia risk. Specialist evaluation recommended." },
  },
  "snot-22": {
    "Muy leve": { category: "Very mild", description: "Minimal impact on quality of life." },
    Leve: { category: "Mild", description: "Mild impact. Medical management is usually sufficient." },
    Moderado: { category: "Moderate", description: "Moderate impact. Consider combined treatment." },
    Severo: { category: "Severe", description: "Severe impact. Consider surgical intervention." },
  },
  "thi-25": {
    Leve: { category: "Slight", description: "Slight tinnitus handicap. Conservative management appropriate." },
    "Leve-moderado": { category: "Mild", description: "Mild handicap. Auditory retraining therapy recommended." },
    Moderado: { category: "Moderate", description: "Moderate handicap. Multimodal treatment recommended." },
    "Moderado-severo": { category: "Severe", description: "Moderate-to-severe handicap. Intensive specialist intervention." },
    Severo: { category: "Catastrophic", description: "Catastrophic tinnitus handicap. Urgent multidisciplinary care." },
  },
  "dhi-25": {
    Leve: { category: "Mild", description: "Mild dizziness handicap. Outpatient vestibular rehabilitation." },
    Moderado: { category: "Moderate", description: "Moderate handicap. Structured vestibular rehabilitation recommended." },
    Severo: { category: "Severe", description: "Severe handicap. Multidisciplinary assessment and intensive treatment." },
  },
  "etdq-7": {
    Leve: { category: "Mild", description: "Mild tubal dysfunction. Outpatient follow-up." },
    Moderada: { category: "Moderate", description: "Moderate tubal dysfunction. Consider conservative treatment." },
    Severa: { category: "Severe", description: "Severe tubal dysfunction. Consider surgical treatment." },
  },
  "vhi-30": {
    Leve: { category: "Mild", description: "Mild voice disability. Vocal hygiene and follow-up." },
    Moderada: { category: "Moderate", description: "Moderate voice disability. Voice therapy indicated." },
    Severa: { category: "Severe", description: "Severe voice disability. Complete laryngological evaluation." },
  },
};

import { resolveVariant } from "./questionnaire-variants";

export function getLocalisedQuestionnaire(
  slug: string,
  lang: Lang,
  fallbackName: string,
  fallbackDescription: string | null,
  fallbackItems: LocalisedItem[],
  variantId?: string,
): LocalisedQuestionnaire {
  if (lang === "en" && EN[slug]) return EN[slug];
  // Spanish: pick the requested variant when it has bundled items; otherwise
  // fall back to the generic Spanish text stored in the DB structure.
  const variant = resolveVariant(slug, variantId);
  const items = variant.items && variant.items.length > 0 ? variant.items : fallbackItems;
  return {
    name: fallbackName,
    description: fallbackDescription ?? "",
    items,
  };
}


export function translateInterpretation(
  slug: string,
  lang: Lang,
  category: string | null,
  description: string | null,
): { category: string | null; description: string | null } {
  if (lang !== "en" || !category) return { category, description };
  const map = INTERP_EN[slug];
  const hit = map?.[category];
  if (!hit) return { category, description };
  return { category: hit.category, description: hit.description };
}
