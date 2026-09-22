import { Service } from '@angular/core';
import khataDharakData from './data/khata-dharak.json';
import khesaraRecordsData from './data/khesara-records.json';

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

export interface KhataDharak {
  slNo: number;
  name: string;
  fatherName: string;
  grandfatherName: string;
  village: string;
  totalRakabaDecimal: number;
  note?: string;
  reference?: string;
}

export interface DakhalShare {
  name: string;
  share: number;
}

export interface KhesaraRecord {
  khataNo: string;
  khesaraNo: string;
  rakba: number;
  dakhal: DakhalShare[];
  note?: string;
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

const KHATA_DHARAK_LIST: KhataDharak[] = khataDharakData;

const KHESARA_RECORDS: KhesaraRecord[] = khesaraRecordsData;

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

  getKhataDharakList(): KhataDharak[] {
    return KHATA_DHARAK_LIST;
  }

  getKhesaraRecords(): KhesaraRecord[] {
    return KHESARA_RECORDS;
  }

  getKhataNos(): string[] {
    return [...new Set(KHESARA_RECORDS.map((r) => r.khataNo))];
  }

  getResultAnshdaarSummary(): AnshdaarSummary[] {
    return RESULT_ANSHDAAR_SUMMARY;
  }

  getTotalRakba(): number {
    return KHESARA_RECORDS.reduce((sum, r) => sum + r.rakba, 0);
  }

  /**
   * Each Anshdaar's actual Rakba, computed by summing their Dakhal share
   * across every Khesara record, out of the full Total Rakba (285 decimal).
   * Khesara with no recorded Dakhal (sold / disputed / unassigned) are
   * rolled into a single "Not Currently Dakhal" slice so the breakdown
   * always accounts for 100% of the Total Rakba.
   *
   * Two source rows (Khata 89/Khesara 330 and Khata 113/Khesara 972) have
   * Dakhal shares that don't sum to their own Rakba — a genuine inconsistency
   * in the source sheet, not a transcription error (see their notes). Each
   * record's shares are normalized proportionally to that record's stated
   * Rakba so the breakdown's grand total always equals the verified Total
   * Rakba exactly, while preserving each Anshdaar's relative share within
   * the record.
   */
  getAnshdaarRakbaBreakdown(): AnshdaarSummary[] {
    const totals = new Map<string, number>();

    for (const record of KHESARA_RECORDS) {
      if (record.dakhal.length === 0) {
        totals.set(UNASSIGNED_LABEL, (totals.get(UNASSIGNED_LABEL) ?? 0) + record.rakba);
        continue;
      }
      const shareSum = record.dakhal.reduce((sum, d) => sum + d.share, 0);
      for (const share of record.dakhal) {
        const normalizedShare = (share.share / shareSum) * record.rakba;
        totals.set(share.name, (totals.get(share.name) ?? 0) + normalizedShare);
      }
    }

    const round2 = (value: number): number => Math.round(value * 100) / 100;

    const anshdaarNames = Object.keys(ANSHDAAR_COLORS);
    const breakdown: AnshdaarSummary[] = anshdaarNames
      .filter((name) => totals.has(name))
      .map((name) => ({ name, totalRakba: round2(totals.get(name)!), colorCode: ANSHDAAR_COLORS[name] }));

    if (totals.has(UNASSIGNED_LABEL)) {
      breakdown.push({
        name: UNASSIGNED_LABEL,
        totalRakba: round2(totals.get(UNASSIGNED_LABEL)!),
        colorCode: UNASSIGNED_COLOR,
      });
    }

    return breakdown;
  }
}
