'use client';

import { Button, Input, Select, showToast, Tab, TabList, TabPanel, Tabs, Textarea } from '@hvy/ui';
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Settings2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { copyTextToClipboard } from '@/util/browserUtils';
import {
  AES_GCM_MIN_KEY_LENGTH,
  DEFAULT_AES_GCM_OPTIONS,
  DEFAULT_AES_PBKDF2_OPTIONS,
  decryptAesGcm,
  decryptAesPbkdf2,
  decryptAesRawKey,
  encryptAesGcm,
  encryptAesPbkdf2,
  encryptAesRawKey,
  utf8ByteLength,
} from '@/util/cryptoUtils';

function CopyButton({ value, onCopy }) {
  return (
    <button
      type="button"
      onClick={() => void onCopy(value)}
      className="absolute right-2 top-2 p-1 rounded hover:bg-dl-option-hover"
      title="복사"
    >
      <Copy className="h-4 w-4 text-dl-fg-muted" />
    </button>
  );
}

const TEXTAREA_MIN_HEIGHT_CLASS = 'min-h-[15rem] resize-y';

// 고급 설정 입력값은 문자열로 보관하고 실행 시 숫자로 파싱한다
const DEFAULT_OPTION_INPUTS = {
  keyLength: String(DEFAULT_AES_PBKDF2_OPTIONS.keyLength),
  iterations: String(DEFAULT_AES_PBKDF2_OPTIONS.iterations),
  saltLength: String(DEFAULT_AES_PBKDF2_OPTIONS.saltLength),
  ivLength: String(DEFAULT_AES_PBKDF2_OPTIONS.ivLength),
};

// GCM 모드 고급 설정 입력값. 고정 salt 는 필수값이라 고급 설정과 분리해 별도 상태로 관리한다
const DEFAULT_GCM_OPTION_INPUTS = {
  keyLength: String(DEFAULT_AES_GCM_OPTIONS.keyLength),
  iterations: String(DEFAULT_AES_GCM_OPTIONS.iterations),
};

const KEY_LENGTH_OPTIONS = [
  { value: '128', label: '128' },
  { value: '192', label: '192' },
  { value: '256', label: '256' },
];

const AES_MODES = [
  {
    id: 'pbkdf2',
    label: 'PBKDF2 + AES-CBC (enc:v1 포맷)',
    keyPlaceholder: '패스프레이즈 (PBKDF2로 키 유도)',
    inputPlaceholder: '평문 또는 enc:v1:... 형식의 암호문을 입력하세요',
    formatNote: '',
  },
  {
    id: 'gcm',
    label: 'PBKDF2(고정 salt) + AES-GCM (enc:v1 포맷)',
    keyPlaceholder: `Secret Key (${AES_GCM_MIN_KEY_LENGTH}자 이상, PBKDF2로 키 유도)`,
    inputPlaceholder: '평문 또는 enc:v1:... 형식의 암호문을 입력하세요',
    formatNote:
      'iv(12) + 암호문 + 인증 태그(16)를 URL-safe Base64(패딩 없음)로 인코딩하고 enc:v1: 접두어를 붙입니다. IV가 매번 랜덤이라 같은 입력도 결과가 매번 다릅니다. PBKDF2 + AES-CBC와 접두어가 같아 암호문만으로는 모드를 구분할 수 없으니, 복호화에 실패하면 다른 모드도 시도해 보세요.',
  },
  {
    id: 'rawkey',
    label: 'Raw Key AES-CBC (Zero IV, 레거시)',
    keyPlaceholder: 'Secret Key (UTF-8 기준 16/24/32바이트)',
    inputPlaceholder: '평문 또는 Base64 암호문을 입력하세요',
    formatNote:
      'IV가 0으로 고정되어 같은 입력은 항상 같은 출력이 나옵니다. 결과는 표준 Base64입니다. 레거시 호환용으로, 신규 데이터에는 사용을 권장하지 않습니다.',
  },
];

export default function CryptoPage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState('aes');
  const [isClient, setIsClient] = useState(false);

  const [aesMode, setAesMode] = useState('pbkdf2');
  const [secretKey, setSecretKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [optionInputs, setOptionInputs] = useState(DEFAULT_OPTION_INPUTS);
  const [gcmOptionInputs, setGcmOptionInputs] = useState(DEFAULT_GCM_OPTION_INPUTS);
  const [gcmSalt, setGcmSalt] = useState(DEFAULT_AES_GCM_OPTIONS.salt);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 탭/모드 변경 시 입출력만 초기화 (키는 유지)
  useEffect(() => {
    setInput('');
    setOutput('');
  }, [tabValue, aesMode]);

  const currentMode = AES_MODES.find((mode) => mode.id === aesMode) ?? AES_MODES[0];
  const keyByteLength = utf8ByteLength(secretKey);

  // PBKDF2 모드의 포맷 설명은 현재 설정값을 반영하여 동적으로 구성한다
  const formatNote =
    aesMode === 'pbkdf2'
      ? `salt(${optionInputs.saltLength}) + iv(${optionInputs.ivLength}) + 암호문을 URL-safe Base64(패딩 없음)로 인코딩하고 enc:v1: 접두어를 붙입니다. salt/IV가 매번 랜덤이라 같은 입력도 결과가 매번 다릅니다.`
      : currentMode.formatNote;

  // 고급 설정 입력 문자열을 숫자 옵션으로 변환한다 (유효성 검증은 cryptoUtils 에서 수행)
  const parsePbkdf2Options = () => ({
    keyLength: Number(optionInputs.keyLength),
    iterations: Number(optionInputs.iterations),
    saltLength: Number(optionInputs.saltLength),
    ivLength: Number(optionInputs.ivLength),
  });

  // GCM 고급 설정 입력 문자열과 고정 salt 를 옵션으로 변환한다 (유효성 검증은 cryptoUtils 에서 수행)
  const parseGcmOptions = () => ({
    keyLength: Number(gcmOptionInputs.keyLength),
    iterations: Number(gcmOptionInputs.iterations),
    salt: gcmSalt,
  });

  const updateOption = (field, value) => {
    setOptionInputs((prev) => ({ ...prev, [field]: value }));
  };

  const updateGcmOption = (field, value) => {
    setGcmOptionInputs((prev) => ({ ...prev, [field]: value }));
  };

  // 현재 모드의 고급 설정만 기본값으로 되돌린다 (고정 salt 는 유지)
  const resetAdvancedOptions = () => {
    if (aesMode === 'gcm') {
      setGcmOptionInputs(DEFAULT_GCM_OPTION_INPUTS);
    } else {
      setOptionInputs(DEFAULT_OPTION_INPUTS);
    }
  };

  // 모드별 키 길이 안내를 구성한다 (rawkey: UTF-8 바이트 수, gcm: 문자 수). 안내가 없는 모드는 null
  const getKeyHint = () => {
    if (!secretKey) return null;
    if (aesMode === 'rawkey') {
      const valid = [16, 24, 32].includes(keyByteLength);
      return {
        valid,
        text: `현재 ${keyByteLength}바이트 ${valid ? '(사용 가능)' : '(16/24/32바이트 필요)'}`,
      };
    }
    if (aesMode === 'gcm') {
      const valid = secretKey.length >= AES_GCM_MIN_KEY_LENGTH;
      return {
        valid,
        text: `현재 ${secretKey.length}자 ${valid ? '(사용 가능)' : `(${AES_GCM_MIN_KEY_LENGTH}자 이상 필요)`}`,
      };
    }
    return null;
  };
  const keyHint = getKeyHint();

  const handleCopy = async (text) => {
    if (!text) {
      showToast('복사할 내용이 없습니다.', 'warning');
      return;
    }

    try {
      await copyTextToClipboard(text);
      showToast('클립보드에 복사되었습니다.');
    } catch (e) {
      showToast(e.message || '클립보드 복사에 실패했습니다.', 'error');
    }
  };

  const handleSwap = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
  };

  // 암복호화 실행 전 키/입력값 존재 여부를 검증한다.
  const validateInputs = () => {
    if (!secretKey) {
      showToast('키를 입력하세요.', 'warning');
      return false;
    }
    if (aesMode === 'gcm' && !gcmSalt) {
      showToast('고정 Salt를 입력하세요.', 'warning');
      return false;
    }
    if (!input) {
      showToast('입력값을 입력하세요.', 'warning');
      return false;
    }
    return true;
  };

  // 모드별 암복호화 실행 함수. 모드를 추가하면 AES_MODES 와 함께 여기에 등록한다
  const aesHandlers = {
    pbkdf2: {
      encrypt: () => encryptAesPbkdf2(input, secretKey, parsePbkdf2Options()),
      decrypt: () => decryptAesPbkdf2(input, secretKey, parsePbkdf2Options()),
    },
    gcm: {
      encrypt: () => encryptAesGcm(input, secretKey, parseGcmOptions()),
      decrypt: () => decryptAesGcm(input, secretKey, parseGcmOptions()),
    },
    rawkey: {
      encrypt: () => encryptAesRawKey(input, secretKey),
      decrypt: () => decryptAesRawKey(input, secretKey),
    },
  };

  const handleEncrypt = async () => {
    if (!validateInputs()) return;
    try {
      const result = await aesHandlers[aesMode].encrypt();
      setOutput(result);
      showToast('암호화 완료');
    } catch (e) {
      setOutput('');
      showToast(`암호화 실패: ${e.message}`, 'error');
    }
  };

  const handleDecrypt = async () => {
    if (!validateInputs()) return;
    try {
      const result = await aesHandlers[aesMode].decrypt();
      setOutput(result);
      showToast('복호화 완료');
    } catch (e) {
      setOutput('');
      showToast(`복호화 실패: ${e.message}`, 'error');
    }
  };

  if (!isClient) {
    return <div className="p-4 flex justify-center items-center min-h-[50vh]">로딩 중...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button className="aspect-square p-0" variant="ghost" onClick={() => router.push('/util')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold">암호화 도구</h1>
      </div>

      <div className="border rounded-md">
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabList className="w-full flex h-auto border-b rounded-none justify-start px-2 py-1 gap-1 overflow-x-auto">
            <Tab value="aes" className="flex-none">
              AES
            </Tab>
          </TabList>

          <div className="p-2 sm:p-4">
            <TabPanel value="aes">
              <div className="space-y-3">
                <Select
                  value={aesMode}
                  onValueChange={setAesMode}
                  placeholder="암호화 모드 선택"
                  options={AES_MODES.map((mode) => ({ value: mode.id, label: mode.label }))}
                  className="w-full sm:w-96"
                />

                <div>
                  <div className="relative">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder={currentMode.keyPlaceholder}
                      className="pr-9 font-mono"
                      autoComplete="off"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-dl-option-hover"
                      title={showKey ? '키 숨기기' : '키 보기'}
                      type="button"
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4 text-dl-fg-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-dl-fg-muted" />
                      )}
                    </button>
                  </div>
                  {keyHint && (
                    <p
                      className={`mt-1 text-xs ${keyHint.valid ? 'text-dl-fg-muted' : 'text-dl-error'}`}
                    >
                      {keyHint.text}
                    </p>
                  )}
                </div>

                {aesMode === 'gcm' && (
                  <Input
                    value={gcmSalt}
                    onChange={(e) => setGcmSalt(e.target.value)}
                    placeholder="고정 Salt (UTF-8 문자열, 모든 암호문에 공통)"
                    aria-label="고정 Salt"
                    className="font-mono"
                    autoComplete="off"
                  />
                )}

                {(aesMode === 'pbkdf2' || aesMode === 'gcm') && (
                  <div>
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-1 text-sm text-dl-fg-muted hover:text-dl-fg"
                      type="button"
                    >
                      <Settings2 className="h-4 w-4" />
                      고급 설정
                      {showAdvanced ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {showAdvanced && aesMode === 'gcm' && (
                      <div className="mt-2 p-3 border rounded-md space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="crypto-gcm-key-length"
                              className="text-xs text-dl-fg-muted mb-1 block"
                            >
                              키 길이 (bit)
                            </label>
                            <Select
                              id="crypto-gcm-key-length"
                              value={gcmOptionInputs.keyLength}
                              onValueChange={(value) => updateGcmOption('keyLength', value)}
                              placeholder="키 길이"
                              options={KEY_LENGTH_OPTIONS}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="crypto-gcm-iterations"
                              className="text-xs text-dl-fg-muted mb-1 block"
                            >
                              반복 횟수 (PBKDF2)
                            </label>
                            <Input
                              id="crypto-gcm-iterations"
                              type="number"
                              min={1}
                              value={gcmOptionInputs.iterations}
                              onChange={(e) => updateGcmOption('iterations', e.target.value)}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-dl-fg-muted">
                          IV 12바이트, 인증 태그 128bit는 고정입니다.
                        </p>
                        <Button variant="outline-gray" size="sm" onClick={resetAdvancedOptions}>
                          기본값으로 재설정
                        </Button>
                      </div>
                    )}

                    {showAdvanced && aesMode === 'pbkdf2' && (
                      <div className="mt-2 p-3 border rounded-md space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-dl-fg-muted mb-1 block">
                              키 길이 (bit)
                            </label>
                            <Select
                              value={optionInputs.keyLength}
                              onValueChange={(value) => updateOption('keyLength', value)}
                              placeholder="키 길이"
                              options={KEY_LENGTH_OPTIONS}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-dl-fg-muted mb-1 block">
                              반복 횟수 (PBKDF2)
                            </label>
                            <Input
                              type="number"
                              min={1}
                              value={optionInputs.iterations}
                              onChange={(e) => updateOption('iterations', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-dl-fg-muted mb-1 block">
                              Salt 길이 (byte)
                            </label>
                            <Input
                              type="number"
                              min={1}
                              max={64}
                              value={optionInputs.saltLength}
                              onChange={(e) => updateOption('saltLength', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-dl-fg-muted mb-1 block">
                              IV 길이 (byte)
                            </label>
                            <Input
                              type="number"
                              value={optionInputs.ivLength}
                              onChange={(e) => updateOption('ivLength', e.target.value)}
                            />
                            {optionInputs.ivLength !== '16' && (
                              <p className="mt-1 text-xs text-dl-error">
                                AES-CBC의 IV는 16바이트여야 합니다.
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="outline-gray" size="sm" onClick={resetAdvancedOptions}>
                          기본값으로 재설정
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={currentMode.inputPlaceholder}
                  rows={10}
                  className={`${TEXTAREA_MIN_HEIGHT_CLASS} font-mono text-sm`}
                />

                <div className="flex gap-2 justify-center items-center">
                  <Button variant="primary" onClick={handleEncrypt}>
                    암호화
                  </Button>
                  <Button variant="primary" onClick={handleDecrypt}>
                    복호화
                  </Button>
                  <Button
                    className="aspect-square p-0"
                    variant="ghost"
                    onClick={handleSwap}
                    title="입력/출력 스왑"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  {/* 잠긴 칸은 placeholder 가 감춰진다(dl-field-locked) — 라벨을 밖으로 올린다 */}
                  <label htmlFor="crypto-output" className="text-xs text-dl-fg-muted mb-1 block">
                    출력
                  </label>
                  <div className="relative">
                    <Textarea
                      id="crypto-output"
                      value={output}
                      lock
                      rows={10}
                      className={`${TEXTAREA_MIN_HEIGHT_CLASS} pr-8 font-mono text-sm`}
                    />
                    <CopyButton value={output} onCopy={handleCopy} />
                  </div>
                </div>

                <p className="text-xs text-dl-fg-muted">{formatNote}</p>
              </div>
            </TabPanel>
          </div>
        </Tabs>
      </div>

      <div className="mt-4 p-3 bg-dl-option-hover rounded-md">
        <p className="text-sm font-semibold mb-1">암호화 모드 안내</p>
        <ul className="text-sm text-dl-fg-muted list-disc ml-5 space-y-0.5">
          <li>
            <strong>PBKDF2 + AES-CBC</strong>: 패스프레이즈에서 PBKDF2(SHA-256)로 키를 유도. 키
            길이/반복 횟수/salt·IV 길이는 고급 설정에서 변경 가능 (기본 256bit/8192회/16/16, enc:v1:
            마커 암호문 호환)
          </li>
          <li>
            <strong>PBKDF2(고정 salt) + AES-GCM</strong>: 모든 암호문에 공통인 고정 salt로
            PBKDF2(SHA-256) 키를 유도하고, 랜덤 IV(12바이트)와 인증 태그(128bit)로 변조를 검출.
            Secret Key {AES_GCM_MIN_KEY_LENGTH}자 이상, 기본 256bit/600000회 (enc:v1: 마커 암호문
            호환)
          </li>
          <li>
            <strong>Raw Key AES-CBC</strong>: 키 문자열의 UTF-8 바이트를 그대로 AES 키로 사용
            (16/24/32바이트). 고정 Zero IV 레거시 포맷
          </li>
          <li>
            키와 데이터는 서버로 전송되지 않으며, 모든 연산은 브라우저(Web Crypto API)에서만
            수행됩니다
          </li>
        </ul>
      </div>
    </div>
  );
}
