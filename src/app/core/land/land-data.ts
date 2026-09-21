import { Service } from '@angular/core';

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

const KHATA_DHARAK_LIST: KhataDharak[] = [
  {
    slNo: 1,
    name: 'Vasudev Tiwary',
    fatherName: 'Jai Narayan Tiwary(1901-1965)',
    grandfatherName: 'Paramhans Tiwary(1878-1971)',
    village: 'Gosaipur',
    totalRakabaDecimal: 51.5,
  },
  {
    slNo: 2,
    name: 'Hardev Tiwary',
    fatherName: 'Jai Narayan Tiwary(1901-1965)',
    grandfatherName: 'Paramhans Tiwary(1878-1971)',
    village: 'Gosaipur',
    totalRakabaDecimal: 51.5,
  },
  {
    slNo: 3,
    name: 'Harkishor Tiwary',
    fatherName: 'Jai Narayan Tiwary(1901-1965)',
    grandfatherName: 'Paramhans Tiwary(1878-1971)',
    village: 'Gosaipur',
    totalRakabaDecimal: 44.0,
    note:
      'Mouja vyas chak Thana No. 108, Khata 11, Khesara - 380 and Rakaba - 30 decimal. ' +
      '30*1/4 = 7.5. Sell kar diye hai',
    reference: '2018 (Refernece - TBD)',
  },
  {
    slNo: 4,
    name: 'Ramkumar Tiwary',
    fatherName: 'Jai Narayan Tiwary(1901-1965)',
    grandfatherName: 'Paramhans Tiwary(1878-1971)',
    village: 'Gosaipur',
    totalRakabaDecimal: 44.0,
    note:
      'Mouja vyas chak Thana No. 108, Khata 11, Khesara - 380 and Rakaba - 30 decimal. ' +
      '30*1/4 = 7.5. Sell kar diye hai',
  },
];

const KHESARA_RECORDS: KhesaraRecord[] = [
  {
    khataNo: '89',
    khesaraNo: '19',
    rakba: 6,
    dakhal: [
      { name: 'Harkishor Tiwary', share: 3 },
      { name: 'Ramkumar Tiwary', share: 3 },
    ],
    note:
      'Nadi k paas road k uttar kon pe tin plot hai 17(Ram sundar baba 10 decimal badlain jo ' +
      'ramadhar ahir k ladka ko bech diya gaya hai Bhabhuti k iyaaa), 18, 19 — Semariya school k paas (Dhusa Par Uttar)',
  },
  {
    khataNo: '89',
    khesaraNo: '400',
    rakba: 18,
    dakhal: [
      { name: 'Vasudev Tiwary', share: 4.5 },
      { name: 'Hardev Tiwary', share: 4.5 },
      { name: 'Harkishor Tiwary', share: 4.5 },
      { name: 'Ramkumar Tiwary', share: 4.5 },
    ],
    note: 'Bouli par Bagicha',
  },
  {
    khataNo: '89',
    khesaraNo: '840',
    rakba: 22,
    dakhal: [
      { name: 'Vasudev Tiwary', share: 5.5 },
      { name: 'Hardev Tiwary', share: 5.5 },
      { name: 'Harkishor Tiwary', share: 5.5 },
      { name: 'Ramkumar Tiwary', share: 5.5 },
    ],
    note: 'Boring par naya Bagicha charo log k',
  },
  {
    khataNo: '89',
    khesaraNo: '341/98',
    rakba: 9,
    dakhal: [
      { name: 'Harkishor Tiwary', share: 4.5 },
      { name: 'Ramkumar Tiwary', share: 4.5 },
    ],
    note: 'Gachi me mahua k ped 11 Usi me hai',
  },
  {
    khataNo: '89',
    khesaraNo: '342',
    rakba: 22,
    dakhal: [
      { name: 'Harkishor Tiwary', share: 11 },
      { name: 'Ramkumar Tiwary', share: 11 },
    ],
    note: 'Gachi me mahua k ped 11 Usi me hai',
  },
  {
    khataNo: '89',
    khesaraNo: '346',
    rakba: 18,
    dakhal: [{ name: 'Hardev Tiwary', share: 18 }],
    note: 'Nadi k paas Bandh par ped sahit 6 katha',
  },
  {
    khataNo: '89',
    khesaraNo: '330',
    rakba: 13,
    dakhal: [
      { name: 'Vasudev Tiwary', share: 10 },
      { name: 'Hardev Tiwary', share: 0.75 },
      { name: 'Harkishor Tiwary', share: 0.75 },
      { name: 'Ramkumar Tiwary', share: 0.75 },
    ],
    note: 'Nadi k paas road k dakhin',
  },
  {
    khataNo: '89',
    khesaraNo: '331',
    rakba: 15,
    dakhal: [{ name: 'Vasudev Tiwary', share: 15 }],
    note: 'Nadi k paas road k dakhin',
  },
  {
    khataNo: '126',
    khesaraNo: '766',
    rakba: 7,
    dakhal: [{ name: 'Vasudev Tiwary', share: 7 }],
    note: 'Naye road k east me naye bagicha Samahutiaya k paas .10 - .03 (Rasta) = 0.7',
  },
  {
    khataNo: '126',
    khesaraNo: '921',
    rakba: 18,
    dakhal: [
      { name: 'Harkishor Tiwary', share: 9 },
      { name: 'Ramkumar Tiwary', share: 9 },
    ],
    note: 'Kapil Mishir k purana bagicha boring k dakhin Noukathawa',
  },
  {
    khataNo: '126',
    khesaraNo: '360',
    rakba: 7,
    dakhal: [{ name: 'Vasudev Tiwary', share: 7 }],
    note:
      'Suraj ojha se badalin (purana plywood k east) -> Gangasagar ojha (pachim bhar ka ply wood prapt hua)',
  },
  {
    khataNo: '159',
    khesaraNo: '349',
    rakba: 44,
    dakhal: [{ name: 'Hardev Tiwary', share: 44 }],
    note: '50.5 - 6.5 (Rasta) = 44',
  },
  {
    khataNo: '141',
    khesaraNo: '839',
    rakba: 4,
    dakhal: [{ name: 'Hardev Tiwary', share: 4 }],
    note: 'Boring Par Jaamun wala plot',
  },
  {
    khataNo: '141',
    khesaraNo: '621',
    rakba: 4,
    dakhal: [{ name: 'Vasudev Tiwary', share: 4 }],
    note: 'Basawari ka paas Koit Sadhu Tiwari k duaar k dakshin',
  },
  {
    khataNo: '141',
    khesaraNo: '602',
    rakba: 2,
    dakhal: [
      { name: 'Vasudev Tiwary', share: 0.5 },
      { name: 'Hardev Tiwary', share: 0.5 },
      { name: 'Harkishor Tiwary', share: 0.5 },
      { name: 'Ramkumar Tiwary', share: 0.5 },
    ],
    note:
      '10 decimal - Jainarayan Tiwary - Badale me Byas chak rambachan Dubey Khata 11 khesara - 303 ' +
      'rakaba 10 decimal se badalain diya gaya. Late Sriniwas Tiwary k naam pe liya gaya hai',
  },
  {
    khataNo: '77',
    khesaraNo: '601',
    rakba: 8,
    dakhal: [
      { name: 'Vasudev Tiwary', share: 2 },
      { name: 'Hardev Tiwary', share: 2 },
      { name: 'Harkishor Tiwary', share: 2 },
      { name: 'Ramkumar Tiwary', share: 2 },
    ],
    note:
      '10 decimal - Jainarayan Tiwary - Badale me Byas chak rambachan Dubey Khata 11 khesara - 303 ' +
      'rakaba 10 decimal se badalain diya gaya. Late Sriniwas Tiwary k naam pe liya gaya hai',
  },
  {
    khataNo: '113',
    khesaraNo: '972',
    rakba: 23,
    dakhal: [{ name: 'Hardev Tiwary', share: 33 }],
    note: 'Dada wali bagicha rasta',
  },
  {
    khataNo: '113',
    khesaraNo: '969',
    rakba: 4,
    dakhal: [],
    note: 'Dada wali bagicha rasta',
  },
  {
    khataNo: '113',
    khesaraNo: '970',
    rakba: 6,
    dakhal: [],
    note: 'Dada wali bagicha rasta',
  },
  {
    khataNo: '113',
    khesaraNo: '517',
    rakba: 7,
    dakhal: [],
    note: 'Ram das Upadhaya ko vikray kiya gaya hai',
  },
  {
    khataNo: '113',
    khesaraNo: '518',
    rakba: 1,
    dakhal: [],
    note: 'Ram das Upadhaya ko vikray kiya gaya hai - Baba ka yagya and Sidhi baba se liya gaya hai',
  },
  {
    khataNo: '113',
    khesaraNo: '528',
    rakba: 7,
    dakhal: [],
    note:
      'Ram das Upadhaya ko vikray kiya gaya hai - Baba ka yagya and Sidhi baba se liya gaya hai. ' +
      'Piyar tiwari se badalai and humlogo k ghar ka bsigat jamin liya gaya',
  },
  {
    khataNo: '113',
    khesaraNo: '792',
    rakba: 10,
    dakhal: [],
    note:
      'Lakhi tiwari se makhoukik badailin kar k Ghar k paas duaar pe liya gaya hai - 113 khata k 528 ' +
      'or 792 Laki tiwari and Yugeshwar tiwari se badlien lekar - Khata 141 ka khesara 630 me liya gaya hai',
  },
  {
    khataNo: '39',
    khesaraNo: '616',
    rakba: 2,
    dakhal: [{ name: 'Hardev Tiwary', share: 2 }],
    note: 'Badri baba k makan k pachim hum logo ka Aam ka ped',
  },
  {
    khataNo: '40',
    khesaraNo: '18',
    rakba: 8,
    dakhal: [
      { name: 'Harkishor Tiwary', share: 4 },
      { name: 'Ramkumar Tiwary', share: 4 },
    ],
    note:
      'Ramsundar Tiwary k badailan se prapt. Badale me 89 Khata - 17 khesara - 10 decimal diya gaya hai',
  },
];

const ANSHDAAR_SUMMARY: AnshdaarSummary[] = [
  { name: 'Vasudev Tiwary', totalRakba: 52.25, colorCode: '#674ea7' },
  { name: 'Hardev Tiwary', totalRakba: 52.25, colorCode: '#6aa84f' },
  { name: 'Harkishor Tiwary', totalRakba: 44.75, colorCode: '#e69138' },
  { name: 'Ramkumar Tiwary', totalRakba: 44.75, colorCode: '#a64d79' },
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

  getAnshdaarSummary(): AnshdaarSummary[] {
    return ANSHDAAR_SUMMARY;
  }

  getTotalRakba(): number {
    return KHESARA_RECORDS.reduce((sum, r) => sum + r.rakba, 0);
  }
}
