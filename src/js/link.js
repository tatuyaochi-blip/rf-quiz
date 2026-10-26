// 回線設計(リンクバジェット)。dB で足し引きする。
// EIRP = Pt − Lt + Gt、自由空間伝搬損失 FSPL = 20·log10(4πd/λ) = 20·log10(d[km]) + 20·log10(f[MHz]) + 32.45 dB(fspl.js と同じ)、
// 受信電力(受信機入力) Pr = EIRP − FSPL − その他の損失 + Gr − Lr。
// 雑音電力(受信機入力に換算) N = −174 dBm/Hz + 10·log10(B) + NF(nf.js と同じ、290 K)、S/N = Pr − N、
// マージン = S/N − 必要な S/N、受信感度 = N + 必要な S/N。自由空間ではマージン 0 dB になる距離 = d·10^(マージン/20)
import { num, si, reader } from './eng.js';
const form = document.getElementById('lk-form');
const out = k => document.querySelector(`[data-out="${k}"]`);
const val = reader(form);
const c = 299792458;
// 負の数はハイフンでなくマイナス記号「−」で(−0 は 0 に)
const minus = s => s.replace(/^-/, '−');
const fmt = (x, d = 4) => minus(num(x === 0 ? 0 : x, d));

function update() {
  const fhz = val('f', 1e-9) * 1e6, d = val('d', 1e-9) * 1000, bw = val('bw', 1e-12) * 1e6;
  const lam = c / fhz;
  const fspl = 20 * Math.log10((4 * Math.PI * d) / lam);
  const eirp = val('pt') - val('lt') + val('gt');
  const pr = eirp - fspl - val('lo') + val('gr') - val('lr');
  const noise = -174 + 10 * Math.log10(bw) + val('nf');
  const cn = pr - noise, margin = cn - val('snr');
  out('eirp').textContent = `${fmt(eirp)} dBm`;
  out('fspl').textContent = `${fmt(fspl, 5)} dB`;
  out('pr').textContent = `${fmt(pr)} dBm`;
  out('noise').textContent = `${fmt(noise)} dBm`;
  out('cn').textContent = `${fmt(cn)} dB`;
  out('sens').textContent = `${fmt(noise + val('snr'))} dBm`;
  out('margin').textContent = `${fmt(margin)} dB`;
  out('dmax').textContent = si(d * 10 ** (margin / 20), 'm', 3);
}
form.addEventListener('input', update);
form.addEventListener('submit', e => e.preventDefault());
update();
