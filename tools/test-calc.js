// 計算ツールの計算部分(src/js/rfcalc.js)を、教科書・規格の値と照らすテスト。npm test で実行する。
// 期待値は式を手で計算した値か、広く知られた値(出典を添える)。ページの JS も同じ関数を使う。
import * as R from '../src/js/rfcalc.js';

let fail = 0, n = 0;
const near = (name, got, want, tol) => {
  n++;
  const ok = Math.abs(got - want) <= tol;
  if (!ok) { fail++; console.error(`NG ${name}: ${got} (期待 ${want} ± ${tol})`); }
};

// dBm・電力: 0 dBm = 1 mW、30 dBm = 1 W、0 dBm を 50 Ω にかけると 223.6 mV rms ≈ 107 dBµV(よく使う換算: dBµV = dBm + 107)
near('0 dBm → W', R.dbmToW(0), 1e-3, 1e-15);
near('30 dBm → W', R.dbmToW(30), 1, 1e-12);
near('1 mW → dBm', R.mwToDbm(1), 0, 1e-12);
near('2 mW → dBm', R.mwToDbm(2), 3.0103, 1e-4);
near('0 dBm 50 Ω Vrms', R.power(0, 50).vrms, 0.22361, 1e-5);
near('0 dBm 50 Ω dBµV', R.power(0, 50).dbuv, 106.99, 0.005);
near('0 dBm 50 Ω Vpp', R.power(0, 50).vpp, 0.63246, 1e-5);
near('3 dB 電力比', R.ratios(3).power, 1.9953, 1e-4);
near('6 dB 電圧比', R.ratios(6).voltage, 1.9953, 1e-4);

// 反射: 100 Ω を 50 Ω 系につなぐと Γ = 1/3、VSWR = 2(Pozar 2.3 節の式)
near('Γ(100 Ω)', R.gammaFromZ(100, 0, 50).mag, 1 / 3, 1e-12);
near('VSWR(Γ=1/3)', R.vswrFromGamma(1 / 3), 2, 1e-12);
// ZL = 50 + j50: Γ = j50/(100 + j50) = 0.2 + j0.4、|Γ| = 0.4472、∠63.43°
const z = R.gammaFromZ(50, 50, 50);
near('Γ re(50+j50)', z.re, 0.2, 1e-12);
near('Γ im(50+j50)', z.im, 0.4, 1e-12);
near('Γ ∠(50+j50)', z.angDeg, 63.435, 1e-3);
// ZL = 25 − j25: Γ = (−25 − j25)/(75 − j25) = −0.2 − j0.4
near('Γ re(25−j25)', R.gammaFromZ(25, -25, 50).re, -0.2, 1e-12);
near('Γ im(25−j25)', R.gammaFromZ(25, -25, 50).im, -0.4, 1e-12);
// VSWR 1.5 → |Γ| = 0.2、RL = 13.98 dB、ミスマッチ損失 0.177 dB
near('Γ(VSWR 1.5)', R.gammaFromVswr(1.5), 0.2, 1e-12);
near('RL(Γ 0.2)', R.rlFromGamma(0.2), 13.979, 1e-3);
near('ML(Γ 0.2)', R.mismatchLoss(0.2), 0.1773, 1e-4);
near('Γ(RL 20 dB)', R.gammaFromRl(20), 0.1, 1e-12);
near('RL(Γ 0.5)', R.rlFromGamma(0.5), 6.0206, 1e-4);

// 自由空間伝搬損失: 1 km・1 GHz で 92.45 dB(20log d[km] + 20log f[GHz] + 92.45)、2.4 GHz・100 m で 80.05 dB
near('FSPL 1 GHz 1 km', R.fspl(1e9, 1000), 92.45, 0.01);
near('FSPL 2.4 GHz 100 m', R.fspl(2.4e9, 100), 80.05, 0.01);
near('FSPL 100 MHz 10 km', R.fspl(100e6, 10e3), 92.45, 0.01);
// 距離が2倍で +6.02 dB、周波数が10倍で +20 dB
near('FSPL 距離2倍', R.fspl(1e9, 2000) - R.fspl(1e9, 1000), 6.0206, 1e-4);
near('波長 300 MHz', R.wavelength(300e6), 0.99931, 1e-5);
// 第1フレネルゾーン(中間点): λ = 0.125 m、d = 1 km で √(0.125·1000/4) = 5.59 m
near('フレネル 2.4 GHz 1 km', R.fresnelMid(2.4e9, 1000), 5.5891, 1e-3);

// 雑音: kTB は 1 Hz で −174 dBm、1 MHz で −114 dBm
near('kTB 1 MHz', R.noiseFloor(1e6, 0), -114, 1e-9);
near('雑音床 20 MHz NF 6', R.noiseFloor(20e6, 6), -94.99, 0.01);
// フリス: 1段目 G 20 dB・NF 3 dB、2段目 NF 10 dB → F = 1.995 + 9/100 = 2.085、NF 3.19 dB、Te = 314.7 K
const c2 = R.cascade([{ g: 20, nf: 3, iip3: 1e9 }, { g: 10, nf: 10, iip3: 1e9 }]);
near('カスケード NF', c2.nf, 3.192, 1e-3);
near('カスケード Te', c2.te, 314.6, 0.2);
near('カスケード 利得', c2.gain, 30, 1e-9);
// 1段だけ: NF 3 dB → Te = 290(1.995 − 1) = 288.6 K
near('Te(NF 3 dB)', R.cascade([{ g: 0, nf: 3, iip3: 1e9 }]).te, 288.63, 0.01);
// IIP3: 10 dBm・G 10 dB の後に IIP3 20 dBm → 1/IIP3 = 1/10 + 10/100 mW⁻¹ → 5 mW = 6.99 dBm、OIP3 = 6.99 + 10 + 0
const c3 = R.cascade([{ g: 10, nf: 0, iip3: 10 }, { g: 0, nf: 0, iip3: 20 }]);
near('カスケード IIP3', c3.iip3, 6.9897, 1e-4);
near('カスケード OIP3', c3.oip3, 16.9897, 1e-4);

// 回線設計: マージン 0 dB の距離。マージンが 6.02 dB なら距離は2倍まで
const lb = R.linkBudget({ fHz: 2.4e9, d: 100, pt: 20, gt: 2, gr: 2, bwHz: 20e6, nf: 6, snr: 10 });
near('回線 EIRP', lb.eirp, 22, 1e-9);
near('回線 Pr', lb.pr, 20 + 2 + 2 - 80.05, 0.01);
near('回線 マージン', lb.margin, 20 + 2 + 2 - 80.05 + 94.99 - 10, 0.02);
near('回線 dmax と再計算のマージン', R.linkBudget({ fHz: 2.4e9, d: lb.dmax, pt: 20, gt: 2, gr: 2, bwHz: 20e6, nf: 6, snr: 10 }).margin, 0, 1e-9);

// L型整合: Rs = 50、RL = 10 → Q = 2、直列 +j20 Ω・並列 −j25 Ω(低域通過形)、もう一方は −j20・+j25
const m1 = R.lmatch(50, 10, 0);
near('L型 Q(50→10)', m1.q, 2, 1e-12);
near('L型 解1 直列', m1.sols[0].xs, 20, 1e-9);
near('L型 解1 並列', m1.sols[0].xp, -25, 1e-9);
near('L型 解2 直列', m1.sols[1].xs, -20, 1e-9);
near('L型 解2 並列', m1.sols[1].xp, 25, 1e-9);
// Bowick『RF Circuit Design』の形: Rs = 100、RL = 1000 → Q = 3、直列 Xs = Q·Rs = 300 Ω、並列 Xp = RL/Q = 333.3 Ω
const m2 = R.lmatch(100, 1000, 0);
near('L型 Q(100→1000)', m2.q, 3, 1e-12);
near('L型 直列(100→1000)', m2.sols[0].xs, 300, 1e-9);
near('L型 並列(100→1000)', Math.abs(m2.sols[0].xp), 1000 / 3, 1e-9);
// 整合の確かめ: 解で組んだ回路の入力インピーダンスが Rs になる(複素負荷 20 + j30 → 50)
const zin = (rs, rl, xl, side, { xs, xp }) => {
  const par = (r, x, xp) => { if (!Number.isFinite(xp)) return [r, x]; const yr = r / (r * r + x * x), yi = -x / (r * r + x * x) - 1 / xp; const d = yr * yr + yi * yi; return [yr / d, -yi / d]; };
  if (side === 'source') { const [r, x] = [rl, xl + xs]; return par(r, x, xp); }
  const [r, x] = par(rl, xl, xp); return [r, x + xs];
};
for (const [rs, rl, xl] of [[50, 20, 30], [50, 200, -80], [75, 30, -10]]) {
  const m = R.lmatch(rs, rl, xl);
  m.sols.forEach((s, i) => { const [r, x] = zin(rs, rl, xl, m.side, s); near(`L型 整合 ${rl}${xl >= 0 ? '+' : ''}${xl}j→${rs} 解${i + 1} R`, r, rs, 1e-9); near(`… X`, x, 0, 1e-9); });
}
near('素子 +j20 Ω @ 1 GHz', R.element(20, 1e9).value, 3.1831e-9, 1e-13);
near('素子 −j25 Ω @ 1 GHz', R.element(-25, 1e9).value, 6.3662e-12, 1e-16);

if (fail) { console.error(`計算ツールのテスト: ${fail}/${n} 件が合わない`); process.exit(1); }
console.log(`OK: 計算ツールのテスト ${n} 件`);
