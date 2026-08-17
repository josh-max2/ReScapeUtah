// The skill-tree screen: a constellation, which is the shell the owner picked
// from design/treeconcepts.html. COMMAND is the hub; the four branches radiate
// from it and each sub-line clusters around its branch root.
//
// Positions are COMPUTED from the node data, never hand-placed — the tree will
// keep growing, and a hand-placed layout silently collides the moment a node is
// added. Selection lives here because the hangar re-renders wholesale.

import { SaveData } from '../meta/save';
import { BRANCHES, BranchId, TREE, TreeNode, isGated, nodeCost } from '../meta/tree';

const W = 880;
const H = 660;
const CX = W / 2;
const CY = H / 2;

/** Branch anchor directions, in reading order clockwise from top-left. */
const BRANCH_ANGLE: Record<Exclude<BranchId, 'command'>, number> = {
  garage: -140,
  rulebook: -40,
  pitwall: 140,
  holdings: 40,
};

const BRANCH_R = 218;   // hub -> branch anchor
const HUB_R = 92;       // hub -> COMMAND nodes
const LINE_R = 112;     // branch anchor -> its sub-line clusters

let selected: string | null = null;

export function setSelectedNode(id: string | null): void { selected = id; }
export function selectedNode(): string | null { return selected; }

interface Placed { node: TreeNode; x: number; y: number; }

const rad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Lay the whole tree out. Each branch fans its sub-lines across a sector
 * centred on the branch angle, then rings that line's nodes around its own
 * midpoint — so adding a node widens a cluster instead of overlapping one.
 */
function layout(): Placed[] {
  const out: Placed[] = [];

  const command = TREE.filter((t) => t.branch === 'command');
  command.forEach((node, i) => {
    const a = rad(-90 + (360 / command.length) * i);
    out.push({ node, x: CX + Math.cos(a) * HUB_R, y: CY + Math.sin(a) * HUB_R });
  });

  for (const b of BRANCHES) {
    if (b.id === 'command') continue;
    const base = BRANCH_ANGLE[b.id as Exclude<BranchId, 'command'>];
    const ax = CX + Math.cos(rad(base)) * BRANCH_R;
    const ay = CY + Math.sin(rad(base)) * BRANCH_R;

    const nodes = TREE.filter((t) => t.branch === b.id);
    const root = nodes.filter((t) => t.line === 'Root');
    const lines = [...new Set(nodes.filter((t) => t.line !== 'Root').map((t) => t.line))];

    for (const node of root) out.push({ node, x: ax, y: ay });

    // Fan the sub-lines across a sector pointing away from the hub.
    const spread = 116;
    lines.forEach((line, li) => {
      const t = lines.length === 1 ? 0.5 : li / (lines.length - 1);
      const la = rad(base - spread / 2 + spread * t);
      const lx = ax + Math.cos(la) * LINE_R;
      const ly = ay + Math.sin(la) * LINE_R;
      const members = nodes.filter((nd) => nd.line === line);
      members.forEach((node, mi) => {
        // One node sits on the line centre; more ring it.
        if (members.length === 1) { out.push({ node, x: lx, y: ly }); return; }
        const ra = rad((360 / members.length) * mi - 90);
        const rr = 38 + Math.min(18, members.length * 3);
        out.push({ node, x: lx + Math.cos(ra) * rr, y: ly + Math.sin(ra) * rr });
      });
    });
  }
  return out;
}

function branchOf(id: string): BranchId {
  return TREE.find((t) => t.id === id)?.branch ?? 'command';
}

/** Detail card for whatever is selected — the only place a price is payable. */
function detail(save: SaveData): string {
  const node = TREE.find((t) => t.id === selected);
  if (!node) {
    return `<div class="nodedetail empty">
      <p>Pick a node.</p>
      <p class="dim">Chips come from kills and from time held. You keep them
      when you fail — that is the whole point.</p>
      <p class="dim">★ Tokens are different: only CLEARING a track pays them.
      One for the clear, one more for clearing it without losing a single point
      of fort health. They buy the capstones, which chips cannot.</p>
    </div>`;
  }
  const lvl = save.tree[node.id] ?? 0;
  const maxed = lvl >= node.ranks;
  const gated = isGated(node, save.bestTime ?? 0);
  const cost = nodeCost(node, lvl);
  const tokenNode = !!node.costTokens;
  const purse = tokenNode ? save.tokens : save.cores;
  const afford = !maxed && !gated && purse >= cost;
  const gateM = node.gate ? Math.floor(node.gate / 60) : 0;
  const gateS = node.gate ? node.gate % 60 : 0;
  let action: string;
  if (maxed) action = '<button disabled>MAXED</button>';
  else if (gated) {
    action = `<button disabled>HOLD ${gateM}:${gateS < 10 ? '0' : ''}${gateS}</button>`;
  } else {
    action = `<button class="${tokenNode ? 'tokenbuy' : ''}" data-upgrade="${node.id}" `
      + `${afford ? '' : 'disabled'}>${cost} ${tokenNode ? '★' : '◆'}</button>`;
  }
  return `<div class="nodedetail ${branchOf(node.id)}">
    <div class="ndline">${node.line.toUpperCase()}</div>
    <h3>${node.name}</h3>
    <p class="nddesc">${node.desc}${node.ranks > 1 ? ' <span class="dim">per rank</span>' : ''}</p>
    <div class="ndrank">RANK <b>${lvl}</b> / ${node.ranks}</div>
    ${action}
  </div>`;
}

export function renderTree(save: SaveData): string {
  const placed = layout();
  const best = save.bestTime ?? 0;

  let links = '';
  for (const b of BRANCHES) {
    if (b.id === 'command') continue;
    const base = BRANCH_ANGLE[b.id as Exclude<BranchId, 'command'>];
    const ax = CX + Math.cos(rad(base)) * BRANCH_R;
    const ay = CY + Math.sin(rad(base)) * BRANCH_R;
    links += `<line class="spoke" x1="${CX}" y1="${CY}" x2="${ax}" y2="${ay}"/>`;
    for (const p of placed) {
      if (p.node.branch !== b.id || p.node.line === 'Root') continue;
      links += `<line class="twig" x1="${ax}" y1="${ay}" x2="${p.x}" y2="${p.y}"/>`;
    }
  }
  for (const p of placed) {
    if (p.node.branch !== 'command') continue;
    links += `<line class="twig" x1="${CX}" y1="${CY}" x2="${p.x}" y2="${p.y}"/>`;
  }

  let dots = '';
  for (const p of placed) {
    const lvl = save.tree[p.node.id] ?? 0;
    const maxed = lvl >= p.node.ranks;
    const gated = isGated(p.node, best);
    const cls = [
      'node', p.node.branch,
      lvl > 0 ? 'owned' : '', maxed ? 'maxed' : '',
      gated ? 'gated' : '', selected === p.node.id ? 'sel' : '',
      p.node.costTokens ? 'capstone token' : '',
    ].filter(Boolean).join(' ');
    const r = p.node.line === 'Root' ? 17 : p.node.costTokens ? 16 : 13;
    dots += `<g class="${cls}" data-node="${p.node.id}">
      <circle cx="${p.x}" cy="${p.y}" r="${r}"/>
      ${lvl > 0 ? `<text x="${p.x}" y="${p.y + 4}">${lvl}</text>` : ''}
    </g>`;
  }

  let labels = `<text class="hublabel" x="${CX}" y="${CY + 5}">COMMAND</text>`;
  for (const b of BRANCHES) {
    if (b.id === 'command') continue;
    const base = BRANCH_ANGLE[b.id as Exclude<BranchId, 'command'>];
    const lx = CX + Math.cos(rad(base)) * (BRANCH_R - 46);
    const ly = CY + Math.sin(rad(base)) * (BRANCH_R - 46);
    labels += `<text class="brlabel ${b.id}" x="${lx}" y="${ly}">${b.name}</text>`;
  }

  const bm = Math.floor(best / 60), bs = best % 60;
  return `
    <div class="treewrap">
      <div class="treehead">
        <div>
          <h2>UPGRADES</h2>
          <p class="dim">Chips are kept when you fail. Deep nodes open as you hold longer.</p>
        </div>
        <p class="meta-stats">CHIPS <b>${save.cores} ◆</b> · TOKENS <b>${save.tokens} ★</b>
          · BANK <b>${Math.floor(save.gold)} ⬡</b>
          · LONGEST HELD <b>${bm}:${bs < 10 ? '0' : ''}${bs}</b></p>
      </div>
      <div class="treebody">
        <svg class="board" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
          <circle class="hub" cx="${CX}" cy="${CY}" r="34"/>
          ${links}${dots}${labels}
        </svg>
        <div class="treeside">
          ${detail(save)}
          <button class="linkbtn respec" data-respec>RESET TREE — REFUND EVERY CHIP</button>
        </div>
      </div>
    </div>`;
}
