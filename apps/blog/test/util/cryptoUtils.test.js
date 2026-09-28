import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_AES_PBKDF2_OPTIONS,
  decryptAesGcm,
  decryptAesPbkdf2,
  decryptAesRawKey,
  ENC_V1_MARKER,
  encryptAesGcm,
  encryptAesPbkdf2,
  encryptAesRawKey,
} from '../../src/util/cryptoUtils.ts';

// 테스트 전용 더미 키/salt. 반복 횟수는 속도를 위해 낮추고, Java 벡터 검증만 실제 기본값(600000)을 쓴다.
const GCM_SECRET = 'blog-test-only-secret-key-0123456789';
const GCM_OPTIONS = { keyLength: 256, iterations: 1000, salt: 'test-kdf-salt-v1' };

// Java AESUtil(GCM)과 동일한 JCE 호출(PBKDF2WithHmacSHA256 600000회 + AES/GCM/NoPadding)로 생성한 벡터
const JAVA_GCM_VECTOR = {
  options: { keyLength: 256, iterations: 600000, salt: 'test-kdf-salt-v1' },
  cipherText:
    'enc:v1:2ra9JHLNDOmfRk_NEcTy01X-ia2p9u1SgYd2FfHuHDOrjL-5VWfteVMcGys7FzLjRmi4y7bDaH_uhbBxOpB3WpVEto09WAzmwO_nJA',
  plainText: '홍길동 010-1234-5678 서울시 강남구 😀',
};

test('AES-GCM roundtrip handles Korean and emoji with enc:v1 URL-safe output', async () => {
  const input = '서울시 강남구 테헤란로 😀 010-1234-5678';
  const encrypted = await encryptAesGcm(input, GCM_SECRET, GCM_OPTIONS);

  assert.ok(encrypted.startsWith(ENC_V1_MARKER));
  assert.doesNotMatch(encrypted.slice(ENC_V1_MARKER.length), /[+/=]/);
  assert.equal(await decryptAesGcm(encrypted, GCM_SECRET, GCM_OPTIONS), input);
});

test('AES-GCM uses a random IV so the same input encrypts differently', async () => {
  const first = await encryptAesGcm('same', GCM_SECRET, GCM_OPTIONS);
  const second = await encryptAesGcm('same', GCM_SECRET, GCM_OPTIONS);

  assert.notEqual(first, second);
});

test('AES-GCM decrypts a ciphertext produced by the Java implementation', async () => {
  const decrypted = await decryptAesGcm(
    JAVA_GCM_VECTOR.cipherText,
    GCM_SECRET,
    JAVA_GCM_VECTOR.options,
  );

  assert.equal(decrypted, JAVA_GCM_VECTOR.plainText);
});

test('AES-GCM rejects a tampered tag and a wrong key', async () => {
  const encrypted = await encryptAesGcm('tamper-check', GCM_SECRET, GCM_OPTIONS);
  const payload = Buffer.from(encrypted.slice(ENC_V1_MARKER.length), 'base64url');
  payload[payload.length - 1] ^= 0x01;
  const tampered = ENC_V1_MARKER + payload.toString('base64url');

  await assert.rejects(decryptAesGcm(tampered, GCM_SECRET, GCM_OPTIONS), /복호화에 실패/);
  await assert.rejects(
    decryptAesGcm(encrypted, 'another-test-only-secret-key-987654321', GCM_OPTIONS),
    /복호화에 실패/,
  );
});

test('AES-GCM validates secret length, salt and payload length', async () => {
  await assert.rejects(encryptAesGcm('x', 'a'.repeat(31), GCM_OPTIONS), /32자 이상/);
  await assert.rejects(encryptAesGcm('x', GCM_SECRET, { ...GCM_OPTIONS, salt: '' }), /고정 Salt/);

  const shortPayload = ENC_V1_MARKER + Buffer.alloc(27).toString('base64url');
  await assert.rejects(decryptAesGcm(shortPayload, GCM_SECRET, GCM_OPTIONS), /길이가 올바르지/);
});

test('AES-CBC PBKDF2 and raw key modes still roundtrip', async () => {
  const pbkdf2Options = { ...DEFAULT_AES_PBKDF2_OPTIONS, iterations: 1000 };
  const pbkdf2Encrypted = await encryptAesPbkdf2('pbkdf2 한글', 'passphrase', pbkdf2Options);
  assert.equal(await decryptAesPbkdf2(pbkdf2Encrypted, 'passphrase', pbkdf2Options), 'pbkdf2 한글');

  const rawKey = '0123456789abcdef';
  const rawEncrypted = await encryptAesRawKey('rawkey 한글', rawKey);
  assert.equal(await decryptAesRawKey(rawEncrypted, rawKey), 'rawkey 한글');
});
