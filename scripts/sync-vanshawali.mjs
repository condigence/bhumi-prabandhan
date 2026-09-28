// Keeps the Vanshawali data files in sync with Vanshawali-template.json, the
// single source of truth for the family tree:
//   - recalculates every share (assignShares: a line that ended passes its
//     share to the siblings' lines) and every displayName ("Lt. " if deceased),
//   - redraws tiwary_family_tree.svg from the tree,
//   - updates anshdar.json: adds people missing from it and syncs generation,
//     nodeId and shares (other fields, like rakaba and notes, are kept).
// Runs before `npm run build` and `npm run dev`; run it alone with
// `npm run sync:vanshawali` after editing the template.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Node 22.18+ runs this TypeScript module directly (it only uses type-level syntax).
const { assignDisplayNames, assignShares, renderVanshawaliSvg } = await import(
  '../src/app/core/land/vanshawali-tree.ts'
);

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app', 'core', 'land', 'data');
const templatePath = join(dataDir, 'Vanshawali-template.json');
const svgPath = join(dataDir, 'tiwary_family_tree.svg');
const anshdarPath = join(dataDir, 'anshdar.json');
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
  const { name, level, node, displayName, share_fraction, share_percentage, share_note, parent, children, ...rest } =
    person;
  return {
    name,
    level,
    node,
    displayName,
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

// --- anshdar.json -------------------------------------------------------------
const anshdar = JSON.parse(readFileSync(anshdarPath, 'utf8'));
const byName = new Map(anshdar.map((a) => [a.name, a]));
const added = [];

const syncAnshdar = (person, parent, grandparent, raiyat) => {
  if (person.level > 0) {
    const lineRaiyat = person.level === 1 ? person.node : raiyat;
    let entry = byName.get(person.node);
    if (!entry) {
      entry = {
        slNo: 0,
        name: person.node,
        fatherName: parent.node,
        grandfatherName: grandparent?.node ?? 'NA',
        village: person.village || 'NA',
        totalRakabaDecimal: 'NA',
      };
      anshdar.push(entry);
      byName.set(person.node, entry);
      added.push(person.node);
    }
    Object.assign(entry, {
      generation: person.level,
      nodeId: person.name,
      raiyat: lineRaiyat,
      share_fraction: person.share_fraction,
      share_percentage: person.share_percentage,
    });
    person.children.forEach((child) => syncAnshdar(child, person, parent, lineRaiyat));
  } else {
    person.children.forEach((child) => syncAnshdar(child, person, null, null));
  }
};
syncAnshdar(orderedTree, null, null, null);

// Order by generation (stable, so existing order within a generation is kept) and renumber.
anshdar.sort((a, b) => a.generation - b.generation);
anshdar.forEach((a, i) => (a.slNo = i + 1));
if (writeIfChanged(anshdarPath, JSON.stringify(anshdar, null, 2) + '\n')) {
  changed.push('anshdar.json');
}

console.log(
  `Vanshawali sync: ${changed.length ? `updated ${changed.join(', ')}` : 'already in sync'}` +
    `${added.length ? `; added to anshdar.json: ${added.join(', ')}` : ''}`,
);
