// ============================================================
// gaze-kalman.ts
// מיקום: src/app/shared/services/gaze-kalman.ts
// ============================================================

export class GazeKalmanFilter {

  private initialized = false;

  // state: [x, y, vx, vy]
  private x = [0, 0, 0, 0];
  // covariance (4x4 כ-array שטוח row-major)
  private P = [
    100,0,0,0,
    0,100,0,0,
    0,0,100,0,
    0,0,0,100
  ];

  constructor(
    private q = 0.02,   // process noise
    private r = 0.4,    // measure noise
  ) {}

  update(mx: number, my: number): { x: number; y: number } {
    if (!this.initialized) {
      this.x = [mx, my, 0, 0];
      this.initialized = true;
      return { x: mx, y: my };
    }

    // ── Predict ──────────────────────────
    // x_pred = F·x  (F: x+=vx, y+=vy)
    const [px, py, pvx, pvy] = this.x;
    const xp = [px + pvx, py + pvy, pvx, pvy];

    // P_pred = F·P·Fᵀ + Q
    const Pp = this.addQ(this.FPFt());

    // ── Update ───────────────────────────
    // innovation = z - H·x_pred  (H robs x,y only)
    const iy = mx - xp[0];
    const ix = my - xp[1];

    // S = H·P_pred·Hᵀ + R  → 2x2 top-left of Pp + R
    const s00 = Pp[0]  + this.r;
    const s01 = Pp[1];
    const s10 = Pp[4];
    const s11 = Pp[5]  + this.r;

    // K = P_pred·Hᵀ·S⁻¹  → 4x2
    const det = s00*s11 - s01*s10 || 1e-10;
    const si00 =  s11/det, si01 = -s01/det;
    const si10 = -s10/det, si11 =  s00/det;

    // P_pred·Hᵀ → 4x2 (columns 0,1 of Pp)
    const ph = [
      Pp[0],  Pp[1],
      Pp[4],  Pp[5],
      Pp[8],  Pp[9],
      Pp[12], Pp[13],
    ];

    // K = ph · S⁻¹
    const K = [
      ph[0]*si00 + ph[1]*si10,  ph[0]*si01 + ph[1]*si11,
      ph[2]*si00 + ph[3]*si10,  ph[2]*si01 + ph[3]*si11,
      ph[4]*si00 + ph[5]*si10,  ph[4]*si01 + ph[5]*si11,
      ph[6]*si00 + ph[7]*si10,  ph[6]*si01 + ph[7]*si11,
    ];

    // x = x_pred + K·innov
    this.x = [
      xp[0] + K[0]*iy + K[1]*ix,
      xp[1] + K[2]*iy + K[3]*ix,
      xp[2] + K[4]*iy + K[5]*ix,
      xp[3] + K[6]*iy + K[7]*ix,
    ];

    // P = (I - K·H)·P_pred
    // K·H is 4x4, only first 2 columns of K matter (H picks x,y)
    const KH = Array(16).fill(0);
    for (let i = 0; i < 4; i++) {
      KH[i*4+0] = K[i*2];    // col 0
      KH[i*4+1] = K[i*2+1];  // col 1
    }
    const IKH = Array(16).fill(0);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        IKH[i*4+j] = (i===j ? 1 : 0) - KH[i*4+j];

    const newP = Array(16).fill(0);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        for (let k = 0; k < 4; k++)
          newP[i*4+j] += IKH[i*4+k] * Pp[k*4+j];
    this.P = newP;

    return { x: this.x[0], y: this.x[1] };
  }

  reset(): void {
    this.x = [0, 0, 0, 0];
    this.P = [100,0,0,0, 0,100,0,0, 0,0,100,0, 0,0,0,100];
    this.initialized = false;
  }

  // ── helpers ──────────────────────────────────────────

  /** F·P·Fᵀ — עם F=[I|I; 0|I] (transition matrix) */
  private FPFt(): number[] {
    const P = this.P;
    // F·P: שורה i של F·P = P[i] + P[i+2] (כי vx,vy מתווספים ל-x,y)
    const FP = [...P];
    // שורות 0,1 (x,y): x_new = x + vx → שורה i של FP = P[i,:] + P[i+2,:]
    for (let j = 0; j < 4; j++) {
      FP[0*4+j] = P[0*4+j] + P[2*4+j];
      FP[1*4+j] = P[1*4+j] + P[3*4+j];
    }
    // (שורות 2,3 נשארות כמו P)

    // FP·Fᵀ: עמודות 0,1 (x,y): col j = col j + col j+2
    const FPFt = [...FP];
    for (let i = 0; i < 4; i++) {
      FPFt[i*4+0] = FP[i*4+0] + FP[i*4+2];
      FPFt[i*4+1] = FP[i*4+1] + FP[i*4+3];
    }
    return FPFt;
  }

  /** מוסיף Q לאלכסון */
  private addQ(M: number[]): number[] {
    const R = [...M];
    R[0]  += this.q; R[5]  += this.q;
    R[10] += this.q; R[15] += this.q;
    return R;
  }
}