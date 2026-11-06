// 自由空間の電波伝搬。計算は rfcalc.js(FSPL = 20·log10(4πd/λ)、受信電力 Pr = Pt + Gt + Gr − FSPL − その他の損失、
// リンクマージン = Pr − 受信感度、中間点の第1フレネルゾーン半径)
import { num, si, reader } from './eng.js';
import { wavelength, fspl, fresnelMid } from './rfcalc.js';
const form = document.getElementById('fs-form');
const out = k => document.querySelector(`[data-out="${k}"]`);
const val = reader(form);

function update() {
  const fhz = val('f', 1e-9) * 1e6, d = val('d', 1e-9) * 1000;
  const loss = fspl(fhz, d);
  const pr = val('pt') + val('gt') + val('gr') - loss - val('loss');
  out('lambda').textContent = si(wavelength(fhz), 'm', 4);
  out('fspl').textContent = `${num(loss, 5)} dB`;
  out('pr').textContent = `${num(pr, 4)} dBm`;
  out('margin').textContent = `${num(pr - val('sens'), 4)} dB`;
  out('fresnel').textContent = si(fresnelMid(fhz, d), 'm', 3);
}
form.addEventListener('input', update);
form.addEventListener('submit', e => e.preventDefault());
update();
