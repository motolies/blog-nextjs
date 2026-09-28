const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;

/** 암호문 식별 마커. enc:v1 포맷의 암호문은 모두 이 prefix를 가진다. */
export const ENC_V1_MARKER = 'enc:v1:';

const AES_BLOCK_SIZE = 16;

/** PBKDF2 + CBC 모드의 파라미터. Java AESUtil의 상수(KEY_LENGTH/ITERATION_COUNT/SALT_LENGTH/IV_LENGTH)와 1:1 대응 */
export interface AesPbkdf2Options {
  keyLength: number; // bit (128 | 192 | 256)
  iterations: number; // PBKDF2 반복 횟수
  saltLength: number; // byte
  ivLength: number; // byte (AES-CBC는 16 고정)
}

/** Java AESUtil과 동일한 기본 파라미터 */
export const DEFAULT_AES_PBKDF2_OPTIONS: AesPbkdf2Options = {
  keyLength: 256,
  iterations: 8192,
  saltLength: 16,
  ivLength: 16,
};

/** 고정 salt PBKDF2 + AES-GCM 모드의 파라미터. Java AESUtil(GCM)의 KDF 상수(KEY_BITS/KDF_ITERATIONS/KDF_SALT)와 1:1 대응 */
export interface AesGcmOptions {
  keyLength: number; // bit (128 | 192 | 256)
  iterations: number; // PBKDF2 반복 횟수
  salt: string; // 모든 암호문에 공통으로 쓰는 고정 salt (UTF-8)
}

/** GCM 모드 기본 파라미터. 고정 salt는 시스템마다 달라 기본값을 두지 않는다. */
export const DEFAULT_AES_GCM_OPTIONS: AesGcmOptions = {
  keyLength: 256,
  iterations: 600_000,
  salt: '',
};

/** GCM 모드 Secret Key 최소 길이. Java String.length()와 같은 UTF-16 code unit 기준 문자 수 */
export const AES_GCM_MIN_KEY_LENGTH = 32;

const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;

// Raw Key 모드(레거시)에서 사용하는 고정 Zero IV
const ZERO_IV = new Uint8Array(AES_BLOCK_SIZE);

/** PBKDF2 공통 파라미터(키 길이/반복 횟수)의 유효 범위를 검증한다. */
const validateKdfParams = (keyLength: number, iterations: number): void => {
  if (keyLength !== 128 && keyLength !== 192 && keyLength !== 256) {
    throw new Error('키 길이는 128/192/256비트만 사용할 수 있습니다.');
  }
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error('반복 횟수는 1 이상의 정수여야 합니다.');
  }
};

/** PBKDF2 옵션 값의 유효 범위를 검증한다. 위반 시 한글 에러를 던진다. */
const validatePbkdf2Options = (options: AesPbkdf2Options): void => {
  validateKdfParams(options.keyLength, options.iterations);
  if (!Number.isInteger(options.saltLength) || options.saltLength < 1 || options.saltLength > 64) {
    throw new Error('Salt 길이는 1~64바이트 범위여야 합니다.');
  }
  if (options.ivLength !== AES_BLOCK_SIZE) {
    throw new Error('AES-CBC의 IV는 16바이트여야 합니다.');
  }
};

/** GCM 옵션 값의 유효 범위를 검증한다. 고정 salt는 비어 있을 수 없다. */
const validateGcmOptions = (options: AesGcmOptions): void => {
  validateKdfParams(options.keyLength, options.iterations);
  if (!options.salt) {
    throw new Error('고정 Salt를 입력하세요.');
  }
};

/**
 * GCM 모드 Secret Key를 검증한다. Java AESUtil(GCM)과 같이 공백뿐인 키와 32자 미만 키를 거부한다.
 * 길이는 UTF-16 code unit 수(Java String.length()와 동일)로 세며, 앞뒤 공백도 키의 일부로 본다.
 */
const validateGcmSecret = (secret: string): void => {
  if (!secret.trim()) {
    throw new Error('Secret Key를 입력하세요.');
  }
  if (secret.length < AES_GCM_MIN_KEY_LENGTH) {
    throw new Error(
      `Secret Key는 ${AES_GCM_MIN_KEY_LENGTH}자 이상이어야 합니다. (현재 ${secret.length}자)`,
    );
  }
};

/** 텍스트 인코더/디코더 사용 가능 여부를 확인한다. */
const ensureTextCodec = (): void => {
  if (!encoder || !decoder) {
    throw new Error('텍스트 인코더를 사용할 수 없습니다.');
  }
};

/** Web Crypto API(crypto.subtle) 사용 가능 여부를 확인한다. HTTPS 또는 localhost가 아니면 제공되지 않는다. */
const ensureSubtleCrypto = (): SubtleCrypto => {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error(
      '이 환경에서는 Web Crypto API를 사용할 수 없습니다. (HTTPS 또는 localhost에서만 동작)',
    );
  }
  return crypto.subtle;
};

/** 표준/URL-safe, 패딩 유무를 모두 허용하도록 Base64 문자열을 표준 형태로 정규화한다. */
const normalizeBase64Value = (value: string): string => {
  const sanitized = value.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  return sanitized.padEnd(sanitized.length + ((4 - (sanitized.length % 4)) % 4), '=');
};

/** 바이트 배열을 표준 Base64 문자열로 인코딩한다. */
export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

/** Base64 문자열(표준/URL-safe, 패딩 유무 무관)을 바이트 배열로 디코딩한다. */
export const base64ToBytes = (value: string): Uint8Array => {
  const normalized = normalizeBase64Value(value);
  let binary: string;
  try {
    binary = atob(normalized);
  } catch {
    throw new Error('유효하지 않은 Base64 문자열입니다.');
  }
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

/** 바이트 배열을 URL-safe Base64(패딩 없음)로 인코딩한다. Java Base64.getUrlEncoder().withoutPadding() 호환. */
export const base64UrlEncodeNoPad = (bytes: Uint8Array): string =>
  bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** 문자열의 UTF-8 바이트 길이를 반환한다. (Raw Key 길이 표시용) */
export const utf8ByteLength = (value: string): number =>
  encoder ? encoder.encode(value).length : 0;

/**
 * 패스프레이즈와 salt로 AES 키를 유도한다.
 * Java의 PBKDF2WithHmacSHA256과 동일한 방식이며, 반복 횟수/키 길이는 옵션으로, 키 용도(CBC/GCM)는 algorithm으로 지정한다.
 */
const derivePbkdf2Key = async (
  passphrase: string,
  salt: Uint8Array,
  options: Pick<AesPbkdf2Options, 'keyLength' | 'iterations'>,
  algorithm: 'AES-CBC' | 'AES-GCM' = 'AES-CBC',
): Promise<CryptoKey> => {
  const subtle = ensureSubtleCrypto();
  const baseKey = await subtle.importKey('raw', encoder!.encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: options.iterations },
    baseKey,
    { name: algorithm, length: options.keyLength },
    false,
    ['encrypt', 'decrypt'],
  );
};

/** enc:v1 암호문에서 마커를 제거(없으면 그대로 사용)하고 payload를 바이트 배열로 디코딩한다. */
const decodeEncV1Payload = (encryptedText: string): Uint8Array => {
  const trimmed = encryptedText.trim();
  const payload = trimmed.startsWith(ENC_V1_MARKER) ? trimmed.slice(ENC_V1_MARKER.length) : trimmed;
  return base64ToBytes(payload);
};

/**
 * PBKDF2 + AES-CBC 암호화 (enc:v1 포맷).
 * 랜덤 salt/iv를 생성해 [salt + iv + 암호문]을 URL-safe Base64(패딩 없음)로 인코딩하고 마커를 붙인다.
 */
export const encryptAesPbkdf2 = async (
  plainText: string,
  passphrase: string,
  options: AesPbkdf2Options = DEFAULT_AES_PBKDF2_OPTIONS,
): Promise<string> => {
  ensureTextCodec();
  validatePbkdf2Options(options);
  const subtle = ensureSubtleCrypto();

  const salt = crypto.getRandomValues(new Uint8Array(options.saltLength));
  const iv = crypto.getRandomValues(new Uint8Array(options.ivLength));
  const key = await derivePbkdf2Key(passphrase, salt, options);

  const cipherBuffer = await subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    encoder!.encode(plainText),
  );
  const cipherBytes = new Uint8Array(cipherBuffer);

  const combined = new Uint8Array(options.saltLength + options.ivLength + cipherBytes.length);
  combined.set(salt, 0);
  combined.set(iv, options.saltLength);
  combined.set(cipherBytes, options.saltLength + options.ivLength);

  return ENC_V1_MARKER + base64UrlEncodeNoPad(combined);
};

/**
 * PBKDF2 + AES-CBC 복호화 (enc:v1 포맷).
 * 마커가 있으면 제거하고, 없어도 동일 포맷으로 간주하여 복호화를 시도한다.
 * 디버깅 도구이므로 실패 시 원문 반환 대신 명확한 에러를 던진다.
 */
export const decryptAesPbkdf2 = async (
  encryptedText: string,
  passphrase: string,
  options: AesPbkdf2Options = DEFAULT_AES_PBKDF2_OPTIONS,
): Promise<string> => {
  ensureTextCodec();
  validatePbkdf2Options(options);
  const subtle = ensureSubtleCrypto();

  const bytes = decodeEncV1Payload(encryptedText);

  if (bytes.length < options.saltLength + options.ivLength + AES_BLOCK_SIZE) {
    throw new Error(
      `암호문 길이가 올바르지 않습니다. (salt ${options.saltLength} + iv ${options.ivLength} + 암호문 최소 16바이트 필요)`,
    );
  }

  const salt = bytes.slice(0, options.saltLength);
  const iv = bytes.slice(options.saltLength, options.saltLength + options.ivLength);
  const cipherBytes = bytes.slice(options.saltLength + options.ivLength);
  const key = await derivePbkdf2Key(passphrase, salt, options);

  try {
    const plainBuffer = await subtle.decrypt({ name: 'AES-CBC', iv }, key, cipherBytes);
    return decoder!.decode(plainBuffer);
  } catch {
    throw new Error('복호화에 실패했습니다. 키가 다르거나 데이터가 손상되었습니다.');
  }
};

/**
 * 고정 salt PBKDF2 + AES-GCM 암호화 (enc:v1 포맷, Java AESUtil(GCM) 호환).
 * 랜덤 IV(12바이트)를 생성해 [iv + 암호문 + 인증 태그(16)]를 URL-safe Base64(패딩 없음)로 인코딩하고 마커를 붙인다.
 * Web Crypto의 AES-GCM 결과는 JCE doFinal과 같이 암호문 뒤에 태그가 붙어 있으므로 iv 뒤에 그대로 잇는다.
 */
export const encryptAesGcm = async (
  plainText: string,
  secret: string,
  options: AesGcmOptions = DEFAULT_AES_GCM_OPTIONS,
): Promise<string> => {
  ensureTextCodec();
  validateGcmOptions(options);
  validateGcmSecret(secret);
  const subtle = ensureSubtleCrypto();

  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH));
  const key = await derivePbkdf2Key(secret, encoder!.encode(options.salt), options, 'AES-GCM');

  const cipherBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: GCM_TAG_LENGTH * 8 },
    key,
    encoder!.encode(plainText),
  );
  const cipherBytes = new Uint8Array(cipherBuffer);

  const combined = new Uint8Array(GCM_IV_LENGTH + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, GCM_IV_LENGTH);

  return ENC_V1_MARKER + base64UrlEncodeNoPad(combined);
};

/**
 * 고정 salt PBKDF2 + AES-GCM 복호화 (enc:v1 포맷).
 * 마커가 있으면 제거하고, 없어도 동일 포맷으로 간주하여 복호화를 시도한다.
 * 인증 태그 검증에 실패하면(키/salt 불일치 또는 변조) 원문 반환 대신 명확한 에러를 던진다.
 */
export const decryptAesGcm = async (
  encryptedText: string,
  secret: string,
  options: AesGcmOptions = DEFAULT_AES_GCM_OPTIONS,
): Promise<string> => {
  ensureTextCodec();
  validateGcmOptions(options);
  validateGcmSecret(secret);
  const subtle = ensureSubtleCrypto();

  const bytes = decodeEncV1Payload(encryptedText);

  if (bytes.length < GCM_IV_LENGTH + GCM_TAG_LENGTH) {
    throw new Error(
      `암호문 길이가 올바르지 않습니다. (iv ${GCM_IV_LENGTH} + 인증 태그 ${GCM_TAG_LENGTH}바이트 이상 필요)`,
    );
  }

  const iv = bytes.slice(0, GCM_IV_LENGTH);
  const cipherBytes = bytes.slice(GCM_IV_LENGTH);
  const key = await derivePbkdf2Key(secret, encoder!.encode(options.salt), options, 'AES-GCM');

  try {
    const plainBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: GCM_TAG_LENGTH * 8 },
      key,
      cipherBytes,
    );
    return decoder!.decode(plainBuffer);
  } catch {
    throw new Error('복호화에 실패했습니다. 키/Salt가 다르거나 데이터가 손상되었습니다.');
  }
};

/** Secret Key 문자열(UTF-8 16/24/32바이트)을 AES 키로 임포트한다. KDF 없이 바이트를 그대로 사용한다. */
const importRawAesKey = async (secretKey: string): Promise<CryptoKey> => {
  const subtle = ensureSubtleCrypto();
  const keyBytes = encoder!.encode(secretKey);

  if (keyBytes.length !== 16 && keyBytes.length !== 24 && keyBytes.length !== 32) {
    throw new Error(
      `Secret Key는 UTF-8 기준 16/24/32바이트여야 합니다. (현재 ${keyBytes.length}바이트)`,
    );
  }

  return subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['encrypt', 'decrypt']);
};

/**
 * Raw Key AES-CBC 암호화 (레거시 포맷).
 * 고정 Zero IV를 사용하므로 같은 입력은 항상 같은 출력이 나온다. 결과는 표준 Base64.
 */
export const encryptAesRawKey = async (plainText: string, secretKey: string): Promise<string> => {
  ensureTextCodec();
  const subtle = ensureSubtleCrypto();

  const key = await importRawAesKey(secretKey);
  const cipherBuffer = await subtle.encrypt(
    { name: 'AES-CBC', iv: ZERO_IV },
    key,
    encoder!.encode(plainText),
  );

  return bytesToBase64(new Uint8Array(cipherBuffer));
};

/** Raw Key AES-CBC 복호화 (레거시 포맷). 고정 Zero IV + 표준 Base64 입력. */
export const decryptAesRawKey = async (
  cipherTextBase64: string,
  secretKey: string,
): Promise<string> => {
  ensureTextCodec();
  const subtle = ensureSubtleCrypto();

  const key = await importRawAesKey(secretKey);
  const cipherBytes = base64ToBytes(cipherTextBase64.trim());

  if (cipherBytes.length === 0 || cipherBytes.length % AES_BLOCK_SIZE !== 0) {
    throw new Error('암호문 길이가 올바르지 않습니다. (16바이트 블록 단위여야 함)');
  }

  try {
    const plainBuffer = await subtle.decrypt(
      { name: 'AES-CBC', iv: ZERO_IV },
      key,
      cipherBytes as BufferSource,
    );
    return decoder!.decode(plainBuffer);
  } catch {
    throw new Error('복호화에 실패했습니다. 키가 다르거나 데이터가 손상되었습니다.');
  }
};
