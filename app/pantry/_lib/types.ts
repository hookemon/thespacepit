export type Source = "moto" | "store";

export type Item = {
  id: string;
  emoji?: string;
  name_es: string;
  name_en: string;
  par: number;
  current: number;
  unit: string;
  source: Source;
};

export type SnapshotAction = "check" | "moto_sent" | "moto_copied";

export type Snapshot = {
  id: string;
  at: string;
  action: SnapshotAction;
  items: Array<{ id: string; current: number; par: number; source: Source }>;
};
