import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildEpochFromWallClock,
  buildZoneView,
  convertEpoch,
  countIntegerDigits,
  detectEpochUnit,
  EPOCH_UNIT_OPTIONS,
  formatEpochInUnit,
  formatOffsetLabel,
  formatRelativeKo,
  getRelativeParts,
  parseEpochInput,
  parseWallClockText,
  sanitizeEpochInput,
  splitEpochNs,
  toIsoUtc,
  wallClockToEpochMs,
} from '../../src/util/epochUtils.ts';

// 벽시계 조립 헬퍼 — 테스트 가독성만을 위한 것이다.
const wall = (year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0) => ({
  year,
  month,
  day,
  hour,
  minute,
  second,
  millisecond,
});

test('T1: 붙여넣기 잡음(콤마·따옴표·전각·유니코드 마이너스)을 걷어낸다', () => {
  assert.equal(sanitizeEpochInput('  1234567890  '), '1234567890');
  assert.equal(sanitizeEpochInput('1,234,567,890'), '1234567890');
  assert.equal(sanitizeEpochInput('"1234567890"'), '1234567890');
  assert.equal(sanitizeEpochInput('`1234567890`'), '1234567890');
  assert.equal(sanitizeEpochInput('1_234_567_890'), '1234567890');
  assert.equal(sanitizeEpochInput('＋１２３４５６７８９０'), '1234567890');
  assert.equal(sanitizeEpochInput('−1'), '-1');
  assert.equal(sanitizeEpochInput('+1234567890'), '1234567890');
});

test('T2: 자릿수 셈과 단위 감지 경계', () => {
  assert.equal(countIntegerDigits('0'), 1);
  assert.equal(countIntegerDigits('0000001234567890'), 10);
  assert.equal(countIntegerDigits('-1234567890.999'), 10);
  assert.equal(countIntegerDigits('.5'), 1);

  assert.equal(detectEpochUnit(1), 's');
  assert.equal(detectEpochUnit(10), 's');
  assert.equal(detectEpochUnit(11), 's');
  assert.equal(detectEpochUnit(12), 'ms');
  assert.equal(detectEpochUnit(13), 'ms');
  assert.equal(detectEpochUnit(14), 'ms');
  assert.equal(detectEpochUnit(15), 'us');
  assert.equal(detectEpochUnit(16), 'us');
  assert.equal(detectEpochUnit(17), 'us');
  assert.equal(detectEpochUnit(18), 'ns');
  assert.equal(detectEpochUnit(19), 'ns');
  assert.equal(detectEpochUnit(21), 'ns');
});

test('T3: 네 단위가 모두 같은 나노초 축으로 수렴한다', () => {
  assert.equal(parseEpochInput('1234567890').epochNs, 1234567890000000000n);
  assert.equal(parseEpochInput('1234567890').unit, 's');
  assert.equal(parseEpochInput('1234567890123').epochNs, 1234567890123000000n);
  assert.equal(parseEpochInput('1234567890123').unit, 'ms');
  assert.equal(parseEpochInput('1234567890123456').epochNs, 1234567890123456000n);
  assert.equal(parseEpochInput('1234567890123456').unit, 'us');
  assert.equal(parseEpochInput('1234567890123456789').epochNs, 1234567890123456789n);
  assert.equal(parseEpochInput('1234567890123456789').unit, 'ns');
});

test('T3b: 나노초는 Number 로 읽으면 뭉개진다 (BigInt 경로 회귀 방어선)', () => {
  // 소스의 숫자 리터럴도 같은 반올림을 겪으므로 비교는 문자열로 해야 의미가 있다.
  assert.equal(String(Number('1234567890123456789')), '1234567890123456800');
  assert.equal(parseEpochInput('1234567890123456789').epochNs, 1234567890123456789n);
  assert.equal(convertEpoch('1234567890123456789').info.nanoseconds, '1234567890123456789');
});

test('T4: 소수부가 단위 하위 정밀도로 흡수된다', () => {
  assert.equal(parseEpochInput('1788738999.123').epochNs, 1788738999123000000n);
  assert.equal(parseEpochInput('.5').epochNs, 500000000n);
  assert.equal(parseEpochInput('1234567890.').epochNs, 1234567890000000000n);
  assert.equal(parseEpochInput('1234567890123.5').epochNs, 1234567890123500000n);
  assert.equal(parseEpochInput('1.1234567891').epochNs, 1123456789n);
  assert.ok(parseEpochInput('1.1234567891').warning);
});

test('T5: 음수 소수의 부호는 크기 전체에 붙는다', () => {
  assert.equal(parseEpochInput('-1').epochNs, -1000000000n);
  assert.equal(parseEpochInput('-1.5').epochNs, -1500000000n);
  assert.equal(parseEpochInput('-86400').epochNs, -86400000000000n);
});

test('T6: splitEpochNs 는 음수에서도 잔여를 0 이상으로 유지한다 (floor 나눗셈)', () => {
  assert.deepEqual(splitEpochNs(1234567890123456789n), {
    epochMs: 1234567890123,
    subMsNs: 456789,
    subSecondNs: 123456789,
    wholeSeconds: 1234567890,
  });
  const negative = splitEpochNs(-1234000n);
  assert.equal(negative.epochMs, -2);
  assert.equal(negative.subMsNs, 766000);
  const minusOne = splitEpochNs(-1n);
  assert.equal(minusOne.epochMs, -1);
  assert.equal(minusOne.subMsNs, 999999);
  assert.deepEqual(splitEpochNs(0n), {
    epochMs: 0,
    subMsNs: 0,
    subSecondNs: 0,
    wholeSeconds: 0,
  });
});

test('T7: 잘못된 입력은 예외 대신 error 를 낸다', () => {
  for (const input of ['', 'abc', '1.2.3', '2026-09-07', '9'.repeat(25)]) {
    const parsed = parseEpochInput(input);
    assert.ok(parsed.error, `error expected for ${JSON.stringify(input)}`);
    assert.equal(parsed.epochNs, null);
  }
  assert.doesNotThrow(() => parseEpochInput(null));
  assert.doesNotThrow(() => parseEpochInput(undefined));
});

test('T8: 강제 단위가 자동 감지를 이기고, 감지 결과는 그대로 남는다', () => {
  const forced = parseEpochInput('1234567890', 'ms');
  assert.equal(forced.unit, 'ms');
  assert.equal(forced.detectedUnit, 's');
  assert.equal(forced.epochNs, 1234567890000000n);
  assert.ok(forced.warning);
  assert.equal(parseEpochInput('1234567890', 'auto').unit, 's');
});

test('T9: toIsoUtc 는 나노초 9자리를 보존한다', () => {
  assert.equal(toIsoUtc(0n), '1970-01-01T00:00:00.000000000Z');
  assert.equal(toIsoUtc(1234567890000000000n), '2009-02-13T23:31:30.000000000Z');
  assert.equal(toIsoUtc(1234567890123456789n), '2009-02-13T23:31:30.123456789Z');
  assert.equal(toIsoUtc(-1000000000n), '1969-12-31T23:59:59.000000000Z');
  assert.equal(toIsoUtc(-1n), '1969-12-31T23:59:59.999999999Z');
  assert.equal(toIsoUtc(2147483647000000000n), '2038-01-19T03:14:07.000000000Z');
  // 확장 연도(0000~9999 밖)에서도 정규식 치환이 깨지지 않는다.
  const ancient = toIsoUtc(-62198755200000000000n);
  assert.ok(ancient.endsWith('.000000000Z'), ancient);
  assert.ok(ancient.startsWith('-'), ancient);
});

test('T10: 오프셋 라벨 (반시간·45분 단위 포함)', () => {
  assert.equal(formatOffsetLabel(0), '+00:00');
  assert.equal(formatOffsetLabel(540), '+09:00');
  assert.equal(formatOffsetLabel(-240), '-04:00');
  assert.equal(formatOffsetLabel(330), '+05:30');
  assert.equal(formatOffsetLabel(345), '+05:45');
  assert.equal(formatOffsetLabel(765), '+12:45');
});

test('T11: 벽시계 문자열 파싱', () => {
  assert.deepEqual(parseWallClockText('2026-09-07').parts, wall(2026, 9, 7));
  assert.deepEqual(parseWallClockText('2026-09-07 12:30').parts, wall(2026, 9, 7, 12, 30));
  assert.deepEqual(parseWallClockText('2026-09-07 12:30:45').parts, wall(2026, 9, 7, 12, 30, 45));
  assert.deepEqual(parseWallClockText('2026-09-07T12:30:45').parts, wall(2026, 9, 7, 12, 30, 45));
  assert.deepEqual(
    parseWallClockText('2026-09-07 12:30:45.123').parts,
    wall(2026, 9, 7, 12, 30, 45, 123),
  );
  assert.equal(parseWallClockText('2026-09-07T12:30:45Z').explicitUtc, true);
  assert.equal(parseWallClockText('2026-09-07 12:30:45').explicitUtc, false);

  for (const input of ['2026-02-30', '2026-13-01', 'not a date', '']) {
    assert.ok(parseWallClockText(input).error, `error expected for ${JSON.stringify(input)}`);
  }
});

test('T12: UTC 벽시계 역변환', () => {
  assert.equal(wallClockToEpochMs(wall(2009, 2, 13, 23, 31, 30), 'utc').epochMs, 1234567890000);
  assert.equal(wallClockToEpochMs(wall(1970, 1, 1), 'utc').epochMs, 0);
  assert.equal(wallClockToEpochMs(wall(1969, 12, 31, 23, 59, 59), 'utc').epochMs, -1000);
  assert.equal(wallClockToEpochMs(wall(2009, 2, 13, 23, 31, 30), 'utc').ambiguity, 'none');
});

test('T13: 로컬 벽시계는 왕복해도 그대로다 (실행 타임존과 무관)', () => {
  const samples = [
    wall(1970, 1, 1, 0, 0, 0),
    wall(1999, 12, 31, 23, 59, 59),
    wall(2009, 2, 14, 8, 31, 30),
    wall(2026, 6, 15, 12, 0, 0),
    wall(2038, 1, 19, 3, 14, 7),
  ];
  for (const parts of samples) {
    const converted = wallClockToEpochMs(parts, 'local');
    assert.equal(converted.error, null);
    const view = buildZoneView(BigInt(converted.epochMs) * 1_000_000n, 'local', 0);
    assert.deepEqual(view.parts, parts, `roundtrip failed for ${JSON.stringify(parts)}`);
  }
});

test('T14: 단위별 값 포맷 — 정수는 floor, 소수는 부호-크기', () => {
  const value = 1234567890123456789n;
  assert.equal(formatEpochInUnit(value, 's'), '1234567890');
  assert.equal(formatEpochInUnit(value, 'ms'), '1234567890123');
  assert.equal(formatEpochInUnit(value, 'us'), '1234567890123456');
  assert.equal(formatEpochInUnit(value, 'ns'), '1234567890123456789');
  assert.equal(formatEpochInUnit(value, 's', true), '1234567890.123456789');
  assert.equal(formatEpochInUnit(-1500000000n, 's'), '-2');
  assert.equal(formatEpochInUnit(-1500000000n, 's', true), '-1.5');
  assert.equal(formatEpochInUnit(1234567890000000000n, 's', true), '1234567890');
});

test('T15: 상대시간은 문자열이 아니라 산식을 검증한다', () => {
  assert.deepEqual(getRelativeParts(0), { value: 0, unit: 'second' });
  assert.deepEqual(getRelativeParts(-30_000), { value: -30, unit: 'second' });
  assert.deepEqual(getRelativeParts(-3 * 86_400_000), { value: -3, unit: 'day' });
  assert.deepEqual(getRelativeParts(2 * 3_600_000), { value: 2, unit: 'hour' });
  assert.equal(getRelativeParts(-90 * 86_400_000).unit, 'month');
  assert.equal(getRelativeParts(-400 * 86_400_000).unit, 'year');
  // ICU 데이터 변동에 깨지지 않도록 문자열은 스모크만 본다.
  assert.match(formatRelativeKo(0, 3 * 86_400_000), /3일/);
});

test('T16: convertEpoch 통합 — nowMs 주입으로 현재 시각과 분리한다', () => {
  const { info, error } = convertEpoch('1234567890', { nowMs: 1234567890000 + 3 * 86_400_000 });
  assert.equal(error, null);
  assert.equal(info.unit, 's');
  assert.equal(info.detectedUnit, 's');
  assert.equal(info.digits, 10);
  assert.equal(info.epochMs, 1234567890000);
  assert.equal(info.isoUtc, '2009-02-13T23:31:30.000000000Z');
  assert.equal(info.utc.dateTime, '2009-02-13 23:31:30');
  assert.equal(info.utc.korean, '2009년 2월 13일 (금) 23:31:30');
  assert.equal(info.utc.offsetLabel, '+00:00');
  assert.equal(info.utc.iso, '2009-02-13T23:31:30Z');
  assert.equal(info.seconds, '1234567890');
  assert.equal(info.milliseconds, '1234567890000');
  assert.equal(info.microseconds, '1234567890000000');
  assert.equal(info.nanoseconds, '1234567890000000000');
  assert.match(info.relative, /3일/);
  // 로컬 뷰는 실행 타임존에 따라 달라지므로 구조만 본다.
  assert.match(info.local.offsetLabel, /^[+-]\d{2}:\d{2}$/);
});

test('T16b: 나노초 입력은 표시 문자열에서도 하위 자릿수가 살아있다', () => {
  const { info } = convertEpoch('1234567890123456789', { nowMs: 1234567890123 });
  assert.equal(info.unit, 'ns');
  assert.equal(info.utc.dateTime, '2009-02-13 23:31:30.123456789');
  assert.equal(info.utc.iso, '2009-02-13T23:31:30.123456789Z');
});

test('T17: buildEpochFromWallClock 통합', () => {
  const utc = buildEpochFromWallClock('2009-02-13 23:31:30', 'utc');
  assert.equal(utc.error, null);
  assert.equal(utc.info.seconds, '1234567890');
  assert.equal(utc.ambiguity, 'none');

  assert.equal(buildEpochFromWallClock('1970-01-01 00:00:00', 'utc').info.epochNs, 0n);
  assert.ok(buildEpochFromWallClock('bad', 'utc').error);

  // 'Z' 가 붙으면 기준 선택보다 입력이 우선한다.
  const explicit = buildEpochFromWallClock('2009-02-13T23:31:30Z', 'local');
  assert.equal(explicit.zone, 'utc');
  assert.equal(explicit.info.seconds, '1234567890');
});

test('T18: Select 용 상수 무결성', () => {
  assert.deepEqual(
    EPOCH_UNIT_OPTIONS.map((option) => option.value),
    ['auto', 's', 'ms', 'us', 'ns'],
  );
});
