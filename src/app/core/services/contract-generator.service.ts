import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { INVOICE_CONFIG } from '../config/invoice-config';

export interface ContractPayload {
  /** Merchant business name. */
  businessName: string;
  /** Authorized signatory on the merchant side. */
  contactName?: string;
  /** Contact email (also goes on the BILL TO of the related invoice). */
  email?: string;
  /** Optional registered/business address of the merchant. */
  address?: string;

  /** Plan description (e.g. "Basic Bundle - 3 Ad Placements + Business Account"). */
  planDescription: string;
  /** Tier label shown on the contract ("Pro" or "Enterprise"). */
  tierLabel: string;
  /** Billing cadence label ("monthly", "quarterly", "annual"). */
  billingPeriod: string;
  /** Total amount due for the period, in PHP. */
  amountPhp: number;
  /** Coverage start. */
  startDate: Date;
  /** Coverage end (when access expires unless renewed). */
  endDate: Date;
  /** Related invoice number for cross-reference. */
  invoiceNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class ContractGeneratorService {
  /** Build a single-page Service Agreement PDF and trigger download. */
  download(payload: ContractPayload): { filename: string } {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;

    let y = this.drawHeader(doc, pageWidth, margin);
    y = this.drawIntro(doc, payload, margin, contentWidth, y + 18);
    y = this.drawParties(doc, payload, margin, contentWidth, y + 16);
    y = this.drawServices(doc, payload, margin, contentWidth, y + 16);
    y = this.drawTerms(doc, payload, margin, contentWidth, y + 16);
    this.drawSignatures(doc, payload, margin, contentWidth, y + 24);
    this.drawFooter(doc, payload, margin);

    const filename = `contract-${this.slug(payload.businessName)}-${this.dateStamp(payload.startDate)}.pdf`;
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { filename };
  }

  // -------- sections --------

  private drawHeader(doc: jsPDF, pageWidth: number, margin: number): number {
    doc.setFillColor(INVOICE_CONFIG.brandColor);
    doc.rect(0, 0, pageWidth, 60, 'F');

    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(INVOICE_CONFIG.issuer.name, margin, 36);

    const label = 'SERVICE AGREEMENT';
    doc.setFontSize(14);
    const w = doc.getTextWidth(label);
    doc.text(label, pageWidth - margin - w, 36);
    return 76;
  }

  private drawIntro(
    doc: jsPDF,
    payload: ContractPayload,
    margin: number,
    width: number,
    y: number
  ): number {
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const dateLabel = `Effective Date: ${this.fmtDate(payload.startDate)}`;
    doc.text(dateLabel, margin, y);

    if (payload.invoiceNumber) {
      const ref = `Invoice Ref: ${payload.invoiceNumber}`;
      const w = doc.getTextWidth(ref);
      doc.text(ref, margin + width - w, y);
    }
    return y + 8;
  }

  private drawParties(
    doc: jsPDF,
    payload: ContractPayload,
    margin: number,
    width: number,
    y: number
  ): number {
    const colWidth = width / 2 - 12;
    const leftX = margin;
    const rightX = margin + colWidth + 24;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('PROVIDER', leftX, y);
    doc.text('CLIENT', rightX, y);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(11);
    doc.text(INVOICE_CONFIG.issuer.legalName || INVOICE_CONFIG.issuer.name, leftX, y + 14);
    doc.text(payload.businessName, rightX, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    let leftLine = y + 28;
    const issuerAddr = INVOICE_CONFIG.issuer.address;
    if (issuerAddr) {
      leftLine = this.drawWrapped(doc, issuerAddr, leftX, leftLine, colWidth);
    }
    doc.text(INVOICE_CONFIG.issuer.email, leftX, leftLine);
    leftLine += 12;
    if (INVOICE_CONFIG.issuer.website) {
      doc.text(INVOICE_CONFIG.issuer.website, leftX, leftLine);
      leftLine += 12;
    }

    let rightLine = y + 28;
    if (payload.contactName) {
      doc.text(`Attn: ${payload.contactName}`, rightX, rightLine);
      rightLine += 12;
    }
    if (payload.email) {
      doc.text(payload.email, rightX, rightLine);
      rightLine += 12;
    }
    if (payload.address) {
      rightLine = this.drawWrapped(doc, payload.address, rightX, rightLine, colWidth);
    }

    return Math.max(leftLine, rightLine);
  }

  private drawServices(
    doc: jsPDF,
    payload: ContractPayload,
    margin: number,
    width: number,
    y: number
  ): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('1. SERVICES', margin, y);

    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const description = `Provider will deliver the "${payload.planDescription}" plan (${payload.tierLabel} tier) to Client for the duration described in Section 2.`;
    return this.drawWrapped(doc, description, margin, y + 14, width);
  }

  private drawTerms(
    doc: jsPDF,
    payload: ContractPayload,
    margin: number,
    width: number,
    y: number
  ): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('2. TERM, FEES & PAYMENT', margin, y);

    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const amount = `PHP ${payload.amountPhp.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    const terms = [
      `a) Term. This Agreement begins on ${this.fmtDate(payload.startDate)} and ends on ${this.fmtDate(payload.endDate)} (${payload.billingPeriod}).`,
      `b) Fee. Client agrees to pay Provider a total of ${amount} for the term above.`,
      `c) Payment. Payment is due within ${INVOICE_CONFIG.paymentTermDays} days of the invoice issue date. Accepted method: ${this.paymentMethodsLine()}. Client emails proof of payment to ${INVOICE_CONFIG.paymentProofEmail}.`,
      `d) Activation. Access activates within 24 hours of payment confirmation.`,
      `e) Renewal. This Agreement does not auto-renew. Renewal requires a new invoice and payment.`,
      `f) Termination. Either party may terminate by written notice. Fees already paid are non-refundable except where required by law.`,
    ];

    let line = y + 14;
    for (const t of terms) {
      line = this.drawWrapped(doc, t, margin, line, width) + 4;
    }
    return line;
  }

  private drawSignatures(
    doc: jsPDF,
    payload: ContractPayload,
    margin: number,
    width: number,
    y: number
  ): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('3. ACCEPTANCE', margin, y);

    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lead = 'By signing below, both parties agree to the terms above. A signed copy emailed to ' +
      `${INVOICE_CONFIG.paymentProofEmail} alongside proof of payment is sufficient acceptance.`;
    let line = this.drawWrapped(doc, lead, margin, y + 14, width) + 24;

    const colWidth = width / 2 - 12;
    const leftX = margin;
    const rightX = margin + colWidth + 24;
    const sigY = line + 24;

    doc.setDrawColor(120, 120, 120);
    doc.line(leftX, sigY, leftX + colWidth, sigY);
    doc.line(rightX, sigY, rightX + colWidth, sigY);

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('PROVIDER (Co+Lab Digital Solutions)', leftX, sigY + 12);
    doc.text('CLIENT', rightX, sigY + 12);

    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.text(payload.businessName, rightX, sigY + 28);
    if (payload.contactName) {
      doc.text(`Name: ${payload.contactName}`, rightX, sigY + 42);
    }
    doc.text('Date: __________________', rightX, sigY + 56);
    doc.text('Date: __________________', leftX, sigY + 56);

    return sigY + 60;
  }

  private drawFooter(doc: jsPDF, _payload: ContractPayload, margin: number): void {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Questions? ${INVOICE_CONFIG.contactEmail}`,
      margin,
      pageHeight - 28
    );
  }

  // -------- helpers --------

  private paymentMethodsLine(): string {
    return INVOICE_CONFIG.paymentMethods
      .map((m) => `${m.label} (${m.details}, ${m.accountName})`)
      .join('; ');
  }

  private drawWrapped(
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number = 12
  ): number {
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      doc.text(line, x, y);
      y += lineHeight;
    }
    return y;
  }

  private fmtDate(date: Date): string {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  private dateStamp(date: Date): string {
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  private slug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
