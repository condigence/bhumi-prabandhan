/**
 * Shared schema + tree-building + SVG-rendering logic for a Vanshawali
 * (family lineage) tree. Used by the Vanshawali page (/vanshawali) to turn a
 * flat, form-entered list of people into the nested JSON tree the rest of
 * the app's data files use (see data/Vanshawali-template.json), and to
 * render that tree as a standalone, downloadable SVG diagram.
 */

/**
 * One person in the tree (data/Vanshawali-template.json).
 * `name` is the node id "L<level>N<n>": L0N0 is the root, L1N2 the 2nd node on level 1.
 * `node` is the person's name. Shares are set by {@link assignShares}.
 */
export interface VanshawaliPerson {
  name: string;
  level: number;
  node: string;
  /** Name as shown in the diagram: "Lt. <node>" for deceased people. Set by {@link assignDisplayNames}. */
  displayName?: string;
  share_fraction: string;
  share_percentage: number;
  /** Set when this person's line has ended and their share passed to their siblings' lines. */
  share_note?: string;
  /** Parent's name (the parent's `node`); absent on the root. */
  parent?: string;
  fatherName: string;
  grandfatherName: string;
  district: string;
  village: string;
  thana: string;
  isAlive: boolean;
  hasChildren: boolean;
  noOfChildren: number;
  children: VanshawaliPerson[];
}

/** One row of the form's working list — the same fields, plus a parent pointer instead of nested children. */
export interface VanshawaliFormEntry {
  id: string;
  name: string;
  fatherName: string;
  grandfatherName: string;
  district: string;
  village: string;
  thana: string;
  isAlive: boolean;
  hasChildren: boolean;
  noOfChildren: number;
  parentId: string | null;
}

const NODE_W = 168;
const NODE_H = 56;
const X_GAP = 28;
const LEVEL_H = 122;
const MARGIN = 40;
const TITLE_H = 60;

/**
 * Turns the flat, parent-pointer list the form builds into the nested
 * {@link VanshawaliPerson} tree. Requires exactly one entry with no parent
 * (the root) — that's what lets people be added in any order while typing.
 */
export function buildVanshawaliTree(entries: VanshawaliFormEntry[]): VanshawaliPerson {
  if (entries.length === 0) {
    throw new Error('Add at least one person before generating.');
  }

  const roots = entries.filter((e) => e.parentId === null);
  if (roots.length !== 1) {
    throw new Error(
      roots.length === 0
        ? 'No root person found — every entry has a parent selected.'
        : `Found ${roots.length} people with no parent (${roots.map((r) => r.name).join(', ')}). Exactly one root is allowed.`,
    );
  }
  const ids = new Set(entries.map((e) => e.id));
  const orphan = entries.find((e) => e.parentId !== null && !ids.has(e.parentId));
  if (orphan) {
    throw new Error(`"${orphan.name}" points to a parent that no longer exists.`);
  }

  // Node numbers run per level in the order people appear: the root is L0N0,
  // then L1N1, L1N2, ... on each following level.
  const nextNodeNo = new Map<number, number>();
  const toPerson = (
    entry: VanshawaliFormEntry,
    level: number,
    parent: VanshawaliFormEntry | null,
  ): VanshawaliPerson => {
    const nodeNo = level === 0 ? 0 : (nextNodeNo.get(level) ?? 1);
    nextNodeNo.set(level, nodeNo + 1);
    const { id: _id, parentId: _parentId, name, ...details } = entry;
    return {
      name: `L${level}N${nodeNo}`,
      level,
      node: name,
      share_fraction: '',
      share_percentage: 0,
      ...(parent ? { parent: parent.name } : {}),
      ...details,
      children: entries
        .filter((e) => e.parentId === entry.id)
        .map((child) => toPerson(child, level + 1, entry)),
    };
  };

  const root = toPerson(roots[0], 0, null);
  assignShares(root);
  assignDisplayNames(root);
  return root;
}

const DECEASED_PREFIX = 'Lt. ';

/** "Lt. <name>" for a deceased person, the plain name otherwise. */
export function displayNameOf(person: Pick<VanshawaliPerson, 'node' | 'isAlive'>): string {
  return person.isAlive ? person.node : `${DECEASED_PREFIX}${person.node}`;
}

/** Sets every person's displayName from their name and isAlive. */
export function assignDisplayNames(root: VanshawaliPerson): void {
  root.displayName = displayNameOf(root);
  root.children.forEach(assignDisplayNames);
}

/**
 * True while a person's line continues: they're alive, they have children not
 * listed in the tree yet (noOfChildren above the listed count), or one of
 * their listed children's lines continues.
 */
function lineContinues(person: VanshawaliPerson): boolean {
  return (
    person.isAlive ||
    person.noOfChildren > person.children.length ||
    person.children.some(lineContinues)
  );
}

export const LINE_ENDED_NOTE = "Line ended; share passed to siblings' lines";

/**
 * Sets every person's share, starting from the root at 1 (100%). A share is
 * split equally among the children whose line continues. A child whose line
 * has ended (deceased with no successor) keeps their original equal share as
 * history, marked with share_note, while their part passes to their siblings'
 * lines. E.g. Vasudev (1/12) has two sons; Srinivas's line ended, so Ramakant's
 * line (Amit, then Sparsh) gets the whole 1/12, and Srinivas still shows 1/24.
 */
export function assignShares(root: VanshawaliPerson): void {
  const visit = (person: VanshawaliPerson, share: Fraction, lineEnded: boolean): void => {
    person.share_fraction = formatFraction(share);
    person.share_percentage = Math.round((share.num / share.den) * 100 * 1e6) / 1e6;
    if (lineEnded) {
      person.share_note = LINE_ENDED_NOTE;
    } else {
      delete person.share_note;
    }
    const children = person.children;
    if (children.length === 0) {
      return;
    }
    const continuing = children.filter(lineContinues);
    // If no child's line continues, the share is simply split equally among them.
    const heirs = continuing.length ? continuing : children;
    const heirShare = divide(share, heirs.length);
    const originalShare = divide(share, children.length);
    for (const child of children) {
      const isHeir = heirs.includes(child);
      visit(child, isHeir ? heirShare : originalShare, !isHeir);
    }
  };
  visit(root, { num: 1, den: 1 }, false);
}

interface Fraction {
  num: number;
  den: number;
}

function divide(share: Fraction, parts: number): Fraction {
  const den = share.den * parts;
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const g = gcd(share.num, den);
  return { num: share.num / g, den: den / g };
}

function formatFraction(share: Fraction): string {
  return share.den === 1 ? String(share.num) : `${share.num}/${share.den}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface LayoutPosition {
  x: number;
  y: number;
  node: VanshawaliPerson;
}

function layoutTree(root: VanshawaliPerson): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>();
  let leafCount = 0;

  const place = (node: VanshawaliPerson): number => {
    let x: number;
    if (node.children.length === 0) {
      x = leafCount * (NODE_W + X_GAP);
      leafCount += 1;
    } else {
      const childXs = node.children.map(place);
      x = childXs.reduce((sum, v) => sum + v, 0) / childXs.length;
    }
    const y = node.level * LEVEL_H;
    positions.set(node.name, { x, y, node });
    return x;
  };

  place(root);
  return positions;
}

/** Renders a Vanshawali tree as a self-contained SVG string, styled to match the reference diagram. */
export function renderVanshawaliSvg(root: VanshawaliPerson, title: string): string {
  const positions = layoutTree(root);
  const values = [...positions.values()];
  const maxX = Math.max(...values.map((p) => p.x));
  const maxY = Math.max(...values.map((p) => p.y));
  const width = maxX + NODE_W + MARGIN * 2;
  const height = maxY + NODE_H + MARGIN * 2 + TITLE_H;

  for (const p of values) {
    p.x += MARGIN;
    p.y += MARGIN + TITLE_H;
  }

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(0)}" height="${height.toFixed(0)}" ` +
      `viewBox="0 0 ${width.toFixed(0)} ${height.toFixed(0)}" font-family="'Segoe UI', Arial, sans-serif">`,
  );
  parts.push(
    '<defs>' +
      '<linearGradient id="nodeFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#f4f1ea"/>' +
      '</linearGradient>' +
      '<linearGradient id="rootFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#198754"/><stop offset="100%" stop-color="#14532d"/>' +
      '</linearGradient>' +
      // Deceased (isAlive: false) nodes: soft red with a slight blur, still readable.
      '<linearGradient id="deceasedFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#fdecea"/><stop offset="100%" stop-color="#f8d4d0"/>' +
      '</linearGradient>' +
      '<filter id="deceasedBlur" x="-5%" y="-5%" width="110%" height="110%">' +
      '<feGaussianBlur stdDeviation="0.45"/>' +
      '</filter>' +
      '</defs>',
  );
  parts.push(
    `<rect x="0" y="0" width="${width.toFixed(0)}" height="${height.toFixed(0)}" fill="#faf7f0"/>`,
  );
  parts.push(
    `<text x="${(width / 2).toFixed(0)}" y="40" text-anchor="middle" font-size="26" font-weight="700" ` +
      `fill="#14532d">${escapeXml(title)}</text>`,
  );
  parts.push(
    `<rect x="${(width / 2 - 150).toFixed(0)}" y="52" width="12" height="12" fill="url(#deceasedFill)" ` +
      `stroke="#c62828" stroke-width="1.2"/>` +
      `<text x="${(width / 2 - 132).toFixed(0)}" y="62" font-size="12" fill="#6c757d">` +
      `Red, square box (Lt.) = deceased · rounded box = alive</text>`,
  );

  const drawEdges = (node: VanshawaliPerson): void => {
    const p = positions.get(node.name)!;
    for (const child of node.children) {
      const q = positions.get(child.name)!;
      const px = p.x + NODE_W / 2;
      const py = p.y + NODE_H;
      const cx = q.x + NODE_W / 2;
      const cy = q.y;
      const midY = (py + cy) / 2;
      parts.push(
        `<path d="M ${px.toFixed(1)} ${py.toFixed(1)} C ${px.toFixed(1)} ${midY.toFixed(1)}, ` +
          `${cx.toFixed(1)} ${midY.toFixed(1)}, ${cx.toFixed(1)} ${cy.toFixed(1)}" fill="none" ` +
          `stroke="#b9a98c" stroke-width="2"/>`,
      );
      drawEdges(child);
    }
  };
  drawEdges(root);

  const drawNodes = (node: VanshawaliPerson): void => {
    const p = positions.get(node.name)!;
    const isRoot = node.level === 0;
    const isDeceased = !node.isAlive;
    // Deceased people (including a deceased root) get the red, sharp-cornered, slightly blurred box.
    const fill = isDeceased ? 'url(#deceasedFill)' : isRoot ? 'url(#rootFill)' : 'url(#nodeFill)';
    const stroke = isDeceased ? '#c62828' : isRoot ? '#0d3d24' : '#198754';
    const textFill = isDeceased ? '#b71c1c' : isRoot ? '#ffffff' : '#263238';
    const subFill = isDeceased ? '#c05a55' : isRoot ? '#d7f0e3' : '#6c757d';
    const cornerRadius = isDeceased ? 0 : 10;

    parts.push(
      `<g class="tree-node${isRoot ? ' tree-root' : ''}${isDeceased ? ' tree-deceased' : ''}" ` +
        `data-id="${escapeXml(node.name)}" data-level="${node.level}"` +
        `${isDeceased ? ' filter="url(#deceasedBlur)"' : ''}>`,
    );
    parts.push(
      `<rect x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" width="${NODE_W}" height="${NODE_H}" ` +
        `rx="${cornerRadius}" fill="${fill}" stroke="${stroke}" stroke-width="${isRoot ? 2.4 : 1.6}"/>`,
    );
    parts.push(
      `<text class="tree-node-label" x="${(p.x + NODE_W / 2).toFixed(1)}" y="${(p.y + NODE_H / 2 - 4).toFixed(1)}" ` +
        `text-anchor="middle" font-size="14.5" font-weight="600" fill="${textFill}">` +
        `${escapeXml(displayNameOf(node))}</text>`,
    );
    parts.push(
      `<text class="tree-node-sub" x="${(p.x + NODE_W / 2).toFixed(1)}" y="${(p.y + NODE_H / 2 + 14).toFixed(1)}" ` +
        `text-anchor="middle" font-size="11" fill="${subFill}">` +
        `Gen ${node.level} &#183; ${escapeXml(node.name)} &#183; ${escapeXml(node.share_fraction)}` +
        `${node.share_note ? ' (line ended)' : ''}</text>`,
    );
    parts.push('</g>');
    node.children.forEach(drawNodes);
  };
  drawNodes(root);

  parts.push('</svg>');
  return parts.join('\n');
}

export function downloadTextFile(filename: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
