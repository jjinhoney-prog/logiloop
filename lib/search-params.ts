import { COMPARE_LIMIT } from './logic';
import type { TierId } from './types';

type RawParams = Record<string, string | string[] | undefined>;

export function parseConsultationParams(params: RawParams): { tier: TierId; targets: string[] } {
  const tierNumber = Number(params.tier);
  const tier = ([1, 2, 3] as const).find((t) => t === tierNumber) ?? 1;
  const targets =
    typeof params.candidates === 'string'
      ? params.candidates.split(',').slice(0, COMPARE_LIMIT)
      : typeof params.target === 'string'
        ? [params.target]
        : [];
  return { tier, targets };
}
