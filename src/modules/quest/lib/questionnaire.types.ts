export interface QuestionOption {
  label: string;
  value: number;
}

export interface QuestionItem {
  text: string;
  options: QuestionOption[];
}

export interface QuestionnaireStructure {
  slug: string;
  items: QuestionItem[];
}

export interface Questionnaire {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  specialty_id: string | null;
  subspecialty_id: string | null;
  scoring_type: string;
  max_score: number | null;
  reference: string | null;
  is_active: boolean;
  structure: QuestionnaireStructure | null;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

export interface Subspecialty {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  specialty_id: string;
}

export interface Interpretation {
  id: string;
  questionnaire_id: string;
  min_score: number;
  max_score: number;
  category: string;
  description: string;
  color: string | null;
}

export interface DiagnosticKeyword {
  id: string;
  keyword: string;
  questionnaire_id: string;
  weight: number;
}
