import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

@Injectable({ providedIn: 'root' })
export class ReceiptService {

  generateReceipt(request: any): void {
    const doc = new jsPDF();

    // header
    doc.setFillColor(220, 38, 38); // red
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('DriveU', 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Your Journey, Our Responsibility', 14, 22);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TRIP RECEIPT', 150, 18);

    // receiptinfo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let y = 45;
    const receiptId = request.driverRequestId || request.requestId || 'N/A';
    const date = new Date().toLocaleDateString('en-IN');

    doc.text(`Receipt No: #${receiptId}`, 14, y);
    doc.text(`Date: ${date}`, 150, y);

    // ===== DIVIDER =====
    y += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, 196, y);

    // ===== TRIP DETAILS =====
    y += 12;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('Trip Details', 14, y);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const rows: [string, string][] = [
      ['Driver Name', request.driver?.driverName || 'N/A'],
      ['Vehicle Type', request.driver?.vehicleType || 'N/A'],
      ['Pickup Location', request.pickupLocation || 'N/A'],
      ['Drop Location', request.dropLocation || 'N/A'],
      ['Trip Date', request.tripDate || 'N/A'],
      ['Duration', request.actualDuration || request.estimatedDuration || 'N/A'],
      ['Status', request.status || 'N/A']
    ];

    y += 10;
    rows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${value}`, 70, y);
      y += 9;
    });

    // paymentbox
    y += 5;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y, 182, 20, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Total Amount Paid', 20, y + 13);

    doc.setTextColor(220, 38, 38);
    doc.setFontSize(18);
    const amount = request.paymentAmount ?? 0;
    doc.text(`Rs. ${amount}`, 150, y + 13);

    // footer
    y += 35;
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing DriveU!', 14, y);
    doc.text('This is a computer-generated receipt.', 14, y + 6);

    //download
    doc.save(`DriveU-Receipt-${receiptId}.pdf`);
  }
}