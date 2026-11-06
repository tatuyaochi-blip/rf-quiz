// dB・dBm の換算。計算は rfcalc.js(P[W] = 10^(dBm/10)/1000、負荷抵抗 R での実効電圧 Vrms = √(P·R)、dBµV = 20·log10(Vrms/1 µV)、
// dB から電力比 10^(dB/10) と電圧比 10^(dB/20))。dBm と mW はどちらを書き換えても、もう一方を計算し直す
import { si, num, reader, parseNum, inVal } from './eng.js';
import { mwToDbm, power, ratios } from './rfcalc.js';
const form = document.getElementById('db-form');
const out = k => document.querySelector(`[data-out="${k}"]`);
const val = reader(form);

function update(e) {
  const dEl = form.elements.dbm, mEl = form.elements.mw;
  let dbm;
  if (e?.target === mEl) {
    dbm = mwToDbm(parseNum(mEl.value));
    if (Number.isFinite(dbm)) dEl.value = inVal(Number(dbm.toFixed(3)));
  } else {
    dbm = val('dbm');
    mEl.value = inVal(Number((10 ** (dbm / 10)).toPrecision(4)));
  }
  const p = power(dbm, val('r', 1e-9));
  out('w').textContent = si(p.w, 'W', 4);
  out('dbw').textContent = Number.isFinite(dbm) ? `${num(p.dbw, 5)} dBW` : '–';
  out('vrms').textContent = si(p.vrms, 'V', 4);
  out('vpp').textContent = si(p.vpp, 'V', 4);
  out('dbuv').textContent = Number.isFinite(p.vrms) ? `${num(p.dbuv, 5)} dBµV` : '–';
  const r = ratios(val('db'));
  out('pr').textContent = `${num(r.power, 4)}×`;
  out('vr').textContent = `${num(r.voltage, 4)}×`;
}
form.addEventListener('input', update);
form.addEventListener('submit', e => e.preventDefault());
update();
