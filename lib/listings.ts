import 'server-only';
import type { ListingInput } from './listing-form';
import { LISTING_ID_PATTERN } from './logic';
import { seedListings } from './seed-listings';
import { db, isDbConfigured } from './supabase';
import type { AdminListing, Listing, ListingSummary, ListingType, VerificationChecks, Visibility } from './types';

const COLUMNS =
  'id,type,visibility,name,region,province,district,temperature,area,capacity,price,available,status_note,tags,height,power,service,suitability,limitation,checks,lat,lng,sort_order,updated_at,source_url,image_url';

interface ListingRow {
  id: string;
  type: ListingType;
  visibility: Visibility;
  name: string;
  region: string;
  province: string | null;
  district: string;
  temperature: string;
  area: number | null;
  capacity: string;
  price: string;
  available: string;
  status_note: string;
  tags: string[];
  height: string | null;
  power: string | null;
  service: string;
  suitability: string;
  limitation: string;
  checks: string[];
  lat: number;
  lng: number;
  sort_order: number;
  updated_at: string;
  source_url: string | null;
  image_url?: string | null;
}

function toListing(row: ListingRow): Listing {
  const checks = [0, 1, 2, 3].map((i) => row.checks?.[i] ?? '') as VerificationChecks;
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    region: row.region,
    province: row.province ?? undefined,
    district: row.district,
    temperature: row.temperature,
    area: row.area ?? undefined,
    capacity: row.capacity,
    price: row.price,
    available: row.available,
    status: row.status_note,
    tags: row.tags ?? [],
    height: row.height ?? undefined,
    power: row.power ?? undefined,
    service: row.service,
    suitability: row.suitability,
    limitation: row.limitation,
    checks,
    lat: row.lat,
    lng: row.lng,
    sourceUrl: row.source_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

function toRow(input: ListingInput) {
  return {
    type: input.type,
    name: input.name,
    region: input.region,
    province: input.province ?? null,
    district: input.district,
    temperature: input.temperature,
    area: input.area ?? null,
    capacity: input.capacity,
    price: input.price,
    available: input.available,
    status_note: input.status,
    tags: input.tags,
    height: input.height ?? null,
    power: input.power ?? null,
    service: input.service,
    suitability: input.suitability,
    limitation: input.limitation,
    checks: input.checks,
    lat: input.lat,
    lng: input.lng,
    source_url: input.sourceUrl ?? null,
    sort_order: input.sortOrder,
  };
}

// supabase/002_source_url.sql·004_image_url.sql 실행 전 DB에서도 동작하도록, 없는 컬럼은 빼고 다시 요청한다.
const OPTIONAL_COLUMNS = ['image_url', 'source_url'] as const;
const missingColumns = new Set<string>();
const columns = () => COLUMNS.split(',').filter((column) => !missingColumns.has(column)).join(',');
const sourceUrlColumn = () => !missingColumns.has('source_url');

async function withSourceUrlFallback<T extends { error: { code?: string; message: string } | null }>(run: () => PromiseLike<T>): Promise<T> {
  let result = await run();
  for (;;) {
    const { error } = result;
    const missing = error && (error.code === '42703' || error.code === 'PGRST204') ? OPTIONAL_COLUMNS.find((column) => !missingColumns.has(column) && error.message.includes(column)) : undefined;
    if (!missing) return result;
    console.warn(`[listings] ${missing} column missing — run supabase/${missing === 'image_url' ? '004_image_url' : '002_source_url'}.sql`);
    missingColumns.add(missing);
    result = await run();
  }
}

const rowFor = (input: ListingInput) => {
  const row: Record<string, unknown> = toRow(input);
  if (!sourceUrlColumn()) delete row.source_url;
  return row;
};

function fail(action: string, error: { message: string; code?: string }): never {
  console.error(`[listings] ${action} failed`, error.code ?? '', error.message);
  throw new Error(`매물 ${action}에 실패했습니다.`);
}

// ── 공개 화면: published만 조회한다. DB 연결 전에는 예시 7건을 보여준다. ──

export async function getPublicListings(type?: ListingType): Promise<Listing[]> {
  if (!isDbConfigured()) return seedListings.filter((item) => !type || item.type === type);
  const { data, error } = await withSourceUrlFallback(() => {
    let query = db().from('listings').select(columns()).eq('visibility', 'published');
    if (type) query = query.eq('type', type);
    return query.order('sort_order').order('created_at');
  });
  if (error) fail('조회', error);
  return (data as unknown as ListingRow[]).map(toListing);
}

/** 비공개·보관 매물은 URL을 직접 입력해도 찾지 못한다. */
export async function getPublicListing(id: string, type?: ListingType): Promise<Listing | undefined> {
  if (!LISTING_ID_PATTERN.test(id)) return undefined;
  if (!isDbConfigured()) return seedListings.find((item) => item.id === id && (!type || item.type === type));
  const { data, error } = await withSourceUrlFallback(() => {
    let query = db().from('listings').select(columns()).eq('id', id).eq('visibility', 'published');
    if (type) query = query.eq('type', type);
    return query.maybeSingle();
  });
  if (error) fail('조회', error);
  return data ? toListing(data as unknown as ListingRow) : undefined;
}

export async function getPublicSummaries(): Promise<ListingSummary[]> {
  return (await getPublicListings()).map(({ id, name, region, type, temperature }) => ({ id, name, region, type, temperature }));
}

// ── 관리자 화면: 호출하는 쪽에서 관리자 권한을 먼저 확인한다. ──

export async function getAdminListings(): Promise<AdminListing[]> {
  const [listings, links] = await Promise.all([
    withSourceUrlFallback(() => db().from('listings').select(columns()).order('sort_order').order('created_at')),
    db().from('inquiry_listings').select('listing_id'),
  ]);
  if (listings.error) fail('조회', listings.error);
  if (links.error) fail('조회', links.error);
  const counts = new Map<string, number>();
  for (const { listing_id } of links.data as { listing_id: string }[]) counts.set(listing_id, (counts.get(listing_id) ?? 0) + 1);
  return (listings.data as unknown as ListingRow[]).map((row) => ({
    ...toListing(row),
    visibility: row.visibility,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
    inquiryCount: counts.get(row.id) ?? 0,
  }));
}

export async function getAdminListing(id: string): Promise<(Listing & { visibility: Visibility; sortOrder: number }) | undefined> {
  if (!LISTING_ID_PATTERN.test(id)) return undefined;
  const { data, error } = await withSourceUrlFallback(() => db().from('listings').select(columns()).eq('id', id).maybeSingle());
  if (error) fail('조회', error);
  if (!data) return undefined;
  const row = data as unknown as ListingRow;
  return { ...toListing(row), visibility: row.visibility, sortOrder: row.sort_order };
}

/** 신규 매물은 항상 비공개로 등록한다. 이미 있는 ID면 'duplicate'를 돌려준다. */
export async function insertListing(input: ListingInput): Promise<'ok' | 'duplicate'> {
  const { error } = await withSourceUrlFallback(() =>
    db()
      .from('listings')
      .insert({ id: input.id, ...rowFor(input), visibility: 'hidden' }),
  );
  if (error?.code === '23505') return 'duplicate';
  if (error) fail('등록', error);
  return 'ok';
}

export async function updateListing(id: string, input: ListingInput): Promise<boolean> {
  const { data, error } = await withSourceUrlFallback(() =>
    db()
      .from('listings')
      .update({ ...rowFor(input), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id'),
  );
  if (error) fail('수정', error);
  return data.length > 0;
}

export async function setListingVisibility(id: string, visibility: Visibility): Promise<boolean> {
  const { data, error } = await db().from('listings').update({ visibility, updated_at: new Date().toISOString() }).eq('id', id).select('id');
  if (error) fail('상태 변경', error);
  return data.length > 0;
}

/** FK RESTRICT protects inquiry history, including links created during deletion. */
export async function deleteListing(id: string): Promise<'deleted' | 'linked' | 'missing'> {
  if (!LISTING_ID_PATTERN.test(id)) return 'missing';
  const { data, error } = await db().from('listings').delete().eq('id', id).select('id');
  if (error?.code === '23503') return 'linked';
  if (error) fail('삭제', error);
  return data.length ? 'deleted' : 'missing';
}
