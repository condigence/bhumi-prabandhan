import { Service } from '@angular/core';

export interface Option {
  id: string;
  name: string;
}

export interface OwnerLand {
  district: string;
  thana: string;
  mouja: string;
  khataNo: string;
  plotNo: string;
  landType: string;
  totalArea: number;
  share: string;
  ownedArea: number;
  status: 'Active' | 'Review';
}

export interface OwnerDetails {
  id: string;
  name: string;
  fatherName: string;
  district: string;
  thana: string;
  mouja: string;
  totalKhatas: number;
  totalPlots: number;
  totalOwnedArea: number;
}

interface OwnerRecord {
  details: OwnerDetails;
  lands: OwnerLand[];
}

const DISTRICTS: Option[] = [
  { id: 'd1', name: 'District A' },
  { id: 'd2', name: 'District B' },
  { id: 'd3', name: 'District C' },
];

const THANAS: Record<string, Option[]> = {
  d1: [
    { id: 't1', name: 'Thana 1' },
    { id: 't2', name: 'Thana 2' },
  ],
  d2: [{ id: 't3', name: 'Thana 3' }],
  d3: [{ id: 't4', name: 'Thana 4' }],
};

const MOUJAS: Record<string, Option[]> = {
  t1: [{ id: 'm1', name: 'Mouja A' }],
  t2: [{ id: 'm2', name: 'Mouja B' }],
  t3: [{ id: 'm3', name: 'Mouja C' }],
  t4: [{ id: 'm4', name: 'Mouja D' }],
};

const KHATAS: Record<string, Option[]> = {
  m1: [
    { id: 'k101', name: '101' },
    { id: 'k205', name: '205' },
  ],
  m2: [{ id: 'k205b', name: '205' }],
  m3: [{ id: 'k305', name: '305' }],
  m4: [{ id: 'k410', name: '410' }],
};

const PLOTS: Record<string, Option[]> = {
  k101: [
    { id: 'p125', name: '125' },
    { id: 'p126', name: '126' },
  ],
  k205: [{ id: 'p301', name: '301' }],
  k205b: [{ id: 'p301', name: '301' }],
  k305: [{ id: 'p410', name: '410' }],
  k410: [{ id: 'p410b', name: '410' }],
};

const OWNERS: Record<string, Option[]> = {
  p125: [
    { id: 'o1', name: 'Ramesh Kumar' },
    { id: 'o2', name: 'Suresh Kumar' },
  ],
  p126: [{ id: 'o1', name: 'Ramesh Kumar' }],
  p301: [{ id: 'o3', name: 'Sunita Devi' }],
  p410: [{ id: 'o1', name: 'Ramesh Kumar' }],
  p410b: [{ id: 'o3', name: 'Sunita Devi' }],
};

const OWNER_RECORDS: Record<string, OwnerRecord> = {
  o1: {
    details: {
      id: 'OWN-00125',
      name: 'Ramesh Kumar',
      fatherName: 'Mahesh Kumar',
      district: 'District A',
      thana: 'Thana 1',
      mouja: 'Mouja A',
      totalKhatas: 3,
      totalPlots: 7,
      totalOwnedArea: 2.75,
    },
    lands: [
      {
        district: 'District A',
        thana: 'Thana 1',
        mouja: 'Mouja A',
        khataNo: '101',
        plotNo: '125',
        landType: 'Agricultural',
        totalArea: 1.2,
        share: '1/2',
        ownedArea: 0.6,
        status: 'Active',
      },
      {
        district: 'District A',
        thana: 'Thana 1',
        mouja: 'Mouja A',
        khataNo: '101',
        plotNo: '126',
        landType: 'Agricultural',
        totalArea: 2.0,
        share: '1/2',
        ownedArea: 1.0,
        status: 'Active',
      },
      {
        district: 'District A',
        thana: 'Thana 2',
        mouja: 'Mouja B',
        khataNo: '205',
        plotNo: '301',
        landType: 'Residential',
        totalArea: 0.5,
        share: '1/1',
        ownedArea: 0.5,
        status: 'Active',
      },
      {
        district: 'District B',
        thana: 'Thana 3',
        mouja: 'Mouja C',
        khataNo: '305',
        plotNo: '410',
        landType: 'Agricultural',
        totalArea: 1.3,
        share: '1/2',
        ownedArea: 0.65,
        status: 'Review',
      },
    ],
  },
  o2: {
    details: {
      id: 'OWN-00126',
      name: 'Suresh Kumar',
      fatherName: 'Mahesh Kumar',
      district: 'District A',
      thana: 'Thana 1',
      mouja: 'Mouja A',
      totalKhatas: 1,
      totalPlots: 1,
      totalOwnedArea: 0.6,
    },
    lands: [
      {
        district: 'District A',
        thana: 'Thana 1',
        mouja: 'Mouja A',
        khataNo: '101',
        plotNo: '125',
        landType: 'Agricultural',
        totalArea: 1.2,
        share: '1/2',
        ownedArea: 0.6,
        status: 'Active',
      },
    ],
  },
  o3: {
    details: {
      id: 'OWN-00203',
      name: 'Sunita Devi',
      fatherName: 'Ram Prasad',
      district: 'District A',
      thana: 'Thana 2',
      mouja: 'Mouja B',
      totalKhatas: 2,
      totalPlots: 2,
      totalOwnedArea: 1.15,
    },
    lands: [
      {
        district: 'District A',
        thana: 'Thana 2',
        mouja: 'Mouja B',
        khataNo: '205',
        plotNo: '301',
        landType: 'Residential',
        totalArea: 0.5,
        share: '1/1',
        ownedArea: 0.5,
        status: 'Active',
      },
      {
        district: 'District C',
        thana: 'Thana 4',
        mouja: 'Mouja D',
        khataNo: '410',
        plotNo: '410',
        landType: 'Agricultural',
        totalArea: 0.65,
        share: '1/1',
        ownedArea: 0.65,
        status: 'Active',
      },
    ],
  },
};

export interface SummaryStats {
  totalKhatas: number;
  totalPlots: number;
  totalArea: number;
  totalOwners: number;
}

@Service()
export class LandData {
  getDistricts(): Option[] {
    return DISTRICTS;
  }

  getThanas(districtId: string): Option[] {
    return THANAS[districtId] ?? [];
  }

  getMoujas(thanaId: string): Option[] {
    return MOUJAS[thanaId] ?? [];
  }

  getKhatas(moujaId: string): Option[] {
    return KHATAS[moujaId] ?? [];
  }

  getPlots(khataId: string): Option[] {
    return PLOTS[khataId] ?? [];
  }

  getOwners(plotId: string): Option[] {
    return OWNERS[plotId] ?? [];
  }

  getOwnerDetails(ownerId: string): OwnerDetails | null {
    return OWNER_RECORDS[ownerId]?.details ?? null;
  }

  getOwnerLands(ownerId: string): OwnerLand[] {
    return OWNER_RECORDS[ownerId]?.lands ?? [];
  }

  getSummaryStats(): SummaryStats {
    return { totalKhatas: 12, totalPlots: 27, totalArea: 8.42, totalOwners: 8 };
  }
}
