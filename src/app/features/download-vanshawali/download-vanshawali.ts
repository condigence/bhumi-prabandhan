import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import referenceTemplateData from '../../core/land/data/Vanshawali-template.json';
import {
  VanshawaliFormEntry,
  VanshawaliPerson,
  buildVanshawaliTree,
  downloadTextFile,
  renderVanshawaliSvg,
} from '../../core/land/vanshawali-tree';

const OTHER = '__other__';

const DISTRICT_OPTIONS = ['Nawada', 'Patna', 'Gaya', 'Nalanda', 'Munger', OTHER];
const VILLAGE_OPTIONS = ['Gosaipur', OTHER];
const THANA_OPTIONS = ['Shahpur Patti', OTHER];

interface Draft {
  name: string;
  fatherName: string;
  grandfatherName: string;
  district: string;
  customDistrict: string;
  village: string;
  customVillage: string;
  thana: string;
  customThana: string;
  isAlive: boolean;
  hasChildren: boolean;
  noOfChildren: number;
  parentId: string | null;
}

function emptyDraft(parentId: string | null): Draft {
  return {
    name: '',
    fatherName: '',
    grandfatherName: '',
    district: DISTRICT_OPTIONS[0],
    customDistrict: '',
    village: VILLAGE_OPTIONS[0],
    customVillage: '',
    thana: THANA_OPTIONS[0],
    customThana: '',
    isAlive: true,
    hasChildren: false,
    noOfChildren: 0,
    parentId,
  };
}

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'person'
  );
}

@Component({
  imports: [FormsModule],
  selector: 'app-download-vanshawali',
  styleUrl: './download-vanshawali.scss',
  templateUrl: './download-vanshawali.html',
})
export class DownloadVanshawali {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);

  readonly OTHER = OTHER;
  readonly districtOptions = DISTRICT_OPTIONS;
  readonly villageOptions = VILLAGE_OPTIONS;
  readonly thanaOptions = THANA_OPTIONS;

  readonly referenceTree = referenceTemplateData as unknown as VanshawaliPerson;
  readonly referenceSvg: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
    renderVanshawaliSvg(this.referenceTree, 'Example: Tiwary Vanshawali'),
  );

  readonly treeTitle = signal('My Family Vanshawali');
  readonly uploadedImage = signal<string | null>(null);
  readonly uploadedImageName = signal('');

  readonly entries = signal<VanshawaliFormEntry[]>([]);
  readonly draft = signal<Draft>(emptyDraft(null));

  readonly errorMessage = signal('');
  readonly generatedTree = signal<VanshawaliPerson | null>(null);
  readonly generatedSvgMarkup = signal('');
  readonly generatedSvgSafe = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.generatedSvgMarkup()),
  );

  readonly dependentCounts = computed<Map<string, number>>(() => {
    const counts = new Map<string, number>();
    for (const entry of this.entries()) {
      if (entry.parentId) {
        counts.set(entry.parentId, (counts.get(entry.parentId) ?? 0) + 1);
      }
    }
    return counts;
  });

  readonly canAddPerson = computed(() => this.draft().name.trim().length > 0);

  updateDraft<K extends keyof Draft>(key: K, value: Draft[K]): void {
    this.draft.update((current) => ({ ...current, [key]: value }));
  }

  onHasChildrenChange(value: boolean): void {
    this.draft.update((current) => ({
      ...current,
      hasChildren: value,
      noOfChildren: value ? current.noOfChildren : 0,
    }));
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.uploadedImageName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => this.uploadedImage.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.uploadedImage.set(null);
    this.uploadedImageName.set('');
  }

  addPerson(): void {
    const d = this.draft();
    const name = d.name.trim();
    if (!name) {
      return;
    }

    const existingIds = new Set(this.entries().map((e) => e.id));
    let id = slugify(name);
    let suffix = 2;
    while (existingIds.has(id)) {
      id = `${slugify(name)}-${suffix}`;
      suffix += 1;
    }

    const entry: VanshawaliFormEntry = {
      id,
      name,
      fatherName: d.fatherName.trim(),
      grandfatherName: d.grandfatherName.trim(),
      district: d.district === OTHER ? d.customDistrict.trim() : d.district,
      village: d.village === OTHER ? d.customVillage.trim() : d.village,
      thana: d.thana === OTHER ? d.customThana.trim() : d.thana,
      isAlive: d.isAlive,
      hasChildren: d.hasChildren,
      noOfChildren: d.noOfChildren,
      parentId: this.entries().length === 0 ? null : d.parentId,
    };

    this.entries.update((list) => [...list, entry]);
    this.errorMessage.set('');
    // Default the next entry's parent to the person just added, so typing a
    // chain of descendants (child, grandchild, ...) doesn't need re-picking the parent each time.
    this.draft.set({
      ...emptyDraft(id),
      district: d.district,
      customDistrict: d.customDistrict,
      village: d.village,
      customVillage: d.customVillage,
      thana: d.thana,
      customThana: d.customThana,
    });
  }

  parentName(parentId: string | null): string {
    if (!parentId) {
      return '— Root —';
    }
    return this.entries().find((e) => e.id === parentId)?.name ?? '—';
  }

  canRemove(id: string): boolean {
    return (this.dependentCounts().get(id) ?? 0) === 0;
  }

  removeEntry(id: string): void {
    if (!this.canRemove(id)) {
      return;
    }
    this.entries.update((list) => list.filter((e) => e.id !== id));
    if (this.draft().parentId === id) {
      this.draft.update((current) => ({ ...current, parentId: null }));
    }
  }

  resetAll(): void {
    this.entries.set([]);
    this.draft.set(emptyDraft(null));
    this.errorMessage.set('');
    this.generatedTree.set(null);
    this.generatedSvgMarkup.set('');
  }

  generate(): void {
    this.errorMessage.set('');
    try {
      const tree = buildVanshawaliTree(this.entries());
      this.generatedTree.set(tree);
      this.generatedSvgMarkup.set(
        renderVanshawaliSvg(tree, this.treeTitle().trim() || 'Family Vanshawali'),
      );
    } catch (err) {
      this.generatedTree.set(null);
      this.generatedSvgMarkup.set('');
      this.errorMessage.set(err instanceof Error ? err.message : 'Could not generate the tree.');
    }
  }

  downloadJson(): void {
    const tree = this.generatedTree();
    if (!tree) {
      return;
    }
    downloadTextFile(
      `${slugify(this.treeTitle())}.json`,
      JSON.stringify(tree, null, 2),
      'application/json',
    );
  }

  downloadSvg(): void {
    if (!this.generatedSvgMarkup()) {
      return;
    }
    downloadTextFile(
      `${slugify(this.treeTitle())}.svg`,
      this.generatedSvgMarkup(),
      'image/svg+xml',
    );
  }

  goHome(): void {
    this.router.navigateByUrl('/home');
  }
}
