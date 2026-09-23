import { Service } from '@angular/core';
import anchalHalkaData from './data/anchal-halka-list.json';
import distAnchalData from './data/dist-anchal-list.json';
import halkaMoujaData from './data/halka-mouja-list.json';
import stateDistData from './data/state-dist-List.json';

/**
 * Location hierarchy used by the Jila → Anchal → Halka → Mouja filter.
 * Each JSON file currently holds one record; they are normalised to arrays
 * so more States / Districts / Anchals can be added later without code changes.
 */

export interface Halka {
  halka_number: number;
  halka_name: string;
}

export interface Mouja {
  mouja_number: number;
  mouja_name: string;
  halka_name: string;
  thanaNumber?: string;
  thanaName?: string;
}

interface StateDistRecord {
  state: string;
  district: string[];
}

interface DistAnchalRecord {
  state: string;
  district: string;
  anchals: string[];
}

interface AnchalHalkaRecord {
  state: string;
  district: string;
  anchal: string;
  halkas: Halka[];
}

interface HalkaMoujaRecord {
  state: string;
  district: string;
  anchal: string;
  moujas: Mouja[];
}

function toArray<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data];
}

const STATE_DISTRICTS: StateDistRecord[] = toArray<StateDistRecord>(stateDistData);
const DISTRICT_ANCHALS: DistAnchalRecord[] = toArray<DistAnchalRecord>(distAnchalData);
const ANCHAL_HALKAS: AnchalHalkaRecord[] = toArray<AnchalHalkaRecord>(anchalHalkaData);
const HALKA_MOUJAS: HalkaMoujaRecord[] = toArray<HalkaMoujaRecord>(halkaMoujaData);

@Service()
export class LandLocation {
  getDistricts(): string[] {
    return STATE_DISTRICTS.flatMap((s) => s.district);
  }

  getAnchals(district: string): string[] {
    return DISTRICT_ANCHALS.filter((d) => d.district === district).flatMap((d) => d.anchals);
  }

  getHalkas(district: string, anchal: string): Halka[] {
    return ANCHAL_HALKAS.filter((a) => a.district === district && a.anchal === anchal).flatMap(
      (a) => a.halkas,
    );
  }

  getMoujas(district: string, anchal: string, halkaName: string): Mouja[] {
    return HALKA_MOUJAS.filter((h) => h.district === district && h.anchal === anchal)
      .flatMap((h) => h.moujas)
      .filter((m) => m.halka_name === halkaName);
  }
}
