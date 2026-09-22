/**
 * Shared schema + tree-building + SVG-rendering logic for a Vanshawali
 * (family lineage) tree. Used by the download-vanshawali feature to turn a
 * flat, form-entered list of people into the nested JSON tree the rest of
 * the app's data files use (see data/Vanshawali-template.json), and to
 * render that tree as a standalone, downloadable SVG diagram.
 */

export interface VanshawaliPerson {
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
  hierarchy_level: number;
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

  const nodes = new Map<string, VanshawaliPerson>();
  for (const entry of entries) {
    const { parentId: _parentId, ...rest } = entry;
    nodes.set(entry.id, { ...rest, hierarchy_level: 0, children: [] });
  }

  const roots: VanshawaliPerson[] = [];
  for (const entry of entries) {
    const node = nodes.get(entry.id)!;
    if (entry.parentId === null) {
      roots.push(node);
      continue;
    }
    const parent = nodes.get(entry.parentId);
    if (!parent) {
      throw new Error(`"${entry.name}" points to a parent that no longer exists.`);
    }
    parent.children.push(node);
  }

  if (roots.length !== 1) {
    throw new Error(
      roots.length === 0
        ? 'No root person found — every entry has a parent selected.'
        : `Found ${roots.length} people with no parent (${roots.map((r) => r.name).join(', ')}). Exactly one root is allowed.`,
    );
  }

  const assignLevels = (node: VanshawaliPerson, level: number): void => {
    node.hierarchy_level = level;
    node.children.forEach((child) => assignLevels(child, level + 1));
  };
  assignLevels(roots[0], 1);

  return roots[0];
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
    const y = (node.hierarchy_level - 1) * LEVEL_H;
    positions.set(node.id, { x, y, node });
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
      '</defs>',
  );
  parts.push(
    `<rect x="0" y="0" width="${width.toFixed(0)}" height="${height.toFixed(0)}" fill="#faf7f0"/>`,
  );
  parts.push(
    `<text x="${(width / 2).toFixed(0)}" y="40" text-anchor="middle" font-size="26" font-weight="700" ` +
      `fill="#14532d">${escapeXml(title)}</text>`,
  );

  const drawEdges = (node: VanshawaliPerson): void => {
    const p = positions.get(node.id)!;
    for (const child of node.children) {
      const q = positions.get(child.id)!;
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
    const p = positions.get(node.id)!;
    const isRoot = node.hierarchy_level === 1;
    const fill = isRoot ? 'url(#rootFill)' : 'url(#nodeFill)';
    const stroke = isRoot ? '#0d3d24' : '#198754';
    const textFill = isRoot ? '#ffffff' : '#263238';
    const subFill = isRoot ? '#d7f0e3' : '#6c757d';
    const aliveMark = node.isAlive ? '' : ' †';

    parts.push(
      `<g class="tree-node${isRoot ? ' tree-root' : ''}" data-id="${escapeXml(node.id)}" ` +
        `data-level="${node.hierarchy_level}">`,
    );
    parts.push(
      `<rect x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" width="${NODE_W}" height="${NODE_H}" rx="10" ` +
        `fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`,
    );
    parts.push(
      `<text class="tree-node-label" x="${(p.x + NODE_W / 2).toFixed(1)}" y="${(p.y + NODE_H / 2 - 4).toFixed(1)}" ` +
        `text-anchor="middle" font-size="14.5" font-weight="600" fill="${textFill}">` +
        `${escapeXml(node.name)}${aliveMark}</text>`,
    );
    parts.push(
      `<text class="tree-node-sub" x="${(p.x + NODE_W / 2).toFixed(1)}" y="${(p.y + NODE_H / 2 + 14).toFixed(1)}" ` +
        `text-anchor="middle" font-size="11" fill="${subFill}">` +
        `Gen ${node.hierarchy_level} &#183; ${escapeXml(node.village || node.thana || '')}</text>`,
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
