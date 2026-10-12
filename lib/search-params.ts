import { COMPARE_LIMIT } from './logic';
import type { TierId } from './types';
import { inquiryTemperatureOptions, regionOptions, sizes } from './data';
import { requestSituations } from './service-content';

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

/** URL 값은 선택지와 길이를 검증한 뒤 폼에 전달한다. */
export function parseRequestContext(params: RawParams) {
  const situation = requestSituations.find((item) => item.id === params.situation);
  const region = typeof params.region === 'string' && regionOptions.includes(params.region) ? params.region : '아직 모름';
  const temperature = typeof params.temperature === 'string' && inquiryTemperatureOptions.includes(params.temperature) ? params.temperature : '아직 모름';
  const query = typeof params.query === 'string' ? params.query.trim().slice(0, 100) : '';
  const service = typeof params.service === 'string' ? params.service.trim().slice(0, 100) : '';
  const size = typeof params.size === 'string' && sizes.slice(1).includes(params.size) ? params.size : '';
  return { help: situation?.title ?? '', tier: situation?.tier, region, temperature, note: [query && `목록 검색 조건: ${query}`, size && `희망 면적: ${size}`, service && `필요 작업: ${service}`].filter(Boolean).join('\n') };
}
