import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth/auth';
import { LandData, Option, OwnerDetails, OwnerLand } from '../../core/land/land-data';

@Component({
  imports: [FormsModule],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  private readonly auth = inject(Auth);
  private readonly landData = inject(LandData);
  private readonly router = inject(Router);

  readonly mobileNumber = this.auth.mobileNumber;
  readonly stats = signal(this.landData.getSummaryStats());

  readonly districts = signal<Option[]>(this.landData.getDistricts());
  readonly selectedDistrict = signal('');
  readonly selectedThana = signal('');
  readonly selectedMouja = signal('');
  readonly selectedKhata = signal('');
  readonly selectedPlot = signal('');
  readonly selectedOwner = signal('');

  readonly thanas = computed<Option[]>(() =>
    this.selectedDistrict() ? this.landData.getThanas(this.selectedDistrict()) : [],
  );
  readonly moujas = computed<Option[]>(() =>
    this.selectedThana() ? this.landData.getMoujas(this.selectedThana()) : [],
  );
  readonly khatas = computed<Option[]>(() =>
    this.selectedMouja() ? this.landData.getKhatas(this.selectedMouja()) : [],
  );
  readonly plots = computed<Option[]>(() =>
    this.selectedKhata() ? this.landData.getPlots(this.selectedKhata()) : [],
  );
  readonly owners = computed<Option[]>(() =>
    this.selectedPlot() ? this.landData.getOwners(this.selectedPlot()) : [],
  );

  readonly ownerDetails = computed<OwnerDetails | null>(() =>
    this.selectedOwner() ? this.landData.getOwnerDetails(this.selectedOwner()) : null,
  );
  readonly ownerLands = computed<OwnerLand[]>(() =>
    this.selectedOwner() ? this.landData.getOwnerLands(this.selectedOwner()) : [],
  );

  onDistrictChange(value: string): void {
    this.selectedDistrict.set(value);
    this.selectedThana.set('');
    this.selectedMouja.set('');
    this.selectedKhata.set('');
    this.selectedPlot.set('');
    this.selectedOwner.set('');
  }

  onThanaChange(value: string): void {
    this.selectedThana.set(value);
    this.selectedMouja.set('');
    this.selectedKhata.set('');
    this.selectedPlot.set('');
    this.selectedOwner.set('');
  }

  onMoujaChange(value: string): void {
    this.selectedMouja.set(value);
    this.selectedKhata.set('');
    this.selectedPlot.set('');
    this.selectedOwner.set('');
  }

  onKhataChange(value: string): void {
    this.selectedKhata.set(value);
    this.selectedPlot.set('');
    this.selectedOwner.set('');
  }

  onPlotChange(value: string): void {
    this.selectedPlot.set(value);
    this.selectedOwner.set('');
  }

  onOwnerChange(value: string): void {
    this.selectedOwner.set(value);
  }

  resetSearch(): void {
    this.selectedDistrict.set('');
    this.selectedThana.set('');
    this.selectedMouja.set('');
    this.selectedKhata.set('');
    this.selectedPlot.set('');
    this.selectedOwner.set('');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
