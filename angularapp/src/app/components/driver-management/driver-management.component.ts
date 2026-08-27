import {
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';

import {
  NgForm
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  Driver
} from '../../models/driver.model';

import {
  DriverService
} from 'src/app/services/driver.service';

import { createWorker } from 'tesseract.js';

@Component({
  selector: 'app-driver-management',
  templateUrl: './driver-management.component.html',
  styleUrls: ['./driver-management.component.css']
})
export class DriverManagementComponent implements OnInit {

  @ViewChild('imageInput')
  imageInput?: ElementRef<HTMLInputElement>;

  driver: Driver = this.createEmptyDriver();

  driverId!: number;

  isEditMode: boolean = false;
  isSubmitting: boolean = false;
  formSubmitted: boolean = false;

  showSuccessModal: boolean = false;

  errorMessage: string = '';
  imageError: string = '';

  // ===== OCR AUTO-FILL (runs from the image upload) =====
  isScanning: boolean = false;
  scanMessage: string = '';
  scanError: string = '';
  autoFilledFields: string[] = [];

  private readonly maximumImageSize: number =
    2 * 1024 * 1024;

  private readonly acceptedImageTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  constructor(
    private driverService: DriverService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.driverId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (this.driverId) {
      this.isEditMode = true;
      this.loadDriverById();
    }
  }

  private createEmptyDriver(): Driver {
    return {
      driverName: '',
      licenseNumber: '',
      experienceYears: 0,
      contactNumber: '',
      availabilityStatus: 'Active',
      address: '',
      vehicleType: '',
      hourlyRate: 0,
      image: ''
    };
  }

  loadDriverById(): void {
    this.errorMessage = '';

    this.driverService
      .getDriverById(this.driverId)
      .subscribe({
        next: (data) => {
          this.driver = {
            ...data,
            availabilityStatus:
              this.normalizeExistingStatus(
                data.availabilityStatus
              )
          };
        },

        error: () => {
          this.errorMessage =
            'Unable to load driver details. Please try again.';
        }
      });
  }

  saveDriver(driverForm: NgForm): void {
    this.formSubmitted = true;
    this.errorMessage = '';

    this.trimDriverValues();

    if (driverForm.invalid) {
      this.markAllControlsTouched(driverForm);

      this.errorMessage =
        'Please correct all highlighted fields before submitting.';

      this.scrollToFirstInvalidField();

      return;
    }

    if (!this.validateDriverValues()) {
      this.scrollToFirstInvalidField();
      return;
    }

    if (this.imageError) {
      this.errorMessage =
        'Please select a valid driver image.';

      return;
    }

    if (this.isEditMode) {
      this.updateDriver();
    } else {
      this.addDriver();
    }
  }

  addDriver(): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.driverService
      .addDriver(this.driver)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccessModal = true;
        },

        error: (error) => {
          this.isSubmitting = false;

          if (error.status === 409) {
            this.errorMessage =
              'A driver with this license or contact number already exists.';
          } else if (error.status === 400) {
            this.errorMessage =
              'The driver information is invalid. Please verify all fields.';
          } else if (error.status === 401) {
            this.errorMessage =
              'Your session has expired. Please log in again.';
          } else {
            this.errorMessage =
              'Failed to add driver. Please try again.';
          }

          this.scrollToTop();
        }
      });
  }

  updateDriver(): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.driverService
      .updateDriver(
        this.driverId,
        this.driver
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccessModal = true;
        },

        error: (error) => {
          this.isSubmitting = false;

          if (error.status === 409) {
            this.errorMessage =
              'Another driver already uses this license or contact number.';
          } else if (error.status === 400) {
            this.errorMessage =
              'The updated driver information is invalid.';
          } else if (error.status === 401) {
            this.errorMessage =
              'Your session has expired. Please log in again.';
          } else {
            this.errorMessage =
              'Failed to update driver. Please try again.';
          }

          this.scrollToTop();
        }
      });
  }

  /* ============================================================
   * IMAGE UPLOAD  →  also auto-scans the license (OCR)
   * ============================================================ */

  onFileSelected(event: Event): void {
    this.imageError = '';
    this.scanError = '';
    this.scanMessage = '';
    this.autoFilledFields = [];

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files && input.files.length > 0
        ? input.files[0]
        : null;

    if (!file) {
      return;
    }

    if (
      !this.acceptedImageTypes.includes(file.type)
    ) {
      this.imageError =
        'Only JPG, PNG and WEBP images are allowed.';

      input.value = '';

      return;
    }

    if (file.size > this.maximumImageSize) {
      this.imageError =
        'Image size must not exceed 2 MB.';

      input.value = '';

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result as string;

      this.driver.image = imageData;
      this.imageError = '';

      // Automatically read license details from the uploaded image
      this.scanLicense(imageData);
    };

    reader.onerror = () => {
      this.imageError =
        'Unable to read the selected image.';

      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  removeImage(
    imageInput?: HTMLInputElement
  ): void {
    this.driver.image = '';
    this.imageError = '';

    this.scanError = '';
    this.scanMessage = '';
    this.autoFilledFields = [];

    if (imageInput) {
      imageInput.value = '';
    }

    if (this.imageInput?.nativeElement) {
      this.imageInput.nativeElement.value = '';
    }
  }

  /* ============================================================
   * OCR — preprocess + recognize + parse
   * ============================================================ */

  private async scanLicense(imageData: string): Promise<void> {
    this.isScanning = true;
    this.scanError = '';
    this.scanMessage = 'Reading license details, please wait...';

    try {
      const processed = await this.preprocessImage(imageData);

      const worker = await createWorker('eng');

      await worker.setParameters({
        tessedit_pageseg_mode: '6' as any,
        preserve_interword_spaces: '1'
      });

      const result = await worker.recognize(processed);
      await worker.terminate();

      const rawText = result?.data?.text || '';

      if (!rawText.trim()) {
        this.scanError =
          'Could not read text. Please use a clearer, straight photo, or enter details manually.';
        return;
      }

      this.autoFillFromText(rawText);

      if (this.autoFilledFields.length > 0) {
        this.scanMessage =
          'Auto-filled: ' +
          this.autoFilledFields.join(', ') +
          '. Please review carefully before saving.';
      } else {
        this.scanError =
          'No clear details were found. Please enter them manually.';
      }
    } catch (error) {
      console.error('OCR error:', error);
      this.scanError =
        'Scanning failed. Please enter the details manually.';
    } finally {
      this.isScanning = false;

      if (this.scanMessage) {
        setTimeout(() => (this.scanMessage = ''), 8000);
      }
    }
  }

  /**
   * Enhances the image for OCR: upscales small images,
   * converts to grayscale and boosts contrast.
   */
  private preprocessImage(imageData: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        const scale = img.width < 1000 ? 2 : 1;

        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageData);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        const contrast = 1.4;
        const intercept = 128 * (1 - contrast);

        for (let i = 0; i < d.length; i += 4) {
          const gray =
            d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;

          let v = gray * contrast + intercept;
          v = v < 0 ? 0 : v > 255 ? 255 : v;

          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => resolve(imageData);
      img.src = imageData;
    });
  }

  /**
   * Extracts Name, License Number and Address from OCR text.
   * Uses a blocklist so header words are never treated as the name.
   */
  private autoFillFromText(text: string): void {
    const cleanText = text.replace(/\r/g, '');
    const upper = cleanText.toUpperCase();

    const lines = cleanText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const blocklist = [
      'INDIA', 'INDIAN', 'UNION', 'DRIVING', 'LICENCE', 'LICENSE',
      'TRANSPORT', 'DEPARTMENT', 'GOVERNMENT', 'GOVT', 'STATE',
      'DOB', 'DATE', 'BIRTH', 'VALID', 'ISSUE', 'AUTHORITY',
      'BLOOD', 'GROUP', 'ADDRESS', 'ADD', 'SON', 'DAUGHTER', 'WIFE',
      'FATHER', 'PIN', 'COV', 'MCWG', 'LMV', 'RTO', 'DL', 'NO',
      'TELANGANA', 'ANDHRA', 'PRADESH', 'KARNATAKA', 'KERALA',
      'MAHARASHTRA', 'TAMIL', 'NADU', 'DELHI', 'GUJARAT', 'RAJASTHAN',
      'PUNJAB', 'HARYANA', 'BIHAR', 'ODISHA', 'BENGAL', 'WEST',
      'HYDERABAD', 'SECUNDERABAD'
    ];

    const looksLikeHeader = (line: string): boolean => {
      const u = line.toUpperCase();
      return blocklist.some((word) => u.includes(word));
    };

    // ---------- LICENSE NUMBER (Indian Driving Licence) ----------
    // Format: SS RR YYYY NNNNNNN  e.g. KA0120200001234
    const dlMatch = upper.match(
      /\b([A-Z]{2}[\s-]?\d{2}[\s-]?\d{4}[\s-]?\d{7})\b/
    );

    if (dlMatch) {
      this.driver.licenseNumber = dlMatch[1]
        .replace(/[\s-]/g, '')
        .toUpperCase()
        .slice(0, 16);

      this.autoFilledFields.push('License Number');
    }

    // ---------- NAME ----------
    let nameCandidate = '';

    const nameIdx = lines.findIndex(
      (l) => /\bNAME\b/i.test(l) && !/FILE|USER/i.test(l)
    );

    if (nameIdx !== -1) {
      const afterColon = lines[nameIdx]
        .split(/name[:\s]*/i)[1]
        ?.trim();

      const candidate =
        afterColon &&
        afterColon.replace(/[^A-Za-z ]/g, '').trim().length >= 3
          ? afterColon
          : (lines[nameIdx + 1] || '');

      if (candidate && !looksLikeHeader(candidate)) {
        nameCandidate = candidate;
      }
    }

    if (!nameCandidate) {
      nameCandidate =
        lines.find(
          (l) =>
            /^[A-Za-z][A-Za-z\s.]{4,40}$/.test(l) &&
            !looksLikeHeader(l) &&
            l.split(' ').length <= 4
        ) || '';
    }

    if (nameCandidate) {
      const lettersOnly = nameCandidate
        .replace(/[^A-Za-z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (lettersOnly.length >= 3 && !looksLikeHeader(lettersOnly)) {
        this.driver.driverName = lettersOnly
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .slice(0, 50);

        this.autoFilledFields.push('Driver Name');
      }
    }

    // ---------- ADDRESS ----------
    const addrIdx = lines.findIndex((l) => /ADD?R|ADDRESS/i.test(l));

    if (addrIdx !== -1) {
      const addrText = lines
        .slice(addrIdx, addrIdx + 3)
        .join(', ')
        .replace(/ADD?R(ESS)?[:\s]*/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (addrText.length >= 10) {
        this.driver.address = addrText.slice(0, 250);
        this.autoFilledFields.push('Address');
      }
    }
  }

  /* ============================================================ */

  allowContactNumbersOnly(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    const numericValue =
      input.value
        .replace(/\D/g, '')
        .slice(0, 10);

    input.value = numericValue;
    this.driver.contactNumber = numericValue;
  }

  formatLicenseNumber(event: Event): void {
    const inputElement =
      event.target as HTMLInputElement;

    const formattedValue =
      inputElement.value
        .toUpperCase()
        .replace(/[^A-Z0-9 -]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/-+/g, '-')
        .slice(0, 16);

    inputElement.value = formattedValue;
    this.driver.licenseNumber = formattedValue;
  }

  preventInvalidNumberKeys(
    event: KeyboardEvent
  ): void {
    const invalidKeys = [
      'e',
      'E',
      '+',
      '-',
      '.',
      ','
    ];

    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  preventInvalidRateKeys(
    event: KeyboardEvent
  ): void {
    const invalidKeys = [
      'e',
      'E',
      '+',
      '-',
      ','
    ];

    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  trimField(
    fieldName:
      | 'driverName'
      | 'licenseNumber'
      | 'address'
  ): void {
    const currentValue =
      String(this.driver[fieldName] || '');

    let trimmedValue =
      currentValue.trim();

    if (fieldName === 'driverName') {
      trimmedValue =
        trimmedValue.replace(/\s+/g, ' ');
    }

    if (fieldName === 'licenseNumber') {
      trimmedValue =
        trimmedValue
          .toUpperCase()
          .replace(/\s+/g, ' ')
          .replace(/-+/g, '-');
    }

    this.driver[fieldName] =
      trimmedValue as never;
  }

  private validateDriverValues(): boolean {
    const driverNamePattern =
      /^[A-Za-z]+(?: [A-Za-z]+)*$/;

    const contactPattern =
      /^[6-9][0-9]{9}$/;

    // Indian Driving Licence:  SS RR YYYY NNNNNNN  (e.g. KA0120200001234)
    const licensePattern =
      /^[A-Z]{2}[0-9]{2}[ -]?[0-9]{4}[ -]?[0-9]{7}$/;

    if (
      !driverNamePattern.test(
        this.driver.driverName
      )
    ) {
      this.errorMessage =
        'Driver name must contain letters and single spaces only.';

      return false;
    }

    if (
      !contactPattern.test(
        this.driver.contactNumber
      )
    ) {
      this.errorMessage =
        'Enter a valid 10-digit Indian mobile number.';

      return false;
    }

    if (
      !licensePattern.test(
        this.driver.licenseNumber
      )
    ) {
      this.errorMessage =
        'Enter a valid Indian driving licence number such as KA0120200001234.';

      return false;
    }

    if (
      Number(this.driver.experienceYears) < 0 ||
      Number(this.driver.experienceYears) > 50 ||
      !Number.isInteger(
        Number(this.driver.experienceYears)
      )
    ) {
      this.errorMessage =
        'Experience must be a whole number between 0 and 50.';

      return false;
    }

    if (
      this.driver.address.trim().length < 10 ||
      this.driver.address.trim().length > 250
    ) {
      this.errorMessage =
        'Address must contain between 10 and 250 characters.';

      return false;
    }

    if (
      Number(this.driver.hourlyRate) < 50 ||
      Number(this.driver.hourlyRate) > 10000
    ) {
      this.errorMessage =
        'Hourly rate must be between ₹50 and ₹10,000.';

      return false;
    }

    const validVehicleTypes = [
      'Sedan',
      'SUV',
      'Bike'
    ];

    if (
      !validVehicleTypes.includes(
        this.driver.vehicleType
      )
    ) {
      this.errorMessage =
        'Please select a valid vehicle type.';

      return false;
    }

    // Aligned with backend + model: Active / Inactive / On Leave
    const validStatuses = [
      'Active',
      'Inactive',
      'On Leave'
    ];

    if (
      !validStatuses.includes(
        this.driver.availabilityStatus
      )
    ) {
      this.errorMessage =
        'Please select a valid availability status.';

      return false;
    }

    return true;
  }

  private trimDriverValues(): void {
    this.driver.driverName =
      String(this.driver.driverName || '')
        .trim()
        .replace(/\s+/g, ' ');

    this.driver.licenseNumber =
      String(this.driver.licenseNumber || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .replace(/-+/g, '-');

    this.driver.contactNumber =
      String(this.driver.contactNumber || '')
        .trim();

    this.driver.address =
      String(this.driver.address || '')
        .trim();

    this.driver.vehicleType =
      String(this.driver.vehicleType || '')
        .trim();

    this.driver.availabilityStatus =
      String(
        this.driver.availabilityStatus || ''
      ).trim();
  }

  private normalizeExistingStatus(
    status: string
  ): string {
    const normalizedStatus =
      String(status || '')
        .trim()
        .toLowerCase();

    if (
      normalizedStatus === 'active' ||
      normalizedStatus === 'available'
    ) {
      return 'Active';
    }

    if (
      normalizedStatus === 'on leave' ||
      normalizedStatus === 'busy'
    ) {
      return 'On Leave';
    }

    if (
      normalizedStatus === 'inactive' ||
      normalizedStatus === 'offline'
    ) {
      return 'Inactive';
    }

    return 'Active';
  }

  private markAllControlsTouched(
    driverForm: NgForm
  ): void {
    Object.keys(
      driverForm.controls
    ).forEach((controlName) => {
      driverForm.controls[
        controlName
      ].markAsTouched();
    });
  }

  private scrollToFirstInvalidField(): void {
    setTimeout(() => {
      const firstInvalidElement =
        document.querySelector(
          '.input-invalid'
        ) as HTMLElement | null;

      if (firstInvalidElement) {
        firstInvalidElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        const input =
          firstInvalidElement.querySelector(
            'input, textarea, select'
          ) as HTMLElement | null;

        input?.focus();
      }
    });
  }

  closeModal(): void {
    this.showSuccessModal = false;

    if (this.isEditMode) {
      this.router.navigate([
        '/admin/drivers'
      ]);

      return;
    }

    this.router.navigate([
      '/admin/drivers'
    ]);
  }

  resetForm(): void {
    this.driver = this.createEmptyDriver();

    this.errorMessage = '';
    this.imageError = '';
    this.formSubmitted = false;

    this.scanError = '';
    this.scanMessage = '';
    this.autoFilledFields = [];

    if (this.imageInput?.nativeElement) {
      this.imageInput.nativeElement.value = '';
    }
  }

  goBack(): void {
    if (this.isSubmitting) {
      return;
    }

    this.router.navigate([
      '/admin/drivers'
    ]);
  }

  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}