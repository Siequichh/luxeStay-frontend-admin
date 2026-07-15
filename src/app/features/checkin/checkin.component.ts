import { Component, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import jsQR from 'jsqr';
import { CheckinService } from '../../core/services/checkin.service';
import { BookingResponse } from '../../core/services/booking.service';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule, TagModule, ToastModule, MessageModule],
  providers: [MessageService],
  templateUrl: './checkin.component.html',
})
export class CheckinComponent implements OnDestroy {
  token         = '';
  loading       = signal(false);
  confirming    = signal(false);
  preview       = signal<BookingResponse | null>(null);
  error         = signal('');
  confirmed     = signal(false);
  scanActive    = signal(false);

  private stream?: MediaStream;
  private scanInterval?: ReturnType<typeof setInterval>;

  constructor(
    private checkinService: CheckinService,
    private msgService: MessageService,
  ) {}

  ngOnDestroy(): void {
    this.stopCamera();
  }

  doPreview(): void {
    const input = this.token.trim();
    if (!input) return;
    this.loading.set(true);
    this.error.set('');
    this.preview.set(null);
    this.confirmed.set(false);

    const req$ = input.toUpperCase().startsWith('LXS-')
      ? this.checkinService.previewByRef(input.toUpperCase())
      : this.checkinService.preview(input);

    req$.subscribe({
      next: b  => { this.preview.set(b); this.loading.set(false); },
      error: e => { this.error.set(e.error?.message ?? 'Código no válido o expirado'); this.loading.set(false); },
    });
  }

  doConfirm(): void {
    this.confirming.set(true);
    this.checkinService.confirm(this.token.trim()).subscribe({
      next: b  => {
        this.preview.set(b);
        this.confirmed.set(true);
        this.confirming.set(false);
        this.msgService.add({ severity: 'success', summary: 'Check-in confirmado',
                              detail: `${b.guestName ?? b.guestEmail} registrado en ${b.roomNumber}` });
        this.token = '';
      },
      error: e => {
        this.error.set(e.error?.message ?? 'No se pudo confirmar el check-in');
        this.confirming.set(false);
      },
    });
  }

  reset(): void {
    this.token = ''; this.preview.set(null); this.error.set(''); this.confirmed.set(false);
  }

  async startCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error.set('Tu navegador no tiene acceso a cámara. Ingresa el token o código manualmente.');
      return;
    }
    try {
      // facingMode 'environment' es para móvil (cámara trasera); en PC con una sola cámara
      // (webcam) el navegador la usa igual aunque no exista una cámara "trasera" literal.
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.scanActive.set(true);
      // Espera un tick para que Angular renderice el elemento <video>
      setTimeout(() => this.startScanLoop(), 150);
    } catch {
      this.error.set('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  }

  private startScanLoop(): void {
    const video = document.getElementById('qr-video') as HTMLVideoElement;
    if (!video || !this.stream) return;
    video.srcObject = this.stream;
    video.play();

    // jsQR decodifica desde un canvas — funciona en cualquier navegador con cámara
    // (BarcodeDetector nativo no está disponible en Chrome/Edge de escritorio).
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    this.scanInterval = setInterval(() => {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code?.data) {
        this.token = code.data;
        this.stopCamera();
        this.doPreview();
      }
    }, 300);
  }

  stopCamera(): void {
    clearInterval(this.scanInterval);
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = undefined;
    this.scanActive.set(false);
  }
}
