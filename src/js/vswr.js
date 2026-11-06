// 反射の換算。|Γ| ⇔ VSWR ⇔ リターンロス ⇔ ミスマッチ損失、負荷 ZL = R + jX と Z0 から Γ = (ZL − Z0)/(ZL + Z0)。
// 計算は rfcalc.js。どの欄を書き換えてもほかを計算し直す
import { num, reader, parseNum, inVal } from './eng.js';
import { gammaFromZ, vswrFromGamma, gammaFromVswr, rlFromGamma, gammaFromRl, mismatchLoss } from './rfcalc.js';
const form = document.getElementById('vs-form');
const out = k => document.querySelector(`[data-out="${k}"]`);
const val = reader(form);
const read = k => parseNum(form.elements[k].value);
const set = (k, v, d = 5) => { if (Number.isFinite(v)) form.elements[k].value = inVal(Number(v.toPrecision(d))); };

function update(e) {
  const src = e?.target?.name;
  let g, ang = null;
  if (!src || ['r', 'x', 'z0'].includes(src)) ({ mag: g, angDeg: ang } = gammaFromZ(val('r'), val('x'), val('z0', 1e-9)));
  else if (src === 'gamma') g = read('gamma');
  else if (src === 'vswr') g = gammaFromVswr(read('vswr'));
  else if (src === 'rl') g = gammaFromRl(read('rl'));
  if (!(g >= 0 && g <= 1)) return;
  if (src !== 'gamma') set('gamma', g);
  if (src !== 'vswr') set('vswr', vswrFromGamma(g));
  if (src !== 'rl') set('rl', rlFromGamma(g));
  out('ml').textContent = g < 1 ? `${num(mismatchLoss(g), 4)} dB` : '∞';
  out('pr').textContent = `${num(g * g * 100, 4)} %`;
  out('pt').textContent = `${num((1 - g * g) * 100, 4)} %`;
  out('angle').textContent = ang === null ? '–' : `${num(ang, 4)}°`;
}
form.addEventListener('input', update);
form.addEventListener('submit', e => e.preventDefault());
update();
