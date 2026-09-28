import { Service } from '@angular/core';
import anshdarData from './data/anshdar.json';
import byaschak110Plots from './data/Byaschak-110.json';
import byaschak110Khatiyan from './data/mouja-khatiyan-Byaschak-110.json';
import gosaipur109Plots from './data/Gosaipur-109.json';
import gosaipur109Khatiyan from './data/mouja-khatiyan-Gosaipur-109.json';
import randadeeh111Plots from './data/Randadeeh-111.json';
import randadeeh111Khatiyan from './data/mouja-khatiyan-Randadeeh-111.json';

/**
 * Source: "Untitled spreadsheet.xlsx" (Sheet1) — Khanagi Bantwara (private partition)
 * record of the Mourisi Jameen of Swargiya Badai Tiwary, Mouja Gosain Pur.
 */

export interface MoujaInfo {
  mouja: string;
  thanaNumber: string;
  thanaName: string;
  note: string;
}

/**
 * One member of the family holding (or inheriting) an Ansh in the land,
 * from anshdar.json — built from Vanshawali-template.json and tiwary_family_tree.svg.
 */
export interface Anshdar {
  slNo: number;
  name: string;
  fatherName: string;
  grandfatherName: string;
  village: string;
  totalRakabaDecimal: NumberOrNA;
  note?: string;
  reference?: string;
  /** Generation below Badai Tiwary (Gen 0), as in the family tree. */
  generation: number;
  /** Family-tree node id (e.g. L3N1), the same as `name` in Vanshawali-template.json. */
  nodeId: string;
  /** Khatiyan Raiyat (Badai Tiwary's son) this Anshdar's share descends from. */
  raiyat: string;
  /** Share of Badai Tiwary's land, split equally among each person's children. */
  share_fraction: string;
  share_percentage: number;
}

/** Values missing from the source Khatiyan sheet are recorded as "NA". */
export type NumberOrNA = number | 'NA';

export interface DakhalShare {
  name: string;
  share: NumberOrNA;
}

/** One Khata row of a Mouja's Khatiyan (mouja-khatiyan-<mouja>.json). */
export interface KhatiyanKhata {
  khata_number: number;
  raiyat_name: string[];
  total_plots: number;
  totalRakabaDecimal: NumberOrNA;
}

export interface MoujaKhatiyan {
  mouja: string;
  khatiyan_name: string;
  khata: KhatiyanKhata[];
}

/** One Khesara / Plot of a Mouja (<mouja>.json). */
export interface KhataPlot {
  khata_number: number;
  khesara_no: number | string;
  plot_type: string;
  chouhadi: string[];
  totalRakabaDecimal: NumberOrNA;
  dakhal: DakhalShare[];
  landMark: string;
  comments: string;
  /** True only when the plot is explicitly recorded as sold. */
  isSold: boolean;
  /** Who sold it (the Dakhal holder, or e.g. Lakhinarayan Tiwary for LNT); "" when not sold. */
  seller: string;
  /** Decimal sold when only part of the plot was sold; omitted for a full sale. */
  soldRakbaDecimal?: number;
}

interface MoujaLandRecords {
  khatiyan: MoujaKhatiyan;
  plots: KhataPlot[];
}

export interface AnshdaarSummary {
  name: string;
  totalRakba: number;
  colorCode: string;
}

const MOUJA_INFO: MoujaInfo = {
  mouja: 'Gosain Pur',
  thanaNumber: '110',
  thanaName: 'Shahpur Patti',
  note:
    'Khanagi bantwara Details of Mourisi Jameen of Swargiya Badai Tiwary. ' +
    'Ye bantwara purane surve 1908 k anusaar Swargiya Badai Tiwary k putro dwara 1950 isvi k purva hi ho gaya hai, ' +
    'Usi aadhar par 1960 ka naya survey bhi purane survey k anshdari se bana or uska khatiyaan 1971 me prakashit hua. ' +
    'Babuji Tiwary Badai Tiwary k bade putra the jinka swargwas 1953 me ho gaya tha isiliye inke Putra Lakhi Narayan Tiwary ka naam Khatiyaan me darj hua. ' +
    'Note : 1980 isvi k Biajdawa ko sudhar kiya gaya khatiyaan and anshdari k basis pe jo pahale ye sab vishesh jankari nahi rahane k karan bahut saari trutiya rah gayi thi.',
};

const ANSHDAR_LIST: Anshdar[] = anshdarData as Anshdar[];

/**
 * Khatiyan + plot records per Mouja, keyed by the Mouja name used in
 * halka-mouja-list.json. Add an entry here when another Mouja's files are ready.
 */
const MOUJA_LAND_RECORDS: Record<string, MoujaLandRecords> = {
  'Gosaipur-109': {
    khatiyan: gosaipur109Khatiyan as MoujaKhatiyan,
    plots: gosaipur109Plots as KhataPlot[],
  },
  'Randadeeh-111': {
    khatiyan: randadeeh111Khatiyan as MoujaKhatiyan,
    plots: randadeeh111Plots as KhataPlot[],
  },
  'Byaschak-110': {
    khatiyan: byaschak110Khatiyan as MoujaKhatiyan,
    plots: byaschak110Plots as KhataPlot[],
  },
};

/** Mouja shown before one is picked in the location filter. */
export const DEFAULT_MOUJA = 'Gosaipur-109';

export const OTHERS_LABEL = 'OTHERS';

/** Raiyat slice colors, assigned in the order Raiyat first appear in a Mouja's Khatiyan. */
const RAIYAT_PALETTE = ['#674ea7', '#6aa84f', '#e69138', '#a64d79', '#3d85c6', '#cc4125', '#45818e'];
const OTHERS_COLOR = '#b7b7b7';

/** Per-Anshdaar identity color, taken from the source sheet's own "Color Code" column. */
const ANSHDAAR_COLORS: Record<string, string> = {
  'Vasudev Tiwary': '#674ea7',
  'Hardev Tiwary': '#6aa84f',
  'Harkishor Tiwary': '#e69138',
  'Ramkumar Tiwary': '#a64d79',
};

const UNASSIGNED_LABEL = 'Not Currently Dakhal (Sold / Unassigned)';
const UNASSIGNED_COLOR = '#9aa0a6';

/**
 * The source sheet's own "Result" table: each Anshdaar's total Rakba after
 * historic adjustments/exchanges (grand total 194 decimal). This is a
 * separate, authoritative figure the sheet states directly — distinct from
 * the raw Dakhal shares recorded per Khesara below (grand total 285 decimal,
 * of which some Khesara currently have no recorded Dakhal holder).
 */
const RESULT_ANSHDAAR_SUMMARY: AnshdaarSummary[] = [
  { name: 'Vasudev Tiwary', totalRakba: 52.25, colorCode: ANSHDAAR_COLORS['Vasudev Tiwary'] },
  { name: 'Hardev Tiwary', totalRakba: 52.25, colorCode: ANSHDAAR_COLORS['Hardev Tiwary'] },
  { name: 'Harkishor Tiwary', totalRakba: 44.75, colorCode: ANSHDAAR_COLORS['Harkishor Tiwary'] },
  { name: 'Ramkumar Tiwary', totalRakba: 44.75, colorCode: ANSHDAAR_COLORS['Ramkumar Tiwary'] },
];

@Service()
export class LandData {
  getMoujaInfo(): MoujaInfo {
    return MOUJA_INFO;
  }

  getAnshdarList(): Anshdar[] {
    return ANSHDAR_LIST;
  }

  /**
   * Every descendant of the given person in the Vanshawali (anshdar.json),
   * found by following fatherName links down the tree, ordered by generation.
   * Years in fatherName (e.g. "Jainarayan Tiwary(1901-1965)") are ignored.
   */
  getSuccessors(name: string): Anshdar[] {
    const baseName = (value: string): string => value.replace(/\(.*\)/, '').trim();
    const successors: Anshdar[] = [];
    let generation = [baseName(name)];
    while (generation.length) {
      const children = ANSHDAR_LIST.filter((a) => generation.includes(baseName(a.fatherName)));
      successors.push(...children);
      generation = children.map((a) => a.name);
    }
    return successors;
  }

  hasLandRecords(mouja: string): boolean {
    return mouja in MOUJA_LAND_RECORDS;
  }

  getMoujaKhatiyan(mouja: string): MoujaKhatiyan | null {
    return MOUJA_LAND_RECORDS[mouja]?.khatiyan ?? null;
  }

  getKhataPlots(mouja: string): KhataPlot[] {
    return MOUJA_LAND_RECORDS[mouja]?.plots ?? [];
  }

  getResultAnshdaarSummary(): AnshdaarSummary[] {
    return RESULT_ANSHDAAR_SUMMARY;
  }

  /**
   * Each Raiyat's Dakhal share summed across the given plots, as recorded.
   * Shares recorded as "NA" are skipped. When a plot's shares add up to less
   * than its Rakba, the remainder goes to a "Not Currently Dakhal" slice. When
   * they add up to more (e.g. Gosaipur Khata 135 / Khesara 888), the recorded
   * shares are kept, so the breakdown total can exceed the plots' Rakba — see
   * getExcessDakhalPlots().
   */
  /** Plots whose recorded Dakhal shares add up to more than their Rakba, as "Khata/Khesara". */
  getExcessDakhalPlots(plots: KhataPlot[]): string[] {
    return plots
      .filter((plot) => {
        if (plot.totalRakabaDecimal === 'NA') {
          return false;
        }
        const shareSum = plot.dakhal.reduce(
          (sum, d) => sum + (d.share === 'NA' ? 0 : d.share),
          0,
        );
        return shareSum > plot.totalRakabaDecimal + 1e-9;
      })
      .map((plot) => `${plot.khata_number}/${plot.khesara_no}`);
  }

  getRaiyatRakbaBreakdown(khatiyan: MoujaKhatiyan | null, plots: KhataPlot[]): AnshdaarSummary[] {
    const totals = new Map<string, number>();
    const add = (name: string, value: number): void => {
      totals.set(name, (totals.get(name) ?? 0) + value);
    };

    for (const plot of plots) {
      if (plot.totalRakabaDecimal === 'NA') {
        continue;
      }
      const rakba = plot.totalRakabaDecimal;
      const shares = plot.dakhal.filter(
        (d): d is { name: string; share: number } => d.share !== 'NA' && d.share > 0,
      );
      const shareSum = shares.reduce((sum, d) => sum + d.share, 0);
      for (const d of shares) {
        add(d.name, d.share);
      }
      if (shareSum < rakba) {
        add(UNASSIGNED_LABEL, rakba - shareSum);
      }
    }

    const round2 = (value: number): number => Math.round(value * 100) / 100;

    const raiyatOrder = [...new Set(khatiyan?.khata.flatMap((k) => k.raiyat_name) ?? [])];
    for (const name of totals.keys()) {
      if (!raiyatOrder.includes(name) && name !== OTHERS_LABEL && name !== UNASSIGNED_LABEL) {
        raiyatOrder.push(name);
      }
    }

    const breakdown: AnshdaarSummary[] = raiyatOrder.map((name, i) => ({
      name,
      totalRakba: round2(totals.get(name) ?? 0),
      colorCode: RAIYAT_PALETTE[i % RAIYAT_PALETTE.length],
    }));
    if (totals.has(OTHERS_LABEL)) {
      breakdown.push({ name: OTHERS_LABEL, totalRakba: round2(totals.get(OTHERS_LABEL)!), colorCode: OTHERS_COLOR });
    }
    if (totals.has(UNASSIGNED_LABEL)) {
      breakdown.push({
        name: UNASSIGNED_LABEL,
        totalRakba: round2(totals.get(UNASSIGNED_LABEL)!),
        colorCode: UNASSIGNED_COLOR,
      });
    }

    return breakdown.filter((entry) => entry.totalRakba > 0);
  }
}
