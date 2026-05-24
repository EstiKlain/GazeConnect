export interface DwellTarget {
  id: string;
  getRect: () => DOMRect;
  dwellMs: number;
  onDwell: () => void;
}

export interface ActiveDwell {
  target: DwellTarget;
  startedAt: number;
  progress: number; // 0–1
}