import 'server-only';
import { WAREHOUSE_SOURCE, warehouseSummary, type WarehouseView } from './warehouse-profile';
export { WAREHOUSE_SOURCE };

// 3PL 등록과 같은 방식: 비공개 inquiries.note에 버전 문서로 저장한다. 토큰 해시는 서버만 읽는다.
export const WAREHOUSE_PREFIX = 'LOGILOOP_WAREHOUSE_V1\n';
export interface WarehouseDocument extends WarehouseView { accessHash: string; expiresAt: number }

export function decodeWarehouseDocument(note: string): WarehouseDocument | null {
  if (!note.startsWith(WAREHOUSE_PREFIX)) return null;
  try {
    const doc = JSON.parse(note.slice(WAREHOUSE_PREFIX.length)) as WarehouseDocument;
    return doc.profile && typeof doc.accessHash === 'string' && typeof doc.revision === 'string' ? doc : null;
  } catch { return null; }
}
export function warehouseView(doc: WarehouseDocument): WarehouseView {
  return { profile: doc.profile, stage: doc.stage, revision: doc.revision };
}
export function redactWarehouseNote(note: string) {
  const doc = decodeWarehouseDocument(note);
  return doc ? { note: warehouseSummary(doc.profile), warehouse: { ...warehouseView(doc), review: doc.review, approval: doc.approval } } : { note };
}
