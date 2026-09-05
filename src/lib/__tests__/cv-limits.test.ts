import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PDF_DATA_URI_PREFIX, MAX_PDF_BYTES, startsWithPdfMagic, estimateBase64Bytes } from '../cv-limits.ts';

describe('cv-limits', () => {
  it('accetta solo data URI PDF base64 (quelli di FileReader)', () => {
    assert.equal(PDF_DATA_URI_PREFIX, 'data:application/pdf;base64,');
    assert.equal('data:application/pdf;base64,JVBERi0xLjQ='.startsWith(PDF_DATA_URI_PREFIX), true);
    assert.equal('https://evil.example/cv.pdf'.startsWith(PDF_DATA_URI_PREFIX), false);
    assert.equal('data:image/png;base64,iVBORw0KGgo='.startsWith(PDF_DATA_URI_PREFIX), false);
  });

  it('il tetto e 10MB', () => {
    assert.equal(MAX_PDF_BYTES, 10 * 1024 * 1024);
    assert.equal(estimateBase64Bytes('A'.repeat(100)), 75);
  });

  it('riconosce i magic bytes %PDF-', () => {
    // "%PDF-1.4" in base64
    assert.equal(startsWithPdfMagic('JVBERi0xLjQK'), true);
    assert.equal(startsWithPdfMagic('aGVsbG8gd29ybGQ='), false);
    assert.equal(startsWithPdfMagic(''), false);
  });
});
