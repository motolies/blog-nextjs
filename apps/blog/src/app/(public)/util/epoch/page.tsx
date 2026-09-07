'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  DateTimePicker,
  InlineNotice,
  Input,
  NumberInput,
  Select,
  Switch,
  showToast,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@hvy/ui';
import { ArrowLeft, BookOpenText, Copy, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { copyTextToClipboard } from '@/util/browserUtils';
import type { EpochUnit, ZoneRef } from '@/util/epochUtils';
import {
  buildEpochFromWallClock,
  buildZoneView,
  convertEpoch,
  EPOCH_UNIT_OPTIONS,
  formatEpochInUnit,
  formatWallClockInput,
  formatWallClockParts,
  parseWallClockText,
  UNIT_LABELS,
  ZONE_REF_OPTIONS,
} from '@/util/epochUtils';

const UNIT_DIGIT_HINTS = [
  { unit: '초 (s)', digits: '1 ~ 11자리', example: '1788738999', note: '10자리가 현재 epoch' },
  { unit: '밀리초 (ms)', digits: '12 ~ 14자리', example: '1788738999123', note: 'JS Date.now()' },
  {
    unit: '마이크로초 (µs)',
    digits: '15 ~ 17자리',
    example: '1788738999123456',
    note: 'Go UnixMicro, PostgreSQL',
  },
  {
    unit: '나노초 (ns)',
    digits: '18자리 이상',
    example: '1788738999123456789',
    note: 'Python time_ns(), Java Instant',
  },
];

const COPY_BUTTON_CLASS =
  'shrink-0 rounded p-1 text-dl-fg-muted transition-colors hover:bg-dl-option-hover';

// 복사는 실패할 수 있다(권한·비보안 컨텍스트) — 성공/실패를 모두 토스트로 알린다.
const copyValue = async (value: string) => {
  if (!value) {
    showToast('복사할 내용이 없습니다.', 'warning');
    return;
  }
  try {
    await copyTextToClipboard(value);
    showToast('클립보드에 복사되었습니다.');
  } catch (e) {
    showToast(e.message || '클립보드 복사에 실패했습니다.', 'error');
  }
};

function CopyButton({ value, title = '복사' }) {
  return (
    <button
      type="button"
      onClick={() => void copyValue(value)}
      className={COPY_BUTTON_CLASS}
      title={title}
    >
      <Copy className="h-4 w-4" />
    </button>
  );
}

/**
 * 변환·생성 두 탭이 공유하는 결과 표.
 * 모듈 최상위에 두는 이유 — 렌더 함수 안에서 정의하면 입력할 때마다 언마운트/재마운트된다.
 */
function EpochResultTable({ info }) {
  const rows = [
    { label: 'GMT (UTC)', value: info.utc.korean },
    { label: 'ISO 8601 (UTC)', value: info.isoUtc },
    {
      label: `로컬 시간 (${info.local.label})`,
      value: `${info.local.dateTime} (${info.local.offsetLabel})`,
    },
    { label: '상대 시간', value: info.relative },
    { label: '초 (s)', value: info.seconds },
    { label: '밀리초 (ms)', value: info.milliseconds },
    { label: '마이크로초 (µs)', value: info.microseconds },
    { label: '나노초 (ns)', value: info.nanoseconds },
  ];

  return (
    <div className="border rounded-md p-4 mb-4">
      <p className="font-medium mb-3">변환 결과</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b last:border-0 hover:bg-dl-option-hover">
                <th
                  scope="row"
                  className="text-left py-2 px-3 w-44 font-medium text-dl-fg-muted align-top"
                >
                  {row.label}
                </th>
                <td className="py-2 px-3 font-mono break-all">{row.value}</td>
                <td className="py-2 px-3 w-10 text-right">
                  <CopyButton value={row.value} title={`${row.label} 복사`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EpochPage() {
  const router = useRouter();
  // Date.now() 와 로컬 타임존은 서버와 클라이언트가 달라 hydration mismatch 를 낸다.
  const [isClient, setIsClient] = useState(false);
  const [tabValue, setTabValue] = useState('convert');

  const [nowMs, setNowMs] = useState(0);
  const [clockPaused, setClockPaused] = useState(false);

  const [rawInput, setRawInput] = useState('1788738999');
  const [forcedUnit, setForcedUnit] = useState<EpochUnit | 'auto'>('auto');

  // 생성 탭의 진실은 wallText 하나다 — 피커·밀리초 입력은 모두 이 문자열을 고쳐 쓴다.
  const [wallText, setWallText] = useState('');
  const [zoneRef, setZoneRef] = useState<ZoneRef>('local');

  useEffect(() => {
    setIsClient(true);
    setNowMs(Date.now());
    setWallText(formatWallClockInput(Date.now(), 'local'));
  }, []);

  // 일시정지 중에는 인터벌 자체를 해제한다 — 복사하려는 순간 값이 바뀌는 것을 막는다.
  useEffect(() => {
    if (!isClient || clockPaused) return;
    const timer = setInterval(() => setNowMs(Date.now()), 200);
    return () => clearInterval(timer);
  }, [isClient, clockPaused]);

  const conversion = useMemo(
    () => (rawInput.trim() === '' ? null : convertEpoch(rawInput, { forcedUnit })),
    [rawInput, forcedUnit],
  );

  const generation = useMemo(
    () => (wallText.trim() === '' ? null : buildEpochFromWallClock(wallText, zoneRef)),
    [wallText, zoneRef],
  );

  // 피커는 초 정밀도만 담는다 — 밀리초는 떼고 보여 준다(값이 있는데 빈 칸으로 보이면 잃은 것처럼 읽힌다).
  const wallParts = useMemo(() => parseWallClockText(wallText).parts, [wallText]);
  const pickerValue = wallParts ? formatWallClockParts(wallParts, false) : '';
  const wallMillisecond = wallParts ? wallParts.millisecond : null;

  // 달력으로 날짜·시각만 바꿀 때 사용자가 입력해 둔 밀리초를 조용히 버리지 않는다.
  const handlePickerChange = (next: string) => {
    const picked = parseWallClockText(next).parts;
    setWallText(
      picked ? formatWallClockParts({ ...picked, millisecond: wallMillisecond || 0 }, true) : next,
    );
  };

  // 밀리초 입력은 벽시계 문자열의 소수부만 갈아끼운다.
  const handleMillisecondChange = (next) => {
    if (!wallParts) {
      showToast('먼저 날짜와 시간을 입력하세요.', 'warning');
      return;
    }
    const millisecond = Math.min(999, Math.max(0, next || 0));
    setWallText(formatWallClockParts({ ...wallParts, millisecond }, true));
  };

  // Select 의 onValueChange 계약은 string 이다 — 옵션 목록이 값을 보장하므로 좁혀서 받는다.
  const handleUnitChange = (value: string) => setForcedUnit(value as EpochUnit | 'auto');
  const handleZoneChange = (value: string) => setZoneRef(value as ZoneRef);

  const handleNow = () => {
    setWallText(formatWallClockInput(Date.now(), zoneRef));
  };

  if (!isClient) {
    return <div className="p-4">로딩 중...</div>;
  }

  const clockNs = BigInt(nowMs) * 1_000_000n;
  const clockUtc = buildZoneView(clockNs, 'utc', 0);
  const clockLocal = buildZoneView(clockNs, 'local', 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button
          className="aspect-square p-0"
          variant="ghost"
          aria-label="유틸 목록으로 돌아가기"
          onClick={() => router.push('/util')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold">Epoch Converter</h1>
      </div>

      {/* 현재 epoch — 상시 노출 */}
      <div className="border rounded-md p-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-dl-fg-muted mb-1">현재 Unix epoch</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums">
                {formatEpochInUnit(clockNs, 's')}
              </span>
              <CopyButton value={formatEpochInUnit(clockNs, 's')} title="초 값 복사" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone="primary" size="sm">
                ms {formatEpochInUnit(clockNs, 'ms')}
              </Badge>
              <CopyButton value={formatEpochInUnit(clockNs, 'ms')} title="밀리초 값 복사" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm text-dl-fg-muted">일시정지</span>
            <Switch
              label="시계 일시정지"
              checked={clockPaused}
              onCheckedChange={setClockPaused}
              size="sm"
            />
          </div>
        </div>
        <div className="mt-3 space-y-0.5 text-sm text-dl-fg-muted">
          <p className="font-mono">{clockUtc.dateTime} UTC</p>
          <p className="font-mono">
            {clockLocal.dateTime} ({clockLocal.label}, {clockLocal.offsetLabel})
          </p>
        </div>
        <p className="mt-2 text-xs text-dl-fg-muted">
          브라우저는 밀리초까지만 제공합니다 — 마이크로초·나노초는 하위 자리가 0 이 되므로 표시하지
          않습니다.
        </p>
      </div>

      <div className="border rounded-md">
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabList className="w-full grid grid-cols-2 rounded-none border-b">
            <Tab value="convert">Timestamp → 날짜</Tab>
            <Tab value="generate">날짜 → Timestamp</Tab>
          </TabList>

          <div className="p-2 sm:p-4">
            {/* Timestamp → 날짜 */}
            <TabPanel value="convert">
              <div className="border rounded-md p-4 mb-4">
                <p className="font-medium mb-3">Timestamp 입력</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                        placeholder="예: 1788738999 / 1788738999123 / 1788738999123456789"
                        className={`pr-8 font-mono ${conversion?.error ? 'border-dl-error' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => void copyValue(rawInput)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-dl-option-hover"
                        title="복사"
                      >
                        <Copy className="h-4 w-4 text-dl-fg-muted" />
                      </button>
                    </div>
                    <p className="text-xs text-dl-fg-muted mt-1">
                      초·밀리초·마이크로초·나노초를 자릿수로 자동 판별합니다. 콤마·따옴표·소수점이
                      섞여 있어도 됩니다.
                    </p>
                  </div>
                  <div className="sm:w-48 shrink-0">
                    <Select
                      value={forcedUnit}
                      onValueChange={handleUnitChange}
                      options={EPOCH_UNIT_OPTIONS}
                      placeholder="자동 감지"
                    />
                  </div>
                </div>

                {conversion?.parsed?.detectedUnit && (
                  <div className="mt-3">
                    <Badge tone={forcedUnit === 'auto' ? 'primary' : 'warning'}>
                      {forcedUnit === 'auto'
                        ? `자동 감지: ${UNIT_LABELS[conversion.parsed.detectedUnit]} (${conversion.parsed.digits}자리)`
                        : `강제 지정: ${UNIT_LABELS[conversion.parsed.unit]} (자동 감지는 ${UNIT_LABELS[conversion.parsed.detectedUnit]})`}
                    </Badge>
                  </div>
                )}
              </div>

              {conversion?.error && (
                <InlineNotice tone="error" className="mb-4" live>
                  {conversion.error}
                </InlineNotice>
              )}
              {conversion?.info?.warning && (
                <InlineNotice tone="warning" className="mb-4" live>
                  {conversion.info.warning}
                </InlineNotice>
              )}
              {conversion?.info && <EpochResultTable info={conversion.info} />}
            </TabPanel>

            {/* 날짜 → Timestamp */}
            <TabPanel value="generate">
              <div className="border rounded-md p-4 mb-4">
                <p className="font-medium mb-3">날짜/시간 입력</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-dl-fg-muted">달력에서 선택</p>
                    <DateTimePicker
                      value={pickerValue}
                      onValueChange={handlePickerChange}
                      precision="second"
                      clearable
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-dl-fg-muted">직접 입력</p>
                    <Input
                      value={wallText}
                      onChange={(e) => setWallText(e.target.value)}
                      placeholder="2026-09-07 14:30:00.123"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-dl-fg-muted">기준 타임존</p>
                    <Select
                      value={zoneRef}
                      onValueChange={handleZoneChange}
                      options={ZONE_REF_OPTIONS}
                      placeholder="기준 선택"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-dl-fg-muted">밀리초</p>
                    <NumberInput
                      value={wallMillisecond}
                      onValueChange={handleMillisecondChange}
                      min={0}
                      max={999}
                      stepper
                      align="left"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button variant="ghost" onClick={handleNow} className="w-full">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      지금
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-dl-fg-muted mt-3">
                  2026-09-07 · 2026-09-07 14:30 · 2026-09-07T14:30:00.123 형식을 지원합니다. 끝에 Z
                  를 붙이면 기준 선택과 무관하게 UTC 로 해석합니다.
                </p>
              </div>

              {generation?.error && (
                <InlineNotice tone="error" className="mb-4" live>
                  {generation.error}
                </InlineNotice>
              )}
              {generation?.info?.warning && (
                <InlineNotice tone="warning" className="mb-4" live>
                  {generation.info.warning}
                </InlineNotice>
              )}
              {generation?.info && (
                <>
                  <div className="border rounded-md p-4 mb-4 bg-dl-info-bg">
                    <p className="text-xs text-dl-fg-muted mb-1">
                      {generation.zone === 'utc' ? 'UTC' : `로컬 (${generation.info.local.label})`}{' '}
                      기준으로 해석한 결과
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold break-all">
                        {generation.info.seconds}
                      </span>
                      <CopyButton value={generation.info.seconds} title="초 값 복사" />
                    </div>
                  </div>
                  <EpochResultTable info={generation.info} />
                </>
              )}
            </TabPanel>
          </div>
        </Tabs>
      </div>

      <Accordion type="single" collapsible className="mt-4">
        <AccordionItem
          value="guide"
          className="overflow-hidden rounded-[1.25rem] border border-dl-border bg-dl-surface shadow-dl-card"
        >
          <AccordionTrigger className="px-4 py-4 font-medium no-underline hover:no-underline">
            <span className="flex items-center gap-2">
              <BookOpenText className="h-4 w-4" />
              Epoch 가이드
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-5 px-4 pb-4 text-sm">
              <div>
                <p className="text-sm font-medium mb-2">Epoch(Unix time)이란?</p>
                <p className="text-dl-fg-muted leading-6">
                  1970-01-01 00:00:00 UTC 부터 흐른 시간을 하나의 숫자로 센 값입니다. 타임존 정보가
                  없는 절대 시각이라 서버·DB·로그 사이에서 시간을 주고받는 표준으로 쓰입니다. 1970
                  이전은 음수로 표현합니다.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">단위별 자릿수</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 w-32 font-medium text-dl-fg-muted">
                          단위
                        </th>
                        <th className="text-left py-2 px-3 w-32 font-medium text-dl-fg-muted">
                          자릿수
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-dl-fg-muted">예시</th>
                        <th className="text-left py-2 px-3 font-medium text-dl-fg-muted">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {UNIT_DIGIT_HINTS.map((hint) => (
                        <tr key={hint.unit} className="border-b last:border-0">
                          <td className="py-2 px-3">{hint.unit}</td>
                          <td className="py-2 px-3 text-dl-fg-muted">{hint.digits}</td>
                          <td className="py-2 px-3 font-mono break-all">{hint.example}</td>
                          <td className="py-2 px-3 text-dl-fg-muted">{hint.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-dl-fg-muted mt-2">
                  자릿수만으로는 단정할 수 없는 구간(11·12·14·15·17·18자리)이 있어 감지 결과를 항상
                  배지로 보여줍니다. 다르게 읽어야 하면 단위를 직접 지정하세요.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">알아둘 점</p>
                <ul className="list-disc space-y-1 pl-5 text-dl-fg-muted leading-6">
                  <li>
                    <span className="font-mono">2147483647</span> (2038-01-19 03:14:07 UTC) 이후는
                    32비트 부호 있는 정수로 담을 수 없습니다 — 2038년 문제.
                  </li>
                  <li>
                    나노초 19자리는 JavaScript 의 안전 정수 범위를 넘습니다. 이 도구는 BigInt 로
                    계산해 하위 자릿수를 보존합니다.
                  </li>
                  <li>
                    브라우저 시계는 밀리초까지만 제공하므로, 생성한 마이크로초·나노초 값의 하위
                    자리는 0 입니다.
                  </li>
                  <li>
                    서머타임이 있는 지역에서는 존재하지 않거나 두 번 존재하는 벽시계 시각이 생깁니다
                    — 해당하면 경고로 알려 드립니다.
                  </li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
