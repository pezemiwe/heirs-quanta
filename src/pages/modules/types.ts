import type { LucideIcon } from "lucide-react";

export interface ModuleFeature {
  icon: LucideIcon;
  label: string;
}

export interface ModuleDefinition {
  id: string;
  live: boolean;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  features: ModuleFeature[];
  accent: string;
  lightBg: string;
}
