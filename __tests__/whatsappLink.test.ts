import {
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
} from '../src/shared/utils/whatsapp';

describe('WhatsApp reminder links', () => {
  it('normalizes common Indian phone formats', () => {
    expect(normalizeWhatsAppPhone('98765 43210')).toBe('919876543210');
    expect(normalizeWhatsAppPhone('098765-43210')).toBe('919876543210');
    expect(normalizeWhatsAppPhone('+91 98765 43210')).toBe('919876543210');
  });

  it('encodes reminder text in a wa.me link', () => {
    expect(buildWhatsAppUrl('+91 98765 43210', 'Fees due: ₹500 & thanks')).toBe(
      'https://wa.me/919876543210?text=Fees%20due%3A%20%E2%82%B9500%20%26%20thanks',
    );
  });

  it('rejects numbers that cannot be addressed by WhatsApp', () => {
    expect(() => buildWhatsAppUrl('1234', 'Hello')).toThrow(
      'Enter a valid phone number for WhatsApp.',
    );
  });
});
