export interface SpeakerNotes {
  opening: string;
  main: string[];
  transition: string;
  judgeTip?: string;
  demoCue?: string;
}

export interface DemoLink {
  label_ar: string;
  label_en: string;
  href: string;
  step: number;
}

export interface SlideDefinition {
  id: string;
  index: number;
  label: string;
  type:
    | "hook"
    | "problem"
    | "big-idea"
    | "journey"
    | "demo-break"
    | "concierge"
    | "design-studio"
    | "vision-measure"
    | "matching"
    | "specification"
    | "tailor-ai"
    | "style-dna"
    | "ecosystem"
    | "oman"
    | "business"
    | "final"
    | "judge-questions";
  notes: SpeakerNotes;
  hidden?: boolean;
}

export interface JudgeQuestion {
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
}
