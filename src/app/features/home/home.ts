import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth/auth';
import {
  Anshdar,
  AnshdaarSummary,
  DEFAULT_MOUJA,
  KhataPlot,
  LandData,
  NumberOrNA,
  OTHERS_LABEL,
} from '../../core/land/land-data';
import { LocationFilter, LocationSelection } from './location-filter/location-filter';

interface PieSlice extends AnshdaarSummary {
  percent: number;
  pathD: string;
  labelX: number;
  labelY: number;
  leaderX1: number;
  leaderY1: number;
  leaderX2: number;
  leaderY2: number;
  textAnchor: 'start' | 'end';
  explodeX: number;
  explodeY: number;
}

const CENTER = 120;
const PIE_RADIUS = 80;
const LEADER_INNER_RADIUS = 82;
const LEADER_OUTER_RADIUS = 94;
const LABEL_RADIUS = 98;
const EXPLODE_OFFSET = 8;

function polarToCartesian(radius: number, angleDeg: number): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(angleRad),
    y: CENTER + radius * Math.sin(angleRad),
  };
}

function numberOrZero(value: NumberOrNA): number {
  return value === 'NA' ? 0 : value;
}

/** True when the Raiyat holds a positive Dakhal share on the plot. */
function hasDakhalShare(plot: KhataPlot, name: string): boolean {
  return plot.dakhal.some((d) => d.name === name && d.share !== 'NA' && d.share > 0);
}

function buildPieSlices(summary: AnshdaarSummary[], total: number): PieSlice[] {
  let cumulativeAngle = 0;

  return summary.map((entry) => {
    const percent = total > 0 ? (entry.totalRakba / total) * 100 : 0;
    const sliceAngle = total > 0 ? (entry.totalRakba / total) * 360 : 0;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle = endAngle;

    const start = polarToCartesian(PIE_RADIUS, startAngle);
    const end = polarToCartesian(PIE_RADIUS, endAngle);
    const largeArcFlag = sliceAngle > 180 ? 1 : 0;
    const pathD = `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;

    const midAngle = startAngle + sliceAngle / 2;
    const leaderStart = polarToCartesian(LEADER_INNER_RADIUS, midAngle);
    const leaderEnd = polarToCartesian(LEADER_OUTER_RADIUS, midAngle);
    const label = polarToCartesian(LABEL_RADIUS, midAngle);
    const explode = polarToCartesian(EXPLODE_OFFSET, midAngle);

    return {
      ...entry,
      percent,
      pathD,
      labelX: label.x,
      labelY: label.y,
      leaderX1: leaderStart.x,
      leaderY1: leaderStart.y,
      leaderX2: leaderEnd.x,
      leaderY2: leaderEnd.y,
      textAnchor: label.x < CENTER ? 'end' : 'start',
      explodeX: explode.x - CENTER,
      explodeY: explode.y - CENTER,
    };
  });
}

@Component({
  imports: [FormsModule, DecimalPipe, RouterLink, LocationFilter],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  private readonly auth = inject(Auth);
  private readonly landData = inject(LandData);
  private readonly router = inject(Router);

  readonly mobileNumber = this.auth.mobileNumber;

  readonly moujaInfo = signal(this.landData.getMoujaInfo());
  readonly anshdarList = signal<Anshdar[]>(this.landData.getAnshdarList());
  readonly resultAnshdaarSummary = signal(this.landData.getResultAnshdaarSummary());

  readonly selectedLocation = signal<LocationSelection | null>(null);

  /** Mouja whose Khatiyan drives the Bhumi Vivaran card; falls back to the default until one is picked. */
  readonly selectedMoujaName = computed<string>(
    () => this.selectedLocation()?.mouja?.mouja_name ?? DEFAULT_MOUJA,
  );
  readonly hasLandRecords = computed<boolean>(() =>
    this.landData.hasLandRecords(this.selectedMoujaName()),
  );
  readonly khatiyan = computed(() => this.landData.getMoujaKhatiyan(this.selectedMoujaName()));
  readonly khataPlots = computed<KhataPlot[]>(() =>
    this.landData.getKhataPlots(this.selectedMoujaName()),
  );

  readonly selectedKhataNo = signal('');
  readonly selectedRaiyat = signal<string | null>(null);
  readonly selectedKhesaraNo = signal('');
  readonly selectedAnshdarName = signal('');

  readonly khataNos = computed<string[]>(
    () => this.khatiyan()?.khata.map((k) => String(k.khata_number)) ?? [],
  );

  /** Raiyat of the selected Khata (all Khata when none selected), plus OTHERS when they hold Dakhal. */
  readonly raiyatNames = computed<string[]>(() => {
    const khataNo = this.selectedKhataNo();
    const khata = (this.khatiyan()?.khata ?? []).filter(
      (k) => !khataNo || String(k.khata_number) === khataNo,
    );
    const names = [...new Set(khata.flatMap((k) => k.raiyat_name))];
    const othersHoldDakhal = this.plotsForKhata(khataNo).some((p) =>
      hasDakhalShare(p, OTHERS_LABEL),
    );
    return othersHoldDakhal ? [...names, OTHERS_LABEL] : names;
  });

  /** Anshdar descending from a Raiyat of the selected Khata (all Khata when none selected). */
  readonly anshdarOptions = computed<Anshdar[]>(() => {
    const raiyatNames = this.raiyatNames();
    return this.anshdarList().filter((a) => raiyatNames.includes(a.raiyat));
  });

  readonly selectedAnshdar = computed<Anshdar | null>(
    () => this.anshdarList().find((a) => a.name === this.selectedAnshdarName()) ?? null,
  );

  /**
   * The selected Anshdar's estimated Rakba in the filtered records: their
   * Raiyat's Dakhal share scaled by the Anshdar's part of that Raiyat's Ansh
   * (e.g. Vasudev holds 1/12 of Paramhans' 1/3, so a quarter of it).
   */
  readonly selectedAnshdarEstimatedRakba = computed<number>(() => {
    const anshdar = this.selectedAnshdar();
    const raiyat = anshdar && this.anshdarList().find((a) => a.name === anshdar.raiyat);
    if (!anshdar || !raiyat) {
      return 0;
    }
    const estimate =
      (this.selectedRaiyatShareTotal() * anshdar.share_percentage) / raiyat.share_percentage;
    return Math.round(estimate * 100) / 100;
  });

  /** Khesara / Plot numbers under the selected Khata and Raiyat. */
  readonly khesaraNos = computed<string[]>(() => {
    const raiyat = this.selectedRaiyat();
    const plots = this.plotsForKhata(this.selectedKhataNo()).filter(
      (p) => !raiyat || hasDakhalShare(p, raiyat),
    );
    return [...new Set(plots.map((p) => String(p.khesara_no)))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  });

  readonly filteredKhataPlots = computed<KhataPlot[]>(() => {
    const raiyat = this.selectedRaiyat();
    const khesaraNo = this.selectedKhesaraNo();
    return this.plotsForKhata(this.selectedKhataNo()).filter(
      (p) =>
        (!khesaraNo || String(p.khesara_no) === khesaraNo) &&
        (!raiyat || hasDakhalShare(p, raiyat)),
    );
  });

  readonly filteredTotalRakba = computed<number>(() =>
    this.filteredKhataPlots().reduce((sum, p) => sum + numberOrZero(p.totalRakabaDecimal), 0),
  );

  readonly selectedRaiyatShareTotal = computed<number>(() => {
    const raiyat = this.selectedRaiyat();
    if (!raiyat) {
      return 0;
    }
    return this.filteredKhataPlots().reduce((sum, p) => {
      const share = p.dakhal.find((d) => d.name === raiyat)?.share ?? 0;
      return sum + numberOrZero(share);
    }, 0);
  });

  readonly anshdaarBreakdown = computed<AnshdaarSummary[]>(() =>
    this.landData.getRaiyatRakbaBreakdown(this.khatiyan(), this.khataPlots()),
  );

  readonly breakdownTotalRakba = computed<number>(() =>
    this.anshdaarBreakdown().reduce((sum, a) => sum + a.totalRakba, 0),
  );

  readonly pieSlices = computed<PieSlice[]>(() =>
    buildPieSlices(this.anshdaarBreakdown(), this.breakdownTotalRakba()),
  );

  onLocationChange(location: LocationSelection | null): void {
    this.selectedLocation.set(location);
    this.resetKhataFilter();
  }

  onKhataNoChange(value: string): void {
    this.selectedKhataNo.set(value);
    // Drop Raiyat / Khesara selections that don't exist under the newly chosen Khata.
    const raiyat = this.selectedRaiyat();
    if (raiyat && !this.raiyatNames().includes(raiyat)) {
      this.setRaiyat(null);
    }
    this.dropStaleKhesara();
  }

  onKhesaraNoChange(value: string): void {
    this.selectedKhesaraNo.set(value);
  }

  onRaiyatChange(value: string): void {
    this.setRaiyat(value || null);
    this.dropStaleKhesara();
  }

  /** Picking an Anshdar filters the records to the Raiyat their share descends from. */
  onAnshdarChange(value: string): void {
    this.selectedAnshdarName.set(value);
    const anshdar = this.selectedAnshdar();
    if (anshdar) {
      this.selectedRaiyat.set(anshdar.raiyat);
    }
    this.dropStaleKhesara();
  }

  resetKhataFilter(): void {
    this.selectedKhataNo.set('');
    this.selectedRaiyat.set(null);
    this.selectedKhesaraNo.set('');
    this.selectedAnshdarName.set('');
  }

  toggleRaiyat(name: string): void {
    this.setRaiyat(this.selectedRaiyat() === name ? null : name);
    this.dropStaleKhesara();
  }

  clearRaiyatFilter(): void {
    this.setRaiyat(null);
  }

  clearAnshdarFilter(): void {
    this.selectedAnshdarName.set('');
  }

  /** Dakhal holders with a share on this plot (zero shares hidden, "NA" kept). */
  dakhalHolders(plot: KhataPlot): KhataPlot['dakhal'] {
    return plot.dakhal.filter((d) => d.share === 'NA' || d.share > 0);
  }

  plotNote(plot: KhataPlot): string {
    return [plot.plot_type && `Plot type: ${plot.plot_type}`, plot.landMark, plot.comments]
      .filter(Boolean)
      .join(' · ');
  }

  private plotsForKhata(khataNo: string): KhataPlot[] {
    const plots = this.khataPlots();
    return khataNo ? plots.filter((p) => String(p.khata_number) === khataNo) : plots;
  }

  /** Sets the Raiyat filter, dropping an Anshdar selection that belongs to another Raiyat. */
  private setRaiyat(raiyat: string | null): void {
    this.selectedRaiyat.set(raiyat);
    if (this.selectedAnshdar()?.raiyat !== raiyat) {
      this.selectedAnshdarName.set('');
    }
  }

  private dropStaleKhesara(): void {
    if (!this.khesaraNos().includes(this.selectedKhesaraNo())) {
      this.selectedKhesaraNo.set('');
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
