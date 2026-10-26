// L型整合回路の設計。電源抵抗 Rs と負荷 ZL = RL + jXL を、直列1個・並列1個のリアクタンスで整合させる2通りの解。
// RL ≤ Rs: 直列素子を負荷側、並列素子を電源側に置く。Q = √(Rs/RL − 1)、負荷と直列素子の合計リアクタンス X1 = ±Q·RL
//   (直列素子 Xs = X1 − XL)、並列素子 Xp = ∓Rs/Q(X1 のサセプタンス成分を打ち消す)
// RL > Rs: 並列素子を負荷側、直列素子を電源側に置く。YL = GL + jBL、Q = √(1/(GL·Rs) − 1)、
//   並列素子のあとの合計サセプタンス B2 = ±√(GL/Rs − GL²)(並列素子 Bp = B2 − BL)、直列素子 Xs = B2·Rs/GL
// 解1は複号の上(実数の負荷なら直列L・並列Cの低域通過形)、解2は下(直列C・並列Lの高域通過形)。
// リアクタンス X から素子: X > 0 なら L = X/ω、X < 0 なら C = 1/(ω|X|)
// 限界: 複素負荷で R ≤ Rs のとき、並列の素子を負荷側に置く配置でも整合できる場合があるが、その解は出さない(表示で知らせる)
import { num, si, reader } from './eng.js';
const form = document.getElementById('lm-form');
const out = k => document.querySelector(`[data-out="${k}"]`);
const val = reader(form);
const T = JSON.parse(form.dataset.text);
// 負の数はハイフンでなくマイナス記号「−」で(−0 は 0 に)
const minus = s => s.replace(/^-/, '−');
const fmt = (x, d = 4) => minus(num(x === 0 ? 0 : x, d));

// 足し引きで打ち消し合って丸め誤差だけ残った値は 0 とみなす(直列はリアクタンス 0、並列はサセプタンス 0 = 素子なし)
const diff = (a, b) => (Math.abs(a - b) <= 1e-9 * (Math.abs(a) + Math.abs(b)) ? 0 : a - b);
function solve(rs, rl, xl) {
  if (rl <= rs) {
    const q = Math.sqrt(rs / rl - 1);
    return { q, side: 'source', sols: [1, -1].map(s => { const x1 = s * q * rl; const b = x1 / (rl * rs); return { xs: diff(x1, xl), xp: b === 0 ? Infinity : -1 / b }; }) };
  }
  const den = rl * rl + xl * xl, g = rl / den, bl = -xl / den;
  const q = Math.sqrt(1 / (g * rs) - 1);
  return { q, side: 'load', sols: [1, -1].map(s => { const b2 = s * Math.sqrt(g / rs - g * g); const bp = diff(b2, bl); return { xs: (b2 * rs) / g, xp: bp === 0 ? Infinity : -1 / bp }; }) };
}

function update() {
  const f = val('f', 1e-9) * 1e6, rs = val('rs', 1e-9), rl = val('rl', 1e-9), xl = val('xl');
  const w = 2 * Math.PI * f;
  const kind = x => (!Number.isFinite(x) || x === 0 ? 'none' : x > 0 ? 'l' : 'c');
  // 「L = 3.18 nH(+j20 Ω)」のように素子の値とリアクタンス
  const show = x => {
    const k = kind(x);
    if (k === 'none') return T.none;
    const value = k === 'l' ? `L = ${si(x / w, 'H', 4)}` : `C = ${si(1 / (w * -x), 'F', 4)}`;
    return `${value}${T.open}${x > 0 ? '+' : '−'}j${num(Math.abs(x), 4)} Ω${T.close}`;
  };
  const { q, side, sols } = solve(rs, rl, xl);
  out('q').textContent = fmt(q, 4);
  // R = Rs なら並列の素子は要らない。R ≤ Rs でも並列の形の抵抗 (R² + X²)/R が Rs より大きければ、
  // 並列の素子を負荷側に置く配置でも整合できる(その解はこのツールでは出さないので、そのことを示す)
  const alt = side === 'source' && q > 0 && (rl * rl + xl * xl) / rl > rs * (1 + 1e-9);
  out('side').textContent = q === 0 ? T.side_none : `${T[`side_${side}`]}${alt ? T.alt : ''}`;
  sols.forEach(({ xs, xp }, i) => {
    out(`s${i + 1}`).textContent = show(xs);
    out(`p${i + 1}`).textContent = show(xp);
    const ks = kind(xs), kp = kind(xp);
    out(`k${i + 1}`).textContent = ks === 'none' && kp === 'none' ? T.direct : ks === 'none' || kp === 'none' ? T.single : ks === 'l' && kp === 'c' ? T.lowpass : ks === 'c' && kp === 'l' ? T.highpass : T.other;
  });
}
form.addEventListener('input', update);
form.addEventListener('submit', e => e.preventDefault());
update();
