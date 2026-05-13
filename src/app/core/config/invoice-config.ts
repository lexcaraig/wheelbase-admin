/**
 * Invoice configuration — appears on every generated PDF invoice.
 *
 * 👉 EDIT THIS FILE with your real banking details before sending an
 *    invoice to a real customer. The placeholders below WILL appear
 *    on the PDF if left unchanged.
 *
 * Single source of truth so we don't drift across templates.
 */

export interface InvoicePaymentMethod {
  label: string;            // e.g. "Bank Transfer" | "GCash"
  details: string;          // e.g. "BPI · 1234-5678-90"
  accountName: string;      // e.g. "Co+Lab Digital Solutions"
}

export interface InvoiceConfig {
  issuer: {
    name: string;
    legalName?: string;
    address?: string;
    email: string;
    website?: string;
    tin?: string;
  };
  paymentMethods: InvoicePaymentMethod[];
  /** Email merchants send payment proof to. Appears on the invoice. */
  paymentProofEmail: string;
  /** General partnership inquiries email. Appears on the invoice footer. */
  contactEmail: string;
  /** Days a merchant has to pay before the invoice is overdue. */
  paymentTermDays: number;
  /** Hex color used for the header band. Use Wheelbase yellow. */
  brandColor: string;
}

export const INVOICE_CONFIG: InvoiceConfig = {
  issuer: {
    name: 'Wheelbase',
    legalName: 'Co+Lab Digital Solutions',
    address: '[FILL IN: Co+Lab Digital Solutions registered address]',
    email: 'partnerships@ridewheelbase.app',
    website: 'https://www.ridewheelbase.app',
    tin: undefined, // Add when you register for VAT
  },

  // 👉 REPLACE THESE PLACEHOLDERS BEFORE SENDING A REAL INVOICE 👈
  paymentMethods: [
    {
      label: 'Bank Transfer',
      details: '[FILL IN: BANK NAME] · Account [FILL IN: ACCOUNT NUMBER]',
      accountName: '[FILL IN: ACCOUNT HOLDER NAME]',
    },
    {
      label: 'GCash',
      details: '[FILL IN: 09XX-XXX-XXXX]',
      accountName: '[FILL IN: ACCOUNT HOLDER NAME]',
    },
    {
      label: 'PayMaya',
      details: '[FILL IN: 09XX-XXX-XXXX]',
      accountName: '[FILL IN: ACCOUNT HOLDER NAME]',
    },
  ],

  paymentProofEmail: 'ridewheelbase@gmail.com',
  contactEmail: 'partnerships@ridewheelbase.app',
  paymentTermDays: 7,
  brandColor: '#FFD535',
};
