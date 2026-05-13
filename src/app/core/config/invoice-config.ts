/**
 * Invoice configuration — appears on every generated PDF invoice/contract.
 *
 * Single source of truth so we don't drift across templates.
 */

export interface InvoicePaymentMethod {
  label: string;            // e.g. "GoTyme"
  details: string;          // e.g. "Account 017235060671"
  accountName: string;      // e.g. "MIGUEL LORENZO SANTOS"
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
    address: 'Axis Residences, Pioneer St., Brgy. Barangka Ilaya, Mandaluyong City, 1550',
    email: 'ridewheelbase@gmail.com',
    website: 'https://www.ridewheelbase.app',
    tin: undefined,
  },

  paymentMethods: [
    {
      label: 'GoTyme',
      details: 'Account 017235060671',
      accountName: 'MIGUEL LORENZO SANTOS',
    },
  ],

  paymentProofEmail: 'ridewheelbase@gmail.com',
  contactEmail: 'ridewheelbase@gmail.com',
  paymentTermDays: 7,
  brandColor: '#FFD535',
};
