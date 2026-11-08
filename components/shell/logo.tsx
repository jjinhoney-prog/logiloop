import { useId } from 'react';

// 로지루프 CI 가이드 v2 기준 벡터 재현. 두 고리가 맞물린 루프 심볼이 LOGILOOP의 OO 자리에 들어간다.
// 고리 교차부는 배경색 테두리로 끊어 앞뒤로 엮인 모양을 만들므로, 놓이는 면의 색을 bg로 넘긴다.
type Tone = { ink: string; sym: string; bg: string };

export const LOGO_TONE = {
  white: { ink: '#000000', sym: '#FFD53D', bg: '#FFFFFF' },
  yellow: { ink: '#000000', sym: '#000000', bg: '#FFDE59' },
  black: { ink: '#FFFFFF', sym: '#FFD53D', bg: '#111111' },
} satisfies Record<string, Tone>;

function Ring({ cx, stroke, width }: { cx: number; stroke: string; width: number }) {
  return <circle cx={cx} cy="15" r="12.5" fill="none" stroke={stroke} strokeWidth={width} />;
}

export function LogoMark({ tone = LOGO_TONE.white, className }: { tone?: Tone; className?: string }) {
  const clip = useId();
  return (
    <svg className={className} viewBox="0 0 48 30" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}><rect x="17" y="15" width="14" height="15" /></clipPath>
      </defs>
      <Ring cx={15} stroke={tone.sym} width={5} />
      <Ring cx={33} stroke={tone.bg} width={9} />
      <Ring cx={33} stroke={tone.sym} width={5} />
      <g clipPath={`url(#${clip})`}>
        <Ring cx={15} stroke={tone.bg} width={9} />
        <Ring cx={15} stroke={tone.sym} width={5} />
      </g>
    </svg>
  );
}

// A형 영문 워드마크. 크기는 font-size로 정한다.
export function Logo({ tone = LOGO_TONE.white, className }: { tone?: Tone; className?: string }) {
  return (
    <span className={className ? `logo ${className}` : 'logo'} style={{ color: tone.ink }} role="img" aria-label="LOGILOOP 로지루프">
      <span className="logo-word" aria-hidden="true">LOGIL</span>
      <LogoMark tone={tone} className="logo-mark" />
      <span className="logo-p" aria-hidden="true">P</span>
    </span>
  );
}
