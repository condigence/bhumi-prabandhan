// Keeps the Vanshawali data files in sync with Vanshawali-template.json, the
// single source of truth for the family tree:
//   - recalculates every share (assignShares: a line that ended passes its
//     share to the siblings' lines) and every displayName ("Lt. " if deceased),
//   - redraws tiwary_family_tree.svg from the tree,
//   - updates the anshdar*.json files (anshdar.json: Badai Tiwary's sons;
//     anshdar-<level>-<n>.json: drill-down under node L<level>N<n>): syncs
//     generation, nodeId, raiyat and shares of the people each file lists
//     (other fields, like rakaba and notes, are kept; nobody is added).
// Runs before `npm run build` and `npm run dev`; run it alone with
// `npm run sync:vanshawali` after editing the template.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Node 22.18+ runs this TypeScript module directly (it only uses type-level syntax).
const { assignDisplayNames, assignShares, renderVanshawaliSvg } = await import(
  '../src/app/core/land/vanshawali-tree.ts'
);

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app', 'core', 'land', 'data');
const templatePath = join(dataDir, 'Vanshawali-template.json');
const svgPath = join(dataDir, 'tiwary_family_tree.svg');
const SVG_TITLE = 'Tiwary Family Tree';

const writeIfChanged = (path, contents) => {
  let current = '';
  try {
    current = readFileSync(path, 'utf8');
  } catch {
    // New file.
  }
  if (current.replace(/\r\n/g, '\n') === contents) {
    return false;
  }
  writeFileSync(path, contents);
  return true;
};

// --- Vanshawali-template.json -------------------------------------------------
const tree = JSON.parse(readFileSync(templatePath, 'utf8'));

const fixChildCounts = (person) => {
  // noOfChildren may be higher than the listed children (not all added yet), never lower.
  person.noOfChildren = Math.max(person.noOfChildren ?? 0, person.children.length);
  person.hasChildren = person.noOfChildren > 0;
  person.children.forEach(fixChildCounts);
};
fixChildCounts(tree);
assignShares(tree);
assignDisplayNames(tree);

// Fixed key order, so the file stays easy to read and diff.
const ordered = (person) => {
  const {
    name,
    level,
    node,
    displayName,
    lifespan,
    share_fraction,
    share_percentage,
    share_note,
    parent,
    children,
    ...rest
  } = person;
  return {
    name,
    level,
    node,
    displayName,
    ...(lifespan ? { lifespan } : {}),
    share_fraction,
    share_percentage,
    ...(share_note ? { share_note } : {}),
    ...(parent ? { parent } : {}),
    ...rest,
    children: children.map(ordered),
  };
};
const orderedTree = ordered(tree);

const changed = [];
if (writeIfChanged(templatePath, JSON.stringify(orderedTree, null, 2) + '\n')) {
  changed.push('Vanshawali-template.json');
}

// --- tiwary_family_tree.svg ---------------------------------------------------
if (writeIfChanged(svgPath, renderVanshawaliSvg(orderedTree, SVG_TITLE) + '\n')) {
  changed.push('tiwary_family_tree.svg');
}

// --- anshdar*.json ------------------------------------------------------------
const people = new Map();
const collect = (person, raiyat) => {
  const lineRaiyat = person.level === 1 ? person.node : raiyat;
  people.set(person.node, { person, raiyat: lineRaiyat });
  person.children.forEach((child) => collect(child, lineRaiyat));
};
collect(orderedTree, null);

const missing = [];
for (const file of readdirSync(dataDir).filter((f) => /^anshdar(-\d+-\d+)?\.json$/.test(f))) {
  const path = join(dataDir, file);
  const records = JSON.parse(readFileSync(path, 'utf8'));
  for (const record of records) {
    const found = people.get(record.name);
    if (!found) {
      missing.push(`${record.name} (${file})`);
      continue;
    }
    Object.assign(record, {
      generation: found.person.level,
      nodeId: found.person.name,
      raiyat: found.raiyat,
      share_fraction: found.person.share_fraction,
      share_percentage: found.person.share_percentage,
    });
  }
  if (writeIfChanged(path, JSON.stringify(records, null, 2) + '\n')) {
    changed.push(file);
  }
}

console.log(
  `Vanshawali sync: ${changed.length ? `updated ${changed.join(', ')}` : 'already in sync'}` +
    `${missing.length ? `; not in the Vanshawali tree: ${missing.join(', ')}` : ''}`,
);
