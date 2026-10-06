import 'server-only';
import type { NormalizedInquiry } from './inquiry-email';
import { db } from './supabase';
import type { InquiryRecord, InquiryStage, MailStatus, TierId } from './types';

interface InquiryRow {
  id: number;
  kind: InquiryRecord['kind'];
  tier: TierId;
  help: string;
  company: string;
  name: string;
  phone: string;
  item: string;
  volume: string;
  region: string;
  region_detail: string;
  timing: string;
  temperature: string;
  note: string;
  source: string;
  stage: InquiryStage;
  owner: string;
  next_action: string;
  mail_status: MailStatus;
  created_at: string;
  inquiry_listings: { listing_id: string; listings: { name: string } | null }[];
}

/** 상담 1건과 검토 후보 연결을 저장하고 접수번호를 돌려준다. 실패하면 예외를 던진다. */
export async function saveInquiry({ data, partnership, targetIds }: NormalizedInquiry, receivedAt: Date): Promise<number> {
  const { data: row, error } = await db()
    .from('inquiries')
    .insert({
      kind: partnership ? 'partnership' : 'consultation',
      tier: data.tier,
      help: data.help,
      company: data.company,
      name: data.name,
      phone: data.phone,
      item: data.item,
      volume: data.volume,
      region: data.region,
      region_detail: data.regionDetail,
      timing: data.timing,
      temperature: data.temperature,
      note: data.note,
      source: data.source,
      consent_at: receivedAt.toISOString(),
      created_at: receivedAt.toISOString(),
      updated_at: receivedAt.toISOString(),
    })
    .select('id')
    .single();
  if (error) throw new Error(`inquiry insert failed: ${error.code ?? ''} ${error.message}`);
  const id = (row as { id: number }).id;

  if (targetIds.length) {
    // 연결 저장이 실패해도 상담 본문은 이미 저장됐으므로 접수는 유지한다(메일에 후보 이름이 남는다).
    const links = await db()
      .from('inquiry_listings')
      .insert(targetIds.map((listing_id) => ({ inquiry_id: id, listing_id })));
    if (links.error) console.error('[inquiries] link insert failed', links.error.code ?? '', links.error.message);
  }
  return id;
}

export async function setMailStatus(id: number, status: MailStatus) {
  const { error } = await db().from('inquiries').update({ mail_status: status }).eq('id', id);
  if (error) console.error('[inquiries] mail status update failed', error.code ?? '', error.message);
}

// ── 관리자 화면: 호출하는 쪽에서 관리자 권한을 먼저 확인한다. ──

export async function getInquiries(limit = 200): Promise<InquiryRecord[]> {
  const { data, error } = await db()
    .from('inquiries')
    .select(
      'id,kind,tier,help,company,name,phone,item,volume,region,region_detail,timing,temperature,note,source,stage,owner,next_action,mail_status,created_at,inquiry_listings(listing_id,listings(name))',
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[inquiries] select failed', error.code ?? '', error.message);
    throw new Error('상담 목록을 불러오지 못했습니다.');
  }
  return (data as unknown as InquiryRow[]).map((row) => ({
    id: row.id,
    kind: row.kind,
    tier: row.tier,
    help: row.help,
    company: row.company,
    name: row.name,
    phone: row.phone,
    item: row.item,
    volume: row.volume,
    region: row.region,
    regionDetail: row.region_detail,
    timing: row.timing,
    temperature: row.temperature,
    note: row.note,
    source: row.source,
    stage: row.stage,
    owner: row.owner,
    nextAction: row.next_action,
    mailStatus: row.mail_status,
    createdAt: row.created_at,
    listings: row.inquiry_listings.map((link) => ({ id: link.listing_id, name: link.listings?.name ?? link.listing_id })),
  }));
}

export async function updateInquiry(id: number, patch: { stage: InquiryStage; owner: string; nextAction: string }): Promise<boolean> {
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from('inquiries')
    .update({ stage: patch.stage, owner: patch.owner, next_action: patch.nextAction, closed_at: patch.stage === '종결' ? now : null, updated_at: now })
    .eq('id', id)
    .select('id');
  if (error) {
    console.error('[inquiries] update failed', error.code ?? '', error.message);
    throw new Error('상담 상태를 저장하지 못했습니다.');
  }
  return data.length > 0;
}
