// 3段の雑音指数と利得(フリスの公式)。使わない段は利得0 dB・NF 0 dB・IIP3を大きな値にすると影響しない。F = F1 + (F2 − 1)/G1 + (F3 − 1)/(G1G2) + …(真数で計算)。
// 入力換算の IIP3: 1/IIP3 = 1/IIP3_1 + G1/IIP3_2 + G1G2/IIP3_3 + …(mW の真数)。雑音温度 Te = 290(F − 1)。
// 感度の目安: −174 dBm/Hz + 10·log10(B) + NF + 必要なSNR
import { num } from './eng.js';
const form = document.getElementById('nf-form');
const out = k => document.querySelector(`[data-out="${k}"]`);
const lin = db => 10 ** (db / 10);
const db = x => 10 * Math.log10(x);

function update() {
  const f = form.elements;
  let F = 0, G = 1, inv = 0;
  for (let i = 1; i <= 3; i++) {
    const g = lin(Number(f[`g${i}`].value)), n = lin(Number(f[`nf${i}`].value)), ip = lin(Number(f[`ip${i}`].value));
    F += i === 1 ? n : (n - 1) / G;
    inv += G / ip;
    G *= g;
  }
  const nf = db(F);
  out('nf').textContent = `${num(nf, 4)} dB`;
  out('te').textContent = `${num(290 * (F - 1), 4)} K`;
  out('gain').textContent = `${num(db(G), 4)} dB`;
  out('iip3').textContent = `${num(db(1 / inv), 4)} dBm`;
  out('oip3').textContent = `${num(db(1 / inv) + db(G), 4)} dBm`;
  const bw = Number(f.bw.value) * 1e6, snr = Number(f.snr.value);
  out('floor').textContent = `${num(-174 + db(bw) + nf, 4)} dBm`;
  out('sens').textContent = `${num(-174 + db(bw) + nf + snr, 4)} dBm`;
}
form.addEventListener('input', update);
form.addEventListener('change', update);
form.addEventListener('submit', e => e.preventDefault());
update();
