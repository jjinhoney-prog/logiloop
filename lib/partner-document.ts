import 'server-only';
import { createHash } from 'node:crypto';
import { safeEqual } from './session';
import { type PartnerView, partnerSummary } from './partner-profile';

// Existing private partnership inquiry storage; no DDL or public table permissions needed.
// Versioned document in note. Only server reads credentials; getInquiries redacts them.
export const PREFIX = 'LOGILOOP_PARTNER_V1\n';
export const LINK_TTL = 30 * 24 * 60 * 60 * 1000;
export interface PartnerDocument extends PartnerView { accessHash: string; expiresAt: number }
export const hashPartnerToken = (token: string) => createHash('sha256').update(token).digest('hex');
export function decodePartnerDocument(note: string): PartnerDocument | null {
  if (!note.startsWith(PREFIX)) return null;
  try {
    const doc = JSON.parse(note.slice(PREFIX.length)) as PartnerDocument;
    return doc.profile && typeof doc.accessHash === 'string' && typeof doc.revision === 'string' ? doc : null;
  } catch { return null; }
}
export function partnerView(doc: PartnerDocument): PartnerView {
  return { profile: doc.profile, stage: doc.stage, revision: doc.revision };
}
export function validPartnerAccess(doc: PartnerDocument, token: string, now = Date.now()) {
  return /^[a-f0-9]{64}$/.test(token) && doc.expiresAt > now && safeEqual(doc.accessHash, hashPartnerToken(token));
}

export function redactPartnerNote(note: string) {
  const doc = decodePartnerDocument(note);
  return doc ? { note: partnerSummary(doc.profile), partner: { ...partnerView(doc), review: doc.review } } : { note };
}
