import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Halka, LandLocation, Mouja } from '../../../core/land/land-location';

export interface LocationSelection {
  district: string;
  anchal: string;
  halka: Halka | null;
  mouja: Mouja | null;
}

@Component({
  imports: [FormsModule],
  selector: 'app-location-filter',
  styleUrl: './location-filter.scss',
  templateUrl: './location-filter.html',
})
export class LocationFilter {
  private readonly landLocation = inject(LandLocation);

  readonly locationChange = output<LocationSelection | null>();

  readonly districts = signal(this.landLocation.getDistricts());

  readonly selectedDistrict = signal('');
  readonly selectedAnchal = signal('');
  readonly selectedHalkaNumber = signal('');
  readonly selectedMoujaNumber = signal('');

  /** Halka / Mouja stay locked until Jila + Anchal are confirmed with Proceed. */
  readonly proceeded = signal(false);

  readonly anchals = computed(() =>
    this.selectedDistrict() ? this.landLocation.getAnchals(this.selectedDistrict()) : [],
  );

  readonly halkas = computed(() =>
    this.proceeded()
      ? this.landLocation.getHalkas(this.selectedDistrict(), this.selectedAnchal())
      : [],
  );

  readonly selectedHalka = computed<Halka | null>(
    () => this.halkas().find((h) => String(h.halka_number) === this.selectedHalkaNumber()) ?? null,
  );

  readonly moujas = computed(() => {
    const halka = this.selectedHalka();
    return halka
      ? this.landLocation.getMoujas(this.selectedDistrict(), this.selectedAnchal(), halka.halka_name)
      : [];
  });

  readonly selectedMouja = computed<Mouja | null>(
    () => this.moujas().find((m) => String(m.mouja_number) === this.selectedMoujaNumber()) ?? null,
  );

  readonly canProceed = computed(
    () => !!this.selectedDistrict() && !!this.selectedAnchal() && !this.proceeded(),
  );

  readonly halkaInfo = computed(() => {
    const halka = this.selectedHalka();
    if (!halka) {
      return 'Select a Halka to list its Moujas';
    }
    const count = this.moujas().length;
    return `Halka No. ${halka.halka_number} · ${halka.halka_name} · Total Moujas: ${count}`;
  });

  onDistrictChange(value: string): void {
    this.selectedDistrict.set(value);
    this.selectedAnchal.set('');
    this.clearHalkaAndMouja();
  }

  onAnchalChange(value: string): void {
    this.selectedAnchal.set(value);
    this.clearHalkaAndMouja();
  }

  onHalkaChange(value: string): void {
    this.selectedHalkaNumber.set(value);
    this.selectedMoujaNumber.set('');
    this.emit();
  }

  onMoujaChange(value: string): void {
    this.selectedMoujaNumber.set(value);
    this.emit();
  }

  proceed(): void {
    if (!this.canProceed()) {
      return;
    }
    this.proceeded.set(true);
    this.emit();
  }

  reset(): void {
    this.selectedDistrict.set('');
    this.selectedAnchal.set('');
    this.clearHalkaAndMouja();
  }

  private clearHalkaAndMouja(): void {
    const wasActive = this.proceeded();
    this.proceeded.set(false);
    this.selectedHalkaNumber.set('');
    this.selectedMoujaNumber.set('');
    if (wasActive) {
      this.locationChange.emit(null);
    }
  }

  private emit(): void {
    this.locationChange.emit({
      district: this.selectedDistrict(),
      anchal: this.selectedAnchal(),
      halka: this.selectedHalka(),
      mouja: this.selectedMouja(),
    });
  }
}
