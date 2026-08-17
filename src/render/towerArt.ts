// Tower silhouettes — one distinct body per kind, drawn on the field and
// rendered into the command-bar icons. Card upgrades stack visible layers
// (Isaac rule): thicker barrels, extra rings, studs.

import { PAL, TOWER_DEFS, TowerKind } from '../defs';
import type { TypeMods } from '../sim/cards';
import type { Tower } from '../sim/towers';

const mkTM = (): TypeMods => ({ dmg: 0, rate: 0, splash: 0, hp: 0, fire: false, cryo: false });

export function drawTowerBody(
  ctx: CanvasRenderingContext2D, x: number, y: number, kind: TowerKind,
  angle: number, tm: TypeMods, tower?: Tower,
): void {
  const def = TOWER_DEFS[kind];
  const dmgLvl = Math.min(tm.dmg, 3);
  const ca = Math.cos(angle), sa = Math.sin(angle);

  if (kind === 'wall') {
    ctx.fillStyle = PAL.steelDark;
    ctx.fillRect(x - 10, y - 10, 20, 20);
    ctx.strokeStyle = PAL.steelHi;
    ctx.lineWidth = 2 + Math.min(tm.hp, 2);
    ctx.strokeRect(x - 8.5, y - 8.5, 17, 17);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 8, y - 8, 16, 16);
    ctx.clip();
    ctx.strokeStyle = '#c9a13b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 6);
    ctx.lineTo(x + 6, y - 14);
    ctx.moveTo(x - 6, y + 14);
    ctx.lineTo(x + 14, y - 6);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (kind === 'diverter') {
    // Flush with the road, like the mine — but directional, so the player can
    // read which way it pushes without selecting it. Three chevrons along the
    // facing, widest at the mouth.
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b3a44';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const ox = -5 + i * 5;
      const h = 3 + i * 1.1;
      ctx.globalAlpha = 0.45 + i * 0.22;
      ctx.beginPath();
      ctx.moveTo(ox - 2, -h);
      ctx.lineTo(ox + 2.5, 0);
      ctx.lineTo(ox - 2, h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  if (kind === 'mine') {
    // flat plate flush with the road + charge pips
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.arc(x, y, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3423';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    const charges = tower ? tower.charges : (def.charges ?? 6);
    for (let i = 0; i < (def.charges ?? 6); i++) {
      const a = (i / (def.charges ?? 6)) * Math.PI * 2 - Math.PI / 2;
      ctx.fillStyle = i < charges ? def.color : '#4a4436';
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  // shadow + common base plate
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 1.5, y + 3.5, 11, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const hexBase = (r: number): void => {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
      const hx = x + Math.cos(a) * r;
      const hy = y + Math.sin(a) * r;
      if (k === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  };

  switch (kind) {
    case 'autocannon': {
      ctx.fillStyle = PAL.steelDark;
      ctx.beginPath();
      ctx.roundRect(x - 9, y - 9, 18, 18, 4);
      ctx.fill();
      ctx.strokeStyle = PAL.steelHi;
      ctx.lineWidth = 2.6 + dmgLvl * 0.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ca * 13, y + sa * 13);
      if (tm.rate > 0) {
        const ox = -sa * 2.4, oy = ca * 2.4;
        ctx.moveTo(x + ox, y + oy);
        ctx.lineTo(x + ox + ca * 11, y + oy + sa * 11);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = PAL.steel;
      ctx.fill();
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      break;
    }
    case 'flame': {
      ctx.fillStyle = PAL.steelDark;
      ctx.beginPath();
      ctx.roundRect(x - 9, y - 9, 18, 18, 4);
      ctx.fill();
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(x - ca * 6, y - sa * 6, 3.4, 0, Math.PI * 2); // fuel tank
      ctx.fill();
      ctx.strokeStyle = PAL.steelHi;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ca * 9, y + sa * 9);
      ctx.stroke();
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + ca * 10, y + sa * 10, 3, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'mortar': {
      ctx.fillStyle = '#2c323e';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PAL.steelHi;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#161a22';
      ctx.beginPath();
      ctx.arc(x + ca * 2.5, y + sa * 2.5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1.6 + dmgLvl * 0.7;
      ctx.beginPath();
      ctx.arc(x + ca * 2.5, y + sa * 2.5, 5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'cryo': {
      ctx.fillStyle = PAL.steelDark;
      ctx.beginPath();
      ctx.roundRect(x - 9, y - 9, 18, 18, 4);
      ctx.fill();
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * 7.5, y + Math.sin(a) * 7.5);
      }
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'tesla': {
      ctx.fillStyle = PAL.steelDark;
      ctx.beginPath();
      ctx.arc(x, y + 2, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1.6;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(x, y - k * 3, 5.5 - k * 1.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y - 8, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'gatling': {
      ctx.fillStyle = PAL.steelDark;
      hexBase(10);
      ctx.fill();
      ctx.strokeStyle = PAL.steelHi;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (const off of [-3, 0, 3]) {
        const ox = -sa * off, oy = ca * off;
        ctx.beginPath();
        ctx.moveTo(x + ox, y + oy);
        ctx.lineTo(x + ox + ca * 12, y + oy + sa * 12);
        ctx.stroke();
      }
      const heat = tower ? tower.heat : 0;
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = heat > 0.05 ? `rgba(232,${150 - heat * 80}, 60, 1)` : PAL.steel;
      ctx.fill();
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      break;
    }
    case 'rocket': {
      ctx.fillStyle = PAL.steelDark;
      ctx.beginPath();
      ctx.roundRect(x - 10, y - 10, 20, 20, 4);
      ctx.fill();
      for (const [ox, oy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]] as const) {
        const rx = x + ca * 3 + ox, ry = y + sa * 3 + oy;
        ctx.fillStyle = '#161a22';
        ctx.beginPath();
        ctx.arc(rx, ry, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      break;
    }
    case 'railgun': {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = PAL.steelDark;
      ctx.beginPath();
      ctx.roundRect(-11, -7, 22, 14, 3);
      ctx.fill();
      ctx.strokeStyle = PAL.steelHi;
      ctx.lineWidth = 2 + dmgLvl * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(20, -3);
      ctx.moveTo(0, 3);
      ctx.lineTo(20, 3);
      ctx.stroke();
      ctx.fillStyle = def.color;
      ctx.fillRect(-7, -4, 5, 8);
      ctx.restore();
      break;
    }
    case 'lattice': {
      ctx.fillStyle = PAL.steelDark;
      hexBase(11);
      ctx.fill();
      ctx.strokeStyle = 'rgba(112,122,140,0.55)';
      ctx.lineWidth = 1.5;
      hexBase(11);
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 4);
      ctx.fillStyle = def.color;
      ctx.fillRect(-5, -5, 10, 10);
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1.4;
      for (let k = 1; k <= dmgLvl; k++) {
        ctx.strokeRect(-5 - k * 2, -5 - k * 2, 10 + k * 4, 10 + k * 4);
      }
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  // Elemental card rings + plating studs (shared add-ons)
  if (tm.fire) {
    ctx.strokeStyle = '#d9642e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (tm.cryo) {
    ctx.strokeStyle = PAL.cyan;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(x, y, tm.fire ? 14 : 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (tm.hp > 0) {
    ctx.fillStyle = '#d7dce6';
    for (const [bx, by] of [[-9, -9], [9, -9], [-9, 9], [9, 9]] as const) {
      ctx.fillRect(x + bx - 1.5, y + by - 1.5, 3, 3);
    }
  }
}

/** Command-bar icon: the tower body rendered on a small canvas. */
export function makeTowerIcon(kind: TowerKind, size = 44): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.translate(size / 2, size / 2);
  ctx.scale(size / 30, size / 30);
  drawTowerBody(ctx, 0, 0, kind, -0.9, mkTM());
  return c;
}
