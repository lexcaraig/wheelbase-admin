import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { INVOICE_CONFIG } from '../config/invoice-config';

export interface InvoiceLineItem {
  description: string;
  periodLabel?: string;   // e.g. "May 13, 2026 → Aug 13, 2026 (quarterly)"
  quantity?: number;      // defaults to 1
  amountPhp: number;
}

export interface InvoicePayload {
  /** Optional override; auto-generated if absent: INV-YYYYMMDD-<slug>. */
  invoiceNumber?: string;
  issuedAt?: Date;
  dueAt?: Date;

  billTo: {
    businessName: string;
    contactName?: string;
    email?: string;
    address?: string;
  };

  lineItems: InvoiceLineItem[];

  /** Optional internal reference shown small at the bottom (admin notes). */
  internalNotes?: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceGeneratorService {
  /**
   * Build a PDF Blob you can save, preview, or attach to an email.
   * Returns the Blob and the inferred filename so callers can do either.
   */
  generate(payload: InvoicePayload): { blob: Blob; filename: string; invoiceNumber: string } {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;

    const issuedAt = payload.issuedAt ?? new Date();
    const dueAt = payload.dueAt ?? this.addDays(issuedAt, INVOICE_CONFIG.paymentTermDays);
    const invoiceNumber = payload.invoiceNumber ?? this.makeInvoiceNumber(payload.billTo.businessName, issuedAt);

    this.drawHeader(doc, invoiceNumber, pageWidth, margin);
    this.drawIssuerAndBill(doc, payload, issuedAt, dueAt, pageWidth, margin);
    const tableEndY = this.drawLineItemsTable(doc, payload, margin, pageWidth);
    const paymentEndY = this.drawPaymentMethods(doc, tableEndY + 20, margin);
    this.drawInstructions(doc, paymentEndY + 16, margin, dueAt);
    this.drawFooter(doc, payload, margin);

    const blob = doc.output('blob');
    const filename = `invoice-${this.slug(payload.billTo.businessName)}-${this.dateStamp(issuedAt)}.pdf`;
    return { blob, filename, invoiceNumber };
  }

  /** Download in the user's browser. */
  download(payload: InvoicePayload): { invoiceNumber: string; filename: string } {
    const { blob, filename, invoiceNumber } = this.generate(payload);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { invoiceNumber, filename };
  }

  // -------- internals --------

  private drawHeader(doc: jsPDF, invoiceNumber: string, pageWidth: number, margin: number): void {
    // Yellow band across the top
    doc.setFillColor(INVOICE_CONFIG.brandColor);
    doc.rect(0, 0, pageWidth, 60, 'F');

    // Brand name on the left
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(INVOICE_CONFIG.issuer.name, margin, 38);

    // INVOICE label + number on the right
    doc.setFontSize(20);
    const invoiceLabel = 'INVOICE';
    const invLabelWidth = doc.getTextWidth(invoiceLabel);
    doc.text(invoiceLabel, pageWidth - margin - invLabelWidth, 30);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const numWidth = doc.getTextWidth(invoiceNumber);
    doc.text(invoiceNumber, pageWidth - margin - numWidth, 48);
  }

  private drawIssuerAndBill(
    doc: jsPDF,
    payload: InvoicePayload,
    issuedAt: Date,
    dueAt: Date,
    pageWidth: number,
    margin: number
  ): void {
    const topY = 92;
    doc.setTextColor(20, 20, 20);

    // Dates (left column)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Issued', margin, topY);
    doc.text('Due', margin + 90, topY);
    doc.setFont('helvetica', 'normal');
    doc.text(this.fmtDate(issuedAt), margin, topY + 14);
    doc.text(this.fmtDate(dueAt), margin + 90, topY + 14);

    // Issuer (left, below dates)
    const issuerY = topY + 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('FROM', margin, issuerY);

    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(INVOICE_CONFIG.issuer.legalName || INVOICE_CONFIG.issuer.name, margin, issuerY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let line = issuerY + 28;
    if (INVOICE_CONFIG.issuer.address) {
      doc.text(INVOICE_CONFIG.issuer.address, margin, line);
      line += 12;
    }
    doc.text(INVOICE_CONFIG.issuer.email, margin, line);
    if (INVOICE_CONFIG.issuer.website) {
      line += 12;
      doc.text(INVOICE_CONFIG.issuer.website, margin, line);
    }
    if (INVOICE_CONFIG.issuer.tin) {
      line += 12;
      doc.text(`TIN: ${INVOICE_CONFIG.issuer.tin}`, margin, line);
    }

    // Bill To (right column)
    const billToX = pageWidth / 2 + 30;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('BILL TO', billToX, issuerY);

    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(payload.billTo.businessName, billToX, issuerY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let billLine = issuerY + 28;
    if (payload.billTo.contactName) {
      doc.text(`Attn: ${payload.billTo.contactName}`, billToX, billLine);
      billLine += 12;
    }
    if (payload.billTo.email) {
      doc.text(payload.billTo.email, billToX, billLine);
      billLine += 12;
    }
    if (payload.billTo.address) {
      doc.text(payload.billTo.address, billToX, billLine);
    }
  }

  private drawLineItemsTable(doc: jsPDF, payload: InvoicePayload, margin: number, pageWidth: number): number {
    const startY = 230;
    const body = payload.lineItems.map((item) => [
      this.formatDescription(item),
      String(item.quantity ?? 1),
      this.fmtPhp(item.amountPhp),
    ]);

    const total = payload.lineItems.reduce((sum, item) => sum + item.amountPhp * (item.quantity ?? 1), 0);

    autoTable(doc, {
      startY,
      head: [['Description', 'Qty', 'Amount']],
      body,
      foot: [['', 'TOTAL DUE', this.fmtPhp(total)]],
      headStyles: {
        fillColor: [40, 40, 40],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 10, cellPadding: { top: 8, right: 8, bottom: 8, left: 8 } },
      footStyles: {
        fillColor: [245, 245, 245],
        textColor: 20,
        fontStyle: 'bold',
        fontSize: 11,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 50, halign: 'center' },
        2: { cellWidth: 90, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      theme: 'plain',
    });

    return (doc as any).lastAutoTable.finalY as number;
  }

  private drawPaymentMethods(doc: jsPDF, startY: number, margin: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('PAYMENT METHODS', margin, startY);

    let y = startY + 14;
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    for (const method of INVOICE_CONFIG.paymentMethods) {
      doc.setFont('helvetica', 'bold');
      doc.text(method.label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(method.details, margin + 80, y);
      doc.setTextColor(120, 120, 120);
      doc.text(`(${method.accountName})`, margin + 80, y + 11);
      doc.setTextColor(20, 20, 20);
      y += 26;
    }
    return y;
  }

  private drawInstructions(doc: jsPDF, startY: number, margin: number, dueAt: Date): void {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('INSTRUCTIONS', margin, startY);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const lines = [
      `1. Pay within ${INVOICE_CONFIG.paymentTermDays} days (by ${this.fmtDate(dueAt)}).`,
      `2. Email proof of payment to: ${INVOICE_CONFIG.paymentProofEmail}`,
      `3. Access activates within 24 hours of payment confirmation.`,
    ];
    let y = startY + 14;
    for (const line of lines) {
      doc.text(line, margin, y);
      y += 14;
    }
  }

  private drawFooter(doc: jsPDF, payload: InvoicePayload, margin: number): void {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');

    if (payload.internalNotes) {
      doc.text(`Ref: ${payload.internalNotes}`, margin, pageHeight - 60);
    }
    doc.text(
      `Questions? ${INVOICE_CONFIG.contactEmail}`,
      margin,
      pageHeight - 40
    );
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for partnering with Wheelbase.', margin, pageHeight - 26);
  }

  // -------- helpers --------

  private makeInvoiceNumber(businessName: string, issuedAt: Date): string {
    const stamp = this.dateStamp(issuedAt);
    const slug = this.slug(businessName).slice(0, 12).toUpperCase();
    return `INV-${stamp}-${slug}`;
  }

  private slug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private dateStamp(date: Date): string {
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  }

  private fmtDate(date: Date): string {
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  private fmtPhp(value: number): string {
    // jsPDF's default Helvetica encoding doesn't include the peso glyph (renders as "±"),
    // so we spell out "PHP" instead.
    const amount = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `PHP ${amount}`;
  }

  private formatDescription(item: InvoiceLineItem): string {
    // Strip any characters not present in WinAnsi (jsPDF default encoding) — they
    // render as garbage glyphs. Em-dash and basic ASCII are safe.
    const safe = (s: string) => s.replace(/→/g, '-').replace(/₱/g, 'PHP ');
    return item.periodLabel
      ? `${safe(item.description)}\n${safe(item.periodLabel)}`
      : safe(item.description);
  }
}
