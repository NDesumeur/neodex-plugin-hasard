// lancé par le test « local » de NeoDex : la vérification interne (part sous la flèche, tirage sans remise, équipes égales), la roue qui tourne
// et retire le gagnant, les dés, la pièce, le nombre, les équipes et la place prise (avec NEO_SHOTS : garde une image de chaque canevas)
module.exports = async ({ pj, sleep }) => {
  const R = code => pj(`(() => { const T = document.getElementById('rdWheel').__rd; ${code} })()`);
  const shot = async (id, n) => { if (!process.env.NEO_SHOTS) return; const d = await pj(`document.getElementById('${id}').toDataURL()`); require('fs').writeFileSync(require('path').join(process.env.NEO_SHOTS, 'hasard-' + n + '.png'), Buffer.from(d.split(',')[1], 'base64')); };
  await pj(`window.__e = []; addEventListener('error', e => __e.push(e.message)); 0`);
  const chk = await R('return T.check();'); if (chk !== 'ok') throw new Error('vérification : ' + chk);
  await pj(`(() => { const l = document.getElementById('rdList'); l.value = 'Alice\\nBilal\\nChloé\\nDavid'; l.dispatchEvent(new Event('input')); const r = document.getElementById('rdRemove'); r.checked = true; r.dispatchEvent(new Event('change')); })(), 0`);
  // un vrai tour de roue (3,8 s), puis le gagnant quitte la roue
  await pj(`document.getElementById('rdSpinBtn').click(), 0`); await sleep(1500); await shot('rdWheel', '1-roue');
  await sleep(3600); const s1 = await R('return T.state();');
  if (s1.spinning || s1.drawn.length !== 1 || s1.active.length !== 3) throw new Error('le gagnant devait quitter la roue : ' + JSON.stringify(s1));
  for (let i = 0; i < 3; i++) { await R('T.spin(true); return 0;'); await sleep(150); }
  const s2 = await R('return T.state();'); if (s2.active.length || new Set(s2.drawn).size !== 4) throw new Error('ordre de passage incomplet : ' + JSON.stringify(s2));
  const ord = await pj(`[...document.querySelectorAll('#rdOrder li')].map(l => l.textContent).join(',')`); await shot('rdResult', '2-resultat');
  await pj(`document.getElementById('rdReset').click(), 0`); if ((await R('return T.state();')).active.length !== 4) throw new Error('TOUT REMETTRE devait remettre les 4');
  // dés (bornes), pièce, nombre, équipes
  await pj(`(() => { const f = document.getElementById('rdFaces'); f.value = '20'; f.dispatchEvent(new Event('change')); const c = document.getElementById('rdCount'); c.value = '3'; c.dispatchEvent(new Event('change')); })(), 0`);
  for (let i = 0; i < 30; i++) { const v = await R('return T.roll(true);'); if (v.length !== 3 || v.some(x => x < 1 || x > 20 || x % 1)) throw new Error('dés hors bornes : ' + v); }
  await pj(`document.getElementById('rdRoll').click(), 0`); await sleep(400); await shot('rdDice', '3-des-roulent'); await sleep(2600); await shot('rdDice', '4-des');
  const dres = await pj(`document.getElementById('rdDiceRes').getAttribute('aria-label')`); if (!/=/.test(dres)) throw new Error('le total des dés manque : ' + dres);
  await pj(`document.getElementById('rdFlip').click(), 0`); await sleep(500); await shot('rdCoin', '5-piece-air'); await sleep(1500); await shot('rdCoin', '6-piece');
  const coin = await pj(`document.getElementById('rdCoinRes').getAttribute('aria-label')`); if (!/^(PILE|FACE)$/.test(coin)) throw new Error('pile ou face manque : ' + coin);
  await pj(`(() => { document.getElementById('rdMin').value = '-5'; document.getElementById('rdMax').value = '5'; })(), 0`);
  for (let i = 0; i < 40; i++) { const v = await R('return T.draw(true);'); if (!(v >= -5 && v <= 5) || v % 1) throw new Error('nombre hors bornes : ' + v); }
  await pj(`(() => { const t = document.getElementById('rdNames'); t.value = 'A\\nB\\nC\\nD\\nE\\nF\\nG'; t.dispatchEvent(new Event('input')); const n = document.getElementById('rdTeamN'); n.value = '3'; n.dispatchEvent(new Event('change')); document.getElementById('rdTeams').click(); })(), 0`);
  const tm = await pj(`[...document.querySelectorAll('.rdTeam')].map(t => t.children.length - 1)`);
  if (tm.length !== 3 || tm.reduce((a, b) => a + b) !== 7 || Math.max(...tm) - Math.min(...tm) > 1) throw new Error('équipes mal formées : ' + tm);
  const errs = await pj(`window.__e.join(' | ')`); if (errs) throw new Error('erreur : ' + errs);
  // la page tient dans la largeur, la roue reste grande et visible
  const L = await pj(`(() => { const r = document.getElementById('rdWheel').getBoundingClientRect(); let s = 0; for (let e = document.getElementById('rdWheel').parentElement; e; e = e.parentElement) s += e.scrollTop; return { bottom: Math.round(r.bottom + s), h: Math.round(r.height), wh: innerHeight, ww: innerWidth, sw: document.documentElement.scrollWidth }; })()`);
  if (process.env.NEO_FIT_LOG) console.log('FIT', JSON.stringify(L));
  if (L.bottom > L.wh + 1 || L.sw > L.ww + 1 || L.h < 280) throw new Error('la roue dépasse la fenêtre ou reste petite : ' + JSON.stringify(L));
  return 'vérification ok · roue : gagnant retiré, ordre ' + ord + ' · dés ' + dres + ' · pièce ' + coin + ' · nombre · équipes ' + tm.join('/') + ' · roue ' + L.h + ' px dans ' + L.ww + '×' + L.wh;
};
