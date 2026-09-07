/**
 * Unix epoch(timestamp) 변환·생성 로직.
 *
 * 값의 정본은 **나노초 bigint(`epochNs`) 하나**다. 단위 변환·포맷·역생성이 전부 여기서 파생된다.
 * `Date` 는 밀리초까지만 담으므로 값의 정본으로 쓰지 않고 달력 좌표를 얻는 도구로만 쓴다.
 *
 * 나노초 19자리(1234567890123456789)는 Number.MAX_SAFE_INTEGER(16자리)를 넘어
 * `Number()` 로 읽는 순간 하위 자릿수가 조용히 뭉개진다 — 파싱 경로에 Number/parseInt/parseFloat 를 넣지 않는다.
 */

export type EpochUnit = 's' | 'ms' | 'us' | 'ns';
export type ZoneRef = 'utc' | 'local';
export type WallClockAmbiguity = 'none' | 'gap' | 'ambiguous';

export interface EpochParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export interface EpochZoneView {
  zone: ZoneRef;
  /** 'UTC' 또는 IANA 타임존 이름('Asia/Seoul'). */
  label: string;
  offsetMinutes: number;
  offsetLabel: string;
  parts: EpochParts;
  /** '2009-02-14 08:31:30.123456789' */
  dateTime: string;
  /** '2009년 2월 14일 (토) 08:31:30' */
  korean: string;
  /** '2009-02-14T08:31:30.123456789+09:00' */
  iso: string;
}

export interface EpochInfo {
  epochNs: bigint;
  epochMs: number;
  subMsNs: number;
  subSecondNs: number;
  /** 실제 적용된 단위. */
  unit: EpochUnit;
  /** 자동 감지 결과 — 강제 지정과 별개로 항상 기록한다(추측을 숨기지 않는다). */
  detectedUnit: EpochUnit;
  digits: number;
  seconds: string;
  milliseconds: string;
  microseconds: string;
  nanoseconds: string;
  isoUtc: string;
  utc: EpochZoneView;
  local: EpochZoneView;
  relative: string;
  warning: string | null;
}

const UNIT_TO_NS: Record<EpochUnit, bigint> = {
  s: 1_000_000_000n,
  ms: 1_000_000n,
  us: 1_000n,
  ns: 1n,
};

/** 각 단위가 흡수할 수 있는 소수 자릿수 = 그 단위 아래로 남는 나노초 자릿수. */
const UNIT_FRACTION_DIGITS: Record<EpochUnit, number> = { s: 9, ms: 6, us: 3, ns: 0 };

/** 결과 표시에 붙일 소수 자릿수 — 초 입력에 '.000000000' 이 붙는 노이즈를 막는다. */
const UNIT_DISPLAY_FRACTION: Record<EpochUnit, number> = { s: 0, ms: 3, us: 6, ns: 9 };

export const UNIT_LABELS: Record<EpochUnit, string> = {
  s: '초',
  ms: '밀리초',
  us: '마이크로초',
  ns: '나노초',
};

export const EPOCH_UNIT_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'auto', label: '자동 감지' },
  { value: 's', label: '초 (s)' },
  { value: 'ms', label: '밀리초 (ms)' },
  { value: 'us', label: '마이크로초 (µs)' },
  { value: 'ns', label: '나노초 (ns)' },
];

export const ZONE_REF_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'local', label: '로컬 시간' },
  { value: 'utc', label: 'UTC' },
];

/** Date 로 표현할 수 있는 한계(±). MAX_SAFE_INTEGER 보다 작으므로 범위 검증은 이 값으로 한다. */
const MAX_EPOCH_MS = 8_640_000_000_000_000n;
const MAX_EPOCH_NS = MAX_EPOCH_MS * 1_000_000n;

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const ERROR_EMPTY = 'timestamp 를 입력하세요. (예: 1234567890)';
const ERROR_NOT_NUMBER =
  '숫자 형태의 timestamp 가 아닙니다. 날짜 문자열이면 [날짜 → Timestamp] 탭을 사용하세요.';
const ERROR_MULTI_DOT = '소수점은 한 번만 사용할 수 있습니다.';
const ERROR_RANGE = '표현할 수 있는 날짜 범위를 벗어났습니다. (±8,640,000,000,000,000 ms)';
const ERROR_DATE_EMPTY = '날짜를 입력하세요. (예: 2026-09-07 12:30:00)';
const ERROR_DATE_FORMAT = '날짜 형식이 올바르지 않습니다. (예: 2026-09-07 12:30:00)';

const WARNING_DST_GAP =
  '로컬 타임존에 존재하지 않는 시각입니다(서머타임 시작). 전환 직후 시각으로 해석했습니다.';
const WARNING_DST_AMBIGUOUS =
  '로컬 타임존에서 두 번 존재하는 시각입니다(서머타임 종료). 앞쪽 시각을 선택했습니다.';

// BigInt 나눗셈은 0 방향 절삭이라 음수에서 나머지가 음수가 된다.
// 내림(-∞ 방향)으로 바꿔야 sub-ms 잔여가 항상 0 이상이 되어 하위 자릿수를 그대로 표시할 수 있다.
const floorDiv = (a: bigint, b: bigint): bigint => {
  const quotient = a / b;
  return a % b !== 0n && a < 0n !== b < 0n ? quotient - 1n : quotient;
};

const floorMod = (a: bigint, b: bigint): bigint => a - floorDiv(a, b) * b;

const pad2 = (value: number): string => String(value).padStart(2, '0');

// ISO 8601 확장 연도 — 0000~9999 밖은 부호와 6자리로 쓴다.
const padYear = (year: number): string => {
  if (year < 0) return `-${String(-year).padStart(6, '0')}`;
  if (year > 9999) return `+${String(year).padStart(6, '0')}`;
  return String(year).padStart(4, '0');
};

/**
 * 붙여넣기 잡음을 걷어낸다 — 공백·콤마·언더스코어·따옴표·백틱 제거, 전각 숫자와
 * 유니코드 마이너스를 반각으로 접고 의미 없는 선행 '+' 를 뗀다.
 */
export const sanitizeEpochInput = (raw: string): string => {
  if (raw === null || raw === undefined) return '';
  return String(raw)
    .trim()
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/＋/g, '+')
    .replace(/[－−‒–—]/g, '-')
    .replace(/．/g, '.')
    .replace(/[,_\s'"`]/g, '')
    .replace(/^\+/, '');
};

/** 부호·선행 0·소수부를 뺀 정수부 자릿수. 선행 0 을 빼지 않으면 16자리 µs 로 오판한다. */
export const countIntegerDigits = (sanitized: string): number => {
  const magnitude = sanitized.startsWith('-') ? sanitized.slice(1) : sanitized;
  const intText = magnitude.split('.')[0].replace(/^0+/, '');
  return intText.length === 0 ? 1 : intText.length;
};

/**
 * 정수부 자릿수로 단위를 판정한다. 모호 구간(11/12/14/15/17/18자리)도 결정론적으로 확정하되,
 * 화면이 감지 결과를 항상 노출하고 사용자가 강제 지정으로 뒤집을 수 있게 한다.
 */
export const detectEpochUnit = (digits: number): EpochUnit => {
  if (digits <= 11) return 's';
  if (digits <= 14) return 'ms';
  if (digits <= 17) return 'us';
  return 'ns';
};

/** 14자리 숫자가 yyyyMMddHHmmss 로도 읽히는지 본다 — 20260907143000 같은 값의 오인을 경고한다. */
const looksLikeCompactDateTime = (sanitized: string): boolean => {
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(sanitized);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  return (
    year >= 1900 &&
    year <= 2999 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31 &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59
  );
};

/** 정제된 숫자 문자열을 나노초로 승격한다. 소수부는 단위 정밀도까지만 흡수하고 초과분은 절삭한다. */
const toEpochNs = (sanitized: string, unit: EpochUnit): { epochNs: bigint; truncated: boolean } => {
  const negative = sanitized.startsWith('-');
  const magnitude = negative ? sanitized.slice(1) : sanitized;
  const dotIndex = magnitude.indexOf('.');
  const intText = dotIndex === -1 ? magnitude : magnitude.slice(0, dotIndex);
  const fracRaw = dotIndex === -1 ? '' : magnitude.slice(dotIndex + 1);

  const scale = UNIT_FRACTION_DIGITS[unit];
  const fracText = fracRaw.slice(0, scale).padEnd(scale, '0');

  const whole = BigInt(intText === '' ? '0' : intText) * UNIT_TO_NS[unit];
  const fraction = fracText === '' ? 0n : BigInt(fracText);

  // 부호는 크기를 다 만든 뒤 마지막에 적용한다.
  // -1.5 를 (-1 * 1e9) + 5e8 로 계산하면 -0.5초가 되어 틀린다.
  return {
    epochNs: (whole + fraction) * (negative ? -1n : 1n),
    truncated: fracRaw.length > scale,
  };
};

export interface ParsedEpoch {
  epochNs: bigint | null;
  unit: EpochUnit | null;
  detectedUnit: EpochUnit | null;
  digits: number;
  warning: string | null;
  error: string | null;
}

/** timestamp 문자열을 나노초로 파싱한다. 실패는 예외 대신 error 문자열로 알린다. */
export const parseEpochInput = (
  raw: string,
  forcedUnit: EpochUnit | 'auto' = 'auto',
): ParsedEpoch => {
  const fail = (error: string, extra: Partial<ParsedEpoch> = {}): ParsedEpoch => ({
    epochNs: null,
    unit: null,
    detectedUnit: null,
    digits: 0,
    warning: null,
    error,
    ...extra,
  });

  const sanitized = sanitizeEpochInput(raw);
  if (sanitized === '' || sanitized === '-') return fail(ERROR_EMPTY);
  if ((sanitized.match(/\./g) || []).length > 1) return fail(ERROR_MULTI_DOT);
  // BigInt('abc') 는 SyntaxError 를 던지므로 형태를 먼저 확정한다.
  if (!/^-?\d*(\.\d*)?$/.test(sanitized) || !/\d/.test(sanitized)) return fail(ERROR_NOT_NUMBER);

  const digits = countIntegerDigits(sanitized);
  const detectedUnit = detectEpochUnit(digits);
  const unit = forcedUnit && forcedUnit !== 'auto' ? forcedUnit : detectedUnit;

  let epochNs: bigint;
  let truncated: boolean;
  try {
    const converted = toEpochNs(sanitized, unit);
    epochNs = converted.epochNs;
    truncated = converted.truncated;
  } catch {
    return fail(ERROR_NOT_NUMBER);
  }

  if (epochNs > MAX_EPOCH_NS || epochNs < -MAX_EPOCH_NS) {
    return fail(ERROR_RANGE, { unit, detectedUnit, digits });
  }

  const warnings: string[] = [];
  if (truncated) {
    warnings.push('입력의 소수부가 나노초 정밀도를 넘어 절삭되었습니다.');
  }
  if (unit !== detectedUnit) {
    warnings.push(
      `자동 감지는 ${UNIT_LABELS[detectedUnit]} 였지만 ${UNIT_LABELS[unit]} 로 해석했습니다.`,
    );
  } else if (digits === 14 && looksLikeCompactDateTime(sanitized)) {
    warnings.push(
      '14자리 숫자는 yyyyMMddHHmmss 형식일 수 있습니다. epoch 가 아니라면 [날짜 → Timestamp] 탭을 사용하세요.',
    );
  }

  return {
    epochNs,
    unit,
    detectedUnit,
    digits,
    warning: warnings.length > 0 ? warnings.join(' ') : null,
    error: null,
  };
};

/** epochNs 를 Date 투입용 ms 와 그 아래 잔여로 쪼갠다. floor 라 음수에서도 잔여는 0 이상이다. */
export const splitEpochNs = (epochNs: bigint) => ({
  epochMs: Number(floorDiv(epochNs, 1_000_000n)),
  subMsNs: Number(floorMod(epochNs, 1_000_000n)),
  subSecondNs: Number(floorMod(epochNs, 1_000_000_000n)),
  wholeSeconds: Number(floorDiv(epochNs, 1_000_000_000n)),
});

/** 지정 단위의 값 문자열. 정수 표기는 floor, 소수 표기는 부호-크기 방식이다. */
export const formatEpochInUnit = (
  epochNs: bigint,
  unit: EpochUnit,
  withFraction: boolean = false,
): string => {
  const scale = UNIT_TO_NS[unit];
  if (!withFraction || scale === 1n) return floorDiv(epochNs, scale).toString();

  // floor 몫과 나머지를 그대로 이으면 -1.5 가 '-2.5' 로 나온다 — 크기를 먼저 만들고 부호를 붙인다.
  const negative = epochNs < 0n;
  const magnitude = negative ? -epochNs : epochNs;
  const fraction = (magnitude % scale)
    .toString()
    .padStart(UNIT_FRACTION_DIGITS[unit], '0')
    .replace(/0+$/, '');
  const body = fraction === '' ? `${magnitude / scale}` : `${magnitude / scale}.${fraction}`;
  return negative ? `-${body}` : body;
};

/**
 * UTC ISO 8601 — 나노초 9자리를 그대로 붙인다.
 * toISOString() 은 연도가 0000~9999 밖이면 확장 포맷을 내므로 slice(0, 19) 로 자르면 깨진다.
 */
export const toIsoUtc = (epochNs: bigint): string => {
  const { wholeSeconds, subSecondNs } = splitEpochNs(epochNs);
  return new Date(wholeSeconds * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, `.${String(subSecondNs).padStart(9, '0')}Z`);
};

export const formatOffsetLabel = (offsetMinutes: number): string => {
  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  return `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
};

export const getLocalTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
  } catch {
    return 'Local';
  }
};

/** 표시 소수부 — 자릿수가 0 이면 아예 붙이지 않는다. */
const buildFractionText = (subSecondNs: number, digits: number): string =>
  digits <= 0 ? '' : `.${String(subSecondNs).padStart(9, '0').slice(0, digits)}`;

/**
 * 한 시각을 UTC 또는 브라우저 로컬에서 본 표현으로 만든다.
 * 임의 IANA 타임존을 지원하지 않으므로 Intl 포맷 파싱 없이 Date 게터만으로 끝난다.
 */
export const buildZoneView = (
  epochNs: bigint,
  zone: ZoneRef,
  fractionDigits: number = 0,
): EpochZoneView | null => {
  const { epochMs, subSecondNs } = splitEpochNs(epochNs);
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) return null;

  const isUtc = zone === 'utc';
  const parts: EpochParts = isUtc
    ? {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds(),
        millisecond: date.getUTCMilliseconds(),
      }
    : {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
        millisecond: date.getMilliseconds(),
      };

  // getTimezoneOffset() 은 부호가 반대(UTC = local + offset)라 음수를 취해 통상 규약으로 맞춘다.
  const offsetMinutes = isUtc ? 0 : -date.getTimezoneOffset();
  const offsetLabel = formatOffsetLabel(offsetMinutes);
  const fraction = buildFractionText(subSecondNs, fractionDigits);
  const ymd = `${padYear(parts.year)}-${pad2(parts.month)}-${pad2(parts.day)}`;
  const hms = `${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
  const weekday = DAY_NAMES[isUtc ? date.getUTCDay() : date.getDay()];

  return {
    zone,
    label: isUtc ? 'UTC' : getLocalTimeZone(),
    offsetMinutes,
    offsetLabel,
    parts,
    dateTime: `${ymd} ${hms}${fraction}`,
    korean: `${parts.year}년 ${parts.month}월 ${parts.day}일 (${weekday}) ${hms}${fraction}`,
    iso: `${ymd}T${hms}${fraction}${isUtc ? 'Z' : offsetLabel}`,
  };
};

const WALL_CLOCK_PATTERN =
  /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?)?$/;

export interface ParsedWallClock {
  parts: EpochParts | null;
  /** 입력이 'Z' 로 끝나 UTC 임을 명시한 경우 — 호출부가 기준 타임존을 UTC 로 고정한다. */
  explicitUtc: boolean;
  error: string | null;
}

/** 'YYYY-MM-DD[ T]HH:mm[:ss[.SSS]][Z]' 벽시계 문자열을 분해한다. */
export const parseWallClockText = (text: string): ParsedWallClock => {
  const trimmed = String(text ?? '').trim();
  if (trimmed === '') return { parts: null, explicitUtc: false, error: ERROR_DATE_EMPTY };

  const explicitUtc = /z$/i.test(trimmed);
  const body = explicitUtc ? trimmed.slice(0, -1) : trimmed;
  const match = WALL_CLOCK_PATTERN.exec(body);
  if (!match) return { parts: null, explicitUtc, error: ERROR_DATE_FORMAT };

  const parts: EpochParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] ?? 0),
    minute: Number(match[5] ?? 0),
    second: Number(match[6] ?? 0),
    millisecond: Number((match[7] ?? '').padEnd(3, '0')),
  };

  if (
    parts.month < 1 ||
    parts.month > 12 ||
    parts.day < 1 ||
    parts.day > 31 ||
    parts.hour > 23 ||
    parts.minute > 59 ||
    parts.second > 59
  ) {
    return { parts: null, explicitUtc, error: `존재하지 않는 날짜입니다: ${trimmed}` };
  }

  // 2026-02-30 처럼 달을 넘는 날짜는 되읽어서 오버플로를 잡는다.
  const probe = new Date(0);
  probe.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  if (probe.getUTCMonth() + 1 !== parts.month || probe.getUTCDate() !== parts.day) {
    return { parts: null, explicitUtc, error: `존재하지 않는 날짜입니다: ${trimmed}` };
  }

  return { parts, explicitUtc, error: null };
};

/**
 * 벽시계를 'UTC 로 읽은 가상 ms' 로 조립한다.
 * Date.UTC / new Date(y, ...) 는 연도 0~99 를 1900+y 로 접으므로 setUTCFullYear 로 우회한다.
 */
const partsToUtcMs = (parts: EpochParts): number => {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
  return date.getTime();
};

/** 로컬 시각을 다시 '벽시계를 UTC 로 읽은 ms' 로 되돌린다 — 후보 검증용. */
const localMsToWallMs = (epochMs: number): number => {
  const date = new Date(epochMs);
  return partsToUtcMs({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    millisecond: date.getMilliseconds(),
  });
};

/**
 * 벽시계 → epoch ms. UTC 는 자명하고, 로컬은 브라우저 오프셋으로 역산한다.
 *
 * 벽시계는 오프셋을 모르고 오프셋은 순간을 알아야 구해지는 순환 관계다.
 * 전환 전후 오프셋 후보 2개로 역산한 뒤 되읽어 일치하는 쪽을 고르면 DST gap/ambiguous 까지 판정된다.
 */
export const wallClockToEpochMs = (
  parts: EpochParts,
  zone: ZoneRef,
): { epochMs: number | null; ambiguity: WallClockAmbiguity; error: string | null } => {
  const wall = partsToUtcMs(parts);
  if (!Number.isFinite(wall)) return { epochMs: null, ambiguity: 'none', error: ERROR_RANGE };
  if (zone === 'utc') return { epochMs: wall, ambiguity: 'none', error: null };

  const offsetBefore = -new Date(wall - 86_400_000).getTimezoneOffset();
  const offsetAfter = -new Date(wall + 86_400_000).getTimezoneOffset();
  const candidateBefore = wall - offsetBefore * 60_000;
  const candidateAfter = wall - offsetAfter * 60_000;
  const validBefore = localMsToWallMs(candidateBefore) === wall;
  const validAfter = localMsToWallMs(candidateAfter) === wall;

  if (validBefore && validAfter) {
    // 둘 다 유효 = 서머타임 종료로 벽시계가 두 번 존재. 이른 쪽을 고른다.
    return {
      epochMs: Math.min(candidateBefore, candidateAfter),
      ambiguity: candidateBefore === candidateAfter ? 'none' : 'ambiguous',
      error: null,
    };
  }
  if (validBefore) return { epochMs: candidateBefore, ambiguity: 'none', error: null };
  if (validAfter) return { epochMs: candidateAfter, ambiguity: 'none', error: null };
  // 둘 다 무효 = 서머타임 시작으로 건너뛴 시각. 전환 전 오프셋으로 전환 직후에 착지시킨다.
  return { epochMs: candidateBefore, ambiguity: 'gap', error: null };
};

/** 상대시간 임계값 사다리 — 순수 산술이라 ICU 문자열에 의존하지 않고 테스트할 수 있다. */
export const getRelativeParts = (
  deltaMs: number,
): { value: number; unit: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year' } => {
  const sign = deltaMs < 0 ? -1 : 1;
  const abs = Math.abs(deltaMs);
  const ladder = [
    [45_000, 1_000, 'second'],
    [2_700_000, 60_000, 'minute'],
    [79_200_000, 3_600_000, 'hour'],
    [2_246_400_000, 86_400_000, 'day'],
    [27_648_000_000, 2_629_800_000, 'month'],
  ] as const;
  for (const [limit, unitMs, unit] of ladder) {
    if (abs < limit) return { value: sign * Math.round(abs / unitMs), unit };
  }
  return { value: sign * Math.round(abs / 31_557_600_000), unit: 'year' };
};

export const formatRelativeKo = (epochMs: number, nowMs: number = Date.now()): string => {
  const { value, unit } = getRelativeParts(epochMs - nowMs);
  if (unit === 'second' && Math.abs(value) < 5) return '방금 전';
  try {
    return new Intl.RelativeTimeFormat('ko', { numeric: 'auto' }).format(value, unit);
  } catch {
    return '';
  }
};

export interface BuildEpochOptions {
  unit?: EpochUnit;
  detectedUnit?: EpochUnit;
  digits?: number;
  nowMs?: number;
  warning?: string | null;
}

/** 나노초 값 하나에서 결과 패널 전체를 만든다. nowMs 주입으로 상대시간 테스트를 현재 시각과 분리한다. */
export const buildEpochInfo = (
  epochNs: bigint,
  options: BuildEpochOptions = {},
): { info: EpochInfo | null; error: string | null } => {
  if (typeof epochNs !== 'bigint') return { info: null, error: ERROR_EMPTY };
  if (epochNs > MAX_EPOCH_NS || epochNs < -MAX_EPOCH_NS) return { info: null, error: ERROR_RANGE };

  const unit = options.unit || 'ms';
  const detectedUnit = options.detectedUnit || unit;
  const fractionDigits = UNIT_DISPLAY_FRACTION[unit];
  const utc = buildZoneView(epochNs, 'utc', fractionDigits);
  const local = buildZoneView(epochNs, 'local', fractionDigits);
  // strict:false 라 null 이 그대로 흘러가도 컴파일러가 잡지 못한다 — 여기서 명시적으로 끊는다.
  if (!utc || !local) return { info: null, error: ERROR_RANGE };

  const { epochMs, subMsNs, subSecondNs } = splitEpochNs(epochNs);

  return {
    info: {
      epochNs,
      epochMs,
      subMsNs,
      subSecondNs,
      unit,
      detectedUnit,
      digits: options.digits || 0,
      seconds: formatEpochInUnit(epochNs, 's'),
      milliseconds: formatEpochInUnit(epochNs, 'ms'),
      microseconds: formatEpochInUnit(epochNs, 'us'),
      nanoseconds: formatEpochInUnit(epochNs, 'ns'),
      isoUtc: toIsoUtc(epochNs),
      utc,
      local,
      relative: formatRelativeKo(epochMs, options.nowMs),
      warning: options.warning || null,
    },
    error: null,
  };
};

/** 변환 탭의 단일 진입점 — 문자열을 받아 결과 패널까지 만든다. */
export const convertEpoch = (
  raw: string,
  options: { forcedUnit?: EpochUnit | 'auto'; nowMs?: number } = {},
): { info: EpochInfo | null; parsed: ParsedEpoch; error: string | null } => {
  const parsed = parseEpochInput(raw, options.forcedUnit);
  if (parsed.error || parsed.epochNs === null) {
    return { info: null, parsed, error: parsed.error };
  }
  const built = buildEpochInfo(parsed.epochNs, {
    unit: parsed.unit,
    detectedUnit: parsed.detectedUnit,
    digits: parsed.digits,
    warning: parsed.warning,
    nowMs: options.nowMs,
  });
  return { info: built.info, parsed, error: built.error };
};

/** 생성 탭의 단일 진입점 — 벽시계 문자열과 기준 타임존을 받아 결과 패널까지 만든다. */
export const buildEpochFromWallClock = (
  text: string,
  zone: ZoneRef,
  options: { nowMs?: number } = {},
): {
  info: EpochInfo | null;
  ambiguity: WallClockAmbiguity;
  zone: ZoneRef;
  error: string | null;
} => {
  const parsed = parseWallClockText(text);
  if (parsed.error || parsed.parts === null) {
    return { info: null, ambiguity: 'none', zone, error: parsed.error };
  }

  // 'Z' 가 붙은 입력은 기준 선택보다 입력 자체가 우선한다 — 명시된 UTC 를 조용히 무시하지 않는다.
  const effectiveZone: ZoneRef = parsed.explicitUtc ? 'utc' : zone;
  const wall = wallClockToEpochMs(parsed.parts, effectiveZone);
  if (wall.error || wall.epochMs === null) {
    return { info: null, ambiguity: 'none', zone: effectiveZone, error: wall.error || ERROR_RANGE };
  }

  const warnings: string[] = [];
  if (wall.ambiguity === 'gap') warnings.push(WARNING_DST_GAP);
  if (wall.ambiguity === 'ambiguous') warnings.push(WARNING_DST_AMBIGUOUS);

  // 벽시계에 밀리초가 없으면 초 정밀도로 표시한다 — '.000' 은 없는 정밀도를 있는 것처럼 보이게 한다.
  const unit: EpochUnit = parsed.parts.millisecond > 0 ? 'ms' : 's';
  const built = buildEpochInfo(BigInt(wall.epochMs) * 1_000_000n, {
    unit,
    detectedUnit: unit,
    nowMs: options.nowMs,
    warning: warnings.length > 0 ? warnings.join(' ') : null,
  });

  return {
    info: built.info,
    ambiguity: wall.ambiguity,
    zone: effectiveZone,
    error: built.error,
  };
};

/** 브라우저는 밀리초까지만 제공하므로 하위 6자리는 항상 0 이다. */
export const getNowEpochNs = (): bigint => BigInt(Date.now()) * 1_000_000n;

/** 'YYYY-MM-DD HH:mm:ss[.SSS]' — DateTimePicker 의 값 계약과 같은 모양으로 벽시계를 쓴다. */
export const formatWallClockParts = (
  parts: EpochParts,
  withMillisecond: boolean = false,
): string => {
  const base = `${padYear(parts.year)}-${pad2(parts.month)}-${pad2(parts.day)} ${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
  return withMillisecond && parts.millisecond > 0
    ? `${base}.${String(parts.millisecond).padStart(3, '0')}`
    : base;
};

/** 특정 순간을 그 타임존의 벽시계 입력 문자열로 되돌린다 — '지금' 버튼이 쓴다. */
export const formatWallClockInput = (epochMs: number, zone: ZoneRef): string => {
  const view = buildZoneView(BigInt(epochMs) * 1_000_000n, zone, 0);
  return view ? view.dateTime : '';
};
