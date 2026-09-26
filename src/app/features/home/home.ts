import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth/auth';
import {
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
  readonly khataDharakList = signal(this.landData.getKhataDharakList());
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
  readonly selectedAnshdaar = signal<string | null>(null);
  readonly selectedKhesaraNo = signal('');

  readonly khataNos = computed<string[]>(
    () => this.khatiyan()?.khata.map((k) => String(k.khata_number)) ?? [],
  );

  /** Raiyat of the selected Khata (all Khata when none selected), plus OTHERS when they hold Dakhal. */
  readonly anshdaarNames = computed<string[]>(() => {
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

  /** Khesara / Plot numbers under the selected Khata and Raiyat. */
  readonly khesaraNos = computed<string[]>(() => {
    const anshdaar = this.selectedAnshdaar();
    const plots = this.plotsForKhata(this.selectedKhataNo()).filter(
      (p) => !anshdaar || hasDakhalShare(p, anshdaar),
    );
    return [...new Set(plots.map((p) => String(p.khesara_no)))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  });

  readonly filteredKhataPlots = computed<KhataPlot[]>(() => {
    const anshdaar = this.selectedAnshdaar();
    const khesaraNo = this.selectedKhesaraNo();
    return this.plotsForKhata(this.selectedKhataNo()).filter(
      (p) =>
        (!khesaraNo || String(p.khesara_no) === khesaraNo) &&
        (!anshdaar || hasDakhalShare(p, anshdaar)),
    );
  });

  readonly filteredTotalRakba = computed<number>(() =>
    this.filteredKhataPlots().reduce((sum, p) => sum + numberOrZero(p.totalRakabaDecimal), 0),
  );

  readonly selectedAnshdaarShareTotal = computed<number>(() => {
    const anshdaar = this.selectedAnshdaar();
    if (!anshdaar) {
      return 0;
    }
    return this.filteredKhataPlots().reduce((sum, p) => {
      const share = p.dakhal.find((d) => d.name === anshdaar)?.share ?? 0;
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
    const anshdaar = this.selectedAnshdaar();
    if (anshdaar && !this.anshdaarNames().includes(anshdaar)) {
      this.selectedAnshdaar.set(null);
    }
    this.dropStaleKhesara();
  }

  onKhesaraNoChange(value: string): void {
    this.selectedKhesaraNo.set(value);
  }

  onAnshdaarChange(value: string): void {
    this.selectedAnshdaar.set(value || null);
    this.dropStaleKhesara();
  }

  resetKhataFilter(): void {
    this.selectedKhataNo.set('');
    this.selectedAnshdaar.set(null);
    this.selectedKhesaraNo.set('');
  }

  toggleAnshdaar(name: string): void {
    this.selectedAnshdaar.update((current) => (current === name ? null : name));
    this.dropStaleKhesara();
  }

  clearAnshdaarFilter(): void {
    this.selectedAnshdaar.set(null);
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
