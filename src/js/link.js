// 回線設計(リンクバジェット)。dB で足し引きする。計算は rfcalc.js の linkBudget
// (EIRP = Pt − Lt + Gt、Pr = EIRP − FSPL − その他の損失 + Gr − Lr、N = −174 dBm/Hz + 10·log10(B) + NF、
// マージン = S/N − 必要な S/N、自由空間でマージン 0 dB になる距離 = d·10^(マージン/20))
import { num, si, reader } from './eng.js';
import { linkBudget } from './rfcalc.js';
const form = document.getElementById('lk-form');
const out = k => document.querySelector(`[data-out="${k}"]`);
const val = reader(form);
// 負の数はハイフンでなくマイナス記号「−」で(−0 は 0 に)
const minus = s => s.replace(/^-/, '−');
const fmt = (x, d = 4) => minus(num(x === 0 ? 0 : x, d));

function update() {
  const r = linkBudget({
    fHz: val('f', 1e-9) * 1e6, d: val('d', 1e-9) * 1000, bwHz: val('bw', 1e-12) * 1e6,
    pt: val('pt'), lt: val('lt'), gt: val('gt'), lo: val('lo'), gr: val('gr'), lr: val('lr'), nf: val('nf'), snr: val('snr'),
  });
  out('eirp').textContent = `${fmt(r.eirp)} dBm`;
  out('fspl').textContent = `${fmt(r.fspl, 5)} dB`;
  out('pr').textContent = `${fmt(r.pr)} dBm`;
  out('noise').textContent = `${fmt(r.noise)} dBm`;
  out('cn').textContent = `${fmt(r.cn)} dB`;
  out('sens').textContent = `${fmt(r.sens)} dBm`;
  out('margin').textContent = `${fmt(r.margin)} dB`;
  out('dmax').textContent = si(r.dmax, 'm', 3);
}
form.addEventListener('input', update);
form.addEventListener('submit', e => e.preventDefault());
update();
