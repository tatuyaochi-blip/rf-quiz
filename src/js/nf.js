// 3段の雑音指数と利得(フリスの公式)。使わない段は利得0 dB・NF 0 dB・IIP3を大きな値にすると影響しない。
// 計算は rfcalc.js の cascade・noiseFloor(感度の目安 = −174 dBm/Hz + 10·log10(B) + NF + 必要なSNR)
import { num, reader } from './eng.js';
import { cascade, noiseFloor } from './rfcalc.js';
const form = document.getElementById('nf-form');
const out = k => document.querySelector(`[data-out="${k}"]`);
const val = reader(form);

function update() {
  const r = cascade([1, 2, 3].map(i => ({ g: val(`g${i}`), nf: val(`nf${i}`), iip3: val(`ip${i}`) })));
  out('nf').textContent = `${num(r.nf, 4)} dB`;
  out('te').textContent = `${num(r.te, 4)} K`;
  out('gain').textContent = `${num(r.gain, 4)} dB`;
  out('iip3').textContent = `${num(r.iip3, 4)} dBm`;
  out('oip3').textContent = `${num(r.oip3, 4)} dBm`;
  const floor = noiseFloor(val('bw', 1e-12) * 1e6, r.nf);
  out('floor').textContent = `${num(floor, 4)} dBm`;
  out('sens').textContent = `${num(floor + val('snr'), 4)} dBm`;
}
form.addEventListener('input', update);
form.addEventListener('change', update);
form.addEventListener('submit', e => e.preventDefault());
update();
