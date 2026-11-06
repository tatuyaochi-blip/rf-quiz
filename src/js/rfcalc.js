// 高周波の計算ツールの計算部分(画面に依存しない純粋な関数)。各ツールの JS と tools/test-calc.js が同じ関数を使う。
// 単位: 周波数 Hz、距離 m、電力 dBm または W、抵抗・リアクタンス Ω。dB の換算は電力比が 10·log10、電圧比が 20·log10。
export const C0 = 299792458; // 真空中の光速 m/s(定義値)
export const KTB_DBM_HZ = -174; // 290 K の熱雑音電力密度の慣用値(正確には −173.98 dBm/Hz)

export const lin = dB => 10 ** (dB / 10);
export const dB = x => 10 * Math.log10(x);

// ---- dB・dBm ----
export const dbmToW = dbm => 10 ** (dbm / 10) / 1000;
export const mwToDbm = mw => (mw > 0 ? 10 * Math.log10(mw) : NaN);
export function power(dbm, r) {
  const w = dbmToW(dbm), vrms = Math.sqrt(w * r);
  return { w, dbw: dbm - 30, vrms, vpp: vrms * 2 * Math.SQRT2, dbuv: 20 * Math.log10(vrms / 1e-6) };
}
export const ratios = db => ({ power: 10 ** (db / 10), voltage: 10 ** (db / 20) });

// ---- 反射: Γ・VSWR・リターンロス ----
// Γ = (ZL − Z0)/(ZL + Z0)、ZL = R + jX、Z0 は実数
export function gammaFromZ(r, x, z0) {
  const nr = r - z0, dr = r + z0, den = dr * dr + x * x;
  const re = (nr * dr + x * x) / den, im = (x * dr - nr * x) / den;
  return { re, im, mag: Math.hypot(re, im), angDeg: (Math.atan2(im, re) * 180) / Math.PI };
}
export const vswrFromGamma = g => (g < 1 ? (1 + g) / (1 - g) : Infinity);
export const gammaFromVswr = s => (s - 1) / (s + 1);
export const rlFromGamma = g => (g > 0 ? -20 * Math.log10(g) : Infinity);
export const gammaFromRl = rl => 10 ** (-rl / 20);
export const mismatchLoss = g => (g < 1 ? -10 * Math.log10(1 - g * g) : Infinity);

// ---- 自由空間の伝搬 ----
export const wavelength = fHz => C0 / fHz;
// FSPL = 20·log10(4πd/λ)(= 20·log10 d[km] + 20·log10 f[MHz] + 32.45)
export const fspl = (fHz, d) => 20 * Math.log10((4 * Math.PI * d) / wavelength(fHz));
// 送受信点の中間での第1フレネルゾーン半径 √(λ·d1·d2/(d1 + d2))、d1 = d2 = d/2
export const fresnelMid = (fHz, d) => Math.sqrt((wavelength(fHz) * d) / 4);

// ---- 雑音と縦続接続 ----
// 熱雑音 + NF: N = −174 dBm/Hz + 10·log10(B) + NF
export const noiseFloor = (bwHz, nfDb) => KTB_DBM_HZ + 10 * Math.log10(bwHz) + nfDb;
// stages = [{ g: 利得 dB, nf: 雑音指数 dB, iip3: dBm }, …]
// フリスの公式 F = F1 + (F2 − 1)/G1 + …、入力換算 1/IIP3 = 1/IIP3_1 + G1/IIP3_2 + …(真数)
export function cascade(stages) {
  let F = 0, G = 1, inv = 0;
  stages.forEach((s, i) => {
    const n = lin(s.nf);
    F += i === 0 ? n : (n - 1) / G;
    inv += G / lin(s.iip3);
    G *= lin(s.g);
  });
  const iip3 = dB(1 / inv);
  return { F, nf: dB(F), te: 290 * (F - 1), gain: dB(G), iip3, oip3: iip3 + dB(G) };
}

// ---- 回線設計 ----
// EIRP = Pt − Lt + Gt、Pr = EIRP − FSPL − 損失 + Gr − Lr、S/N = Pr − N、マージン = S/N − 必要な S/N
export function linkBudget({ fHz, d, pt, lt = 0, gt = 0, lo = 0, gr = 0, lr = 0, bwHz, nf, snr }) {
  const loss = fspl(fHz, d), eirp = pt - lt + gt;
  const pr = eirp - loss - lo + gr - lr, noise = noiseFloor(bwHz, nf);
  const cn = pr - noise, margin = cn - snr;
  // 自由空間ではマージン 0 dB になる距離(損失は距離の2乗に比例)
  return { eirp, fspl: loss, pr, noise, cn, sens: noise + snr, margin, dmax: d * 10 ** (margin / 20) };
}

// ---- L型整合 ----
// 足し引きで打ち消し合って丸め誤差だけ残った値は 0 とみなす
const diff = (a, b) => (Math.abs(a - b) <= 1e-9 * (Math.abs(a) + Math.abs(b)) ? 0 : a - b);
// 電源抵抗 rs、負荷 rl + j·xl。戻り値の xs は直列素子、xp は並列素子のリアクタンス(Infinity = 並列素子なし)。
// RL ≤ Rs: 直列素子を負荷側、Q = √(Rs/RL − 1)、X1 = ±Q·RL、Xp = −RL·Rs/X1
// RL > Rs: 並列素子を負荷側、YL = GL + jBL、B2 = ±√(GL/Rs − GL²)、Xs = B2·Rs/GL
export function lmatch(rs, rl, xl) {
  if (rl <= rs) {
    const q = Math.sqrt(rs / rl - 1);
    return { q, side: 'source', sols: [1, -1].map(s => { const x1 = s * q * rl; const b = x1 / (rl * rs); return { xs: diff(x1, xl), xp: b === 0 ? Infinity : -1 / b }; }) };
  }
  const den = rl * rl + xl * xl, g = rl / den, bl = -xl / den;
  const q = Math.sqrt(1 / (g * rs) - 1);
  return { q, side: 'load', sols: [1, -1].map(s => { const b2 = s * Math.sqrt(g / rs - g * g); const bp = diff(b2, bl); return { xs: (b2 * rs) / g, xp: bp === 0 ? Infinity : -1 / bp }; }) };
}
// リアクタンスから素子の値: X > 0 なら L = X/ω、X < 0 なら C = 1/(ω|X|)
export const element = (x, fHz) => {
  const w = 2 * Math.PI * fHz;
  return !Number.isFinite(x) || x === 0 ? null : x > 0 ? { kind: 'l', value: x / w } : { kind: 'c', value: 1 / (w * -x) };
};
