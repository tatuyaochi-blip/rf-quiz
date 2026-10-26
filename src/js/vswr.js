// 反射の換算。|Γ| ⇔ VSWR = (1 + |Γ|)/(1 − |Γ|) ⇔ リターンロス RL = −20·log10|Γ| ⇔ ミスマッチ損失 ML = −10·log10(1 − |Γ|²)。
// 負荷インピーダンス ZL = R + jX と特性インピーダンス Z0 からも Γ = (ZL − Z0)/(ZL + Z0) を求める。どの欄を書き換えてもほかを計算し直す
import { num } from './eng.js';
const form = document.getElementById('vs-form');
const out = k => document.querySelector(`[data-out="${k}"]`);
const set = (k, v, d = 5) => { if (Number.isFinite(v)) form.elements[k].value = Number(v.toPrecision(d)); };

function fromZ() {
  const r = Number(form.elements.r.value), x = Number(form.elements.x.value), z0 = Number(form.elements.z0.value);
  const nr = r - z0, dr = r + z0; // Γ = (nr + jx)/(dr + jx)
  const den = dr * dr + x * x;
  const gr = (nr * dr + x * x) / den, gi = (x * dr - nr * x) / den;
  return { g: Math.hypot(gr, gi), ang: Math.atan2(gi, gr) * 180 / Math.PI };
}

function update(e) {
  const src = e?.target?.name;
  let g, ang = null;
  if (!src || ['r', 'x', 'z0'].includes(src)) ({ g, ang } = fromZ());
  else if (src === 'gamma') g = Number(form.elements.gamma.value);
  else if (src === 'vswr') { const s = Number(form.elements.vswr.value); g = (s - 1) / (s + 1); }
  else if (src === 'rl') g = 10 ** (-Number(form.elements.rl.value) / 20);
  if (!(g >= 0 && g <= 1)) return;
  if (src !== 'gamma') set('gamma', g);
  if (src !== 'vswr') set('vswr', g < 1 ? (1 + g) / (1 - g) : Infinity);
  if (src !== 'rl') set('rl', g > 0 ? -20 * Math.log10(g) : Infinity);
  out('ml').textContent = g < 1 ? `${num(-10 * Math.log10(1 - g * g), 4)} dB` : '∞';
  out('pr').textContent = `${num(g * g * 100, 4)} %`;
  out('pt').textContent = `${num((1 - g * g) * 100, 4)} %`;
  out('angle').textContent = ang === null ? '–' : `${num(ang, 4)}°`;
}
form.addEventListener('input', update);
form.addEventListener('submit', e => e.preventDefault());
update();
