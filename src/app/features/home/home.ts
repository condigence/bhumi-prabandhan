import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth/auth';
import { AnshdaarSummary, KhesaraRecord, LandData } from '../../core/land/land-data';

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

function buildPieSlices(summary: AnshdaarSummary[], total: number): PieSlice[] {
  let cumulativeAngle = 0;

  return summary.map((entry) => {
    const percent = (entry.totalRakba / total) * 100;
    const sliceAngle = (entry.totalRakba / total) * 360;
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
  imports: [FormsModule, DecimalPipe],
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
  readonly anshdaarBreakdown = signal(this.landData.getAnshdaarRakbaBreakdown());
  readonly khesaraRecords = signal<KhesaraRecord[]>(this.landData.getKhesaraRecords());
  readonly khataNos = signal<string[]>(this.landData.getKhataNos());
  readonly anshdaarNames = signal<string[]>(this.landData.getAnshdaarNames());
  readonly totalRakba = signal(this.landData.getTotalRakba());

  readonly selectedKhataNo = signal('');
  readonly selectedAnshdaar = signal<string | null>(null);

  readonly filteredKhesaraRecords = computed<KhesaraRecord[]>(() => {
    const khataNo = this.selectedKhataNo();
    const anshdaar = this.selectedAnshdaar();
    let records = this.khesaraRecords();
    if (khataNo) {
      records = records.filter((r) => r.khataNo === khataNo);
    }
    if (anshdaar) {
      records = records.filter((r) => r.dakhal.some((d) => d.name === anshdaar));
    }
    return records;
  });

  readonly filteredTotalRakba = computed<number>(() =>
    this.filteredKhesaraRecords().reduce((sum, r) => sum + r.rakba, 0),
  );

  readonly selectedAnshdaarShareTotal = computed<number>(() => {
    const anshdaar = this.selectedAnshdaar();
    if (!anshdaar) {
      return 0;
    }
    return this.filteredKhesaraRecords().reduce((sum, r) => {
      const share = r.dakhal.find((d) => d.name === anshdaar)?.share ?? 0;
      return sum + share;
    }, 0);
  });

  readonly breakdownTotalRakba = computed<number>(() =>
    this.anshdaarBreakdown().reduce((sum, a) => sum + a.totalRakba, 0),
  );

  readonly pieSlices = computed<PieSlice[]>(() =>
    buildPieSlices(this.anshdaarBreakdown(), this.breakdownTotalRakba()),
  );

  onKhataNoChange(value: string): void {
    this.selectedKhataNo.set(value);
  }

  onAnshdaarChange(value: string): void {
    this.selectedAnshdaar.set(value || null);
  }

  resetKhataFilter(): void {
    this.selectedKhataNo.set('');
    this.selectedAnshdaar.set(null);
  }

  toggleAnshdaar(name: string): void {
    this.selectedAnshdaar.update((current) => (current === name ? null : name));
  }

  clearAnshdaarFilter(): void {
    this.selectedAnshdaar.set(null);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
