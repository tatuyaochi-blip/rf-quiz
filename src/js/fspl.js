// 自由空間の電波伝搬。自由空間伝搬損失 FSPL = 20·log10(4πd/λ) = 20·log10(d[km]) + 20·log10(f[MHz]) + 32.45 dB、
// 受信電力 Pr = Pt + Gt + Gr − FSPL − その他の損失(フリスの伝達公式)、リンクマージン = Pr − 受信感度
import { num, si } from './eng.js';
const form = document.getElementById('fs-form');
const out = k => document.querySelector(`[data-out="${k}"]`);
const val = k => Number(form.elements[k].value);
const c = 299792458;

function update() {
  const fhz = val('f') * 1e6, d = val('d') * 1000;
  const lam = c / fhz;
  const fspl = 20 * Math.log10(4 * Math.PI * d / lam);
  const pr = val('pt') + val('gt') + val('gr') - fspl - val('loss');
  out('lambda').textContent = si(lam, 'm', 4);
  out('fspl').textContent = `${num(fspl, 4)} dB`;
  out('pr').textContent = `${num(pr, 4)} dBm`;
  out('margin').textContent = `${num(pr - val('sens'), 4)} dB`;
  out('fresnel').textContent = si(Math.sqrt(lam * d / 4), 'm', 3);
}
form.addEventListener('input', update);
form.addEventListener('submit', e => e.preventDefault());
update();
