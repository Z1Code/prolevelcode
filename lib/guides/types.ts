export type TierLevel = "free" | "basic" | "pro";

export interface OsCommand {
  windows: string;
  mac: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

export interface CopyPrompt {
  label: string;
  prompt: string;
}

export interface GuideStep {
  title: string;
  description: string;
  osCommands?: OsCommand;
  codeBlock?: CodeBlock;
  copyPrompt?: CopyPrompt;
  tip?: string;
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  icon: string;
  estimatedMinutes: number;
  tier: TierLevel;
  phase: number;
  steps: GuideStep[];
}

export interface GuidePhase {
  number: number;
  title: string;
  description: string;
  tier: TierLevel;
  guides: Guide[];
}
