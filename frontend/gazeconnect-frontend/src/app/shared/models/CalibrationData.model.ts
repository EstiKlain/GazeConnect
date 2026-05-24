export interface CalibrationData {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  calibratedAt: number;
}

/** ברירת מחדל — כשאין כיול שמור */
export const DEFAULT_CALIBRATION: CalibrationData = {
  xMin: 0.2,
  xMax: 0.8,
  yMin: 0.1,
  yMax: 0.9,
  calibratedAt: 0,
};