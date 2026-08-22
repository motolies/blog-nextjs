import { Badge, Button, Input, showToast, Tab, TabList, TabPanel, Tabs, Textarea } from '@hvy/ui';
import { format } from 'date-fns';
import { ArrowLeft, ArrowUpDown, Copy } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { copyTextToClipboard } from '@/util/browserUtils';
import {
  decodeBase64Utf8,
  decodeJwtToken,
  decodeUnicodeEscapes,
  encodeBase64Utf8,
  encodeUnicodeEscapes,
  formatJsonText,
  minifyJsonText,
} from '@/util/encodeUtils';

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

const ENCODING_TYPES = [
  { id: 'base64', label: 'Base64', bidirectional: true },
  { id: 'url', label: 'URL', bidirectional: true },
  { id: 'html', label: 'HTML', bidirectional: true },
  { id: 'unicode', label: 'Unicode', bidirectional: true },
  { id: 'md5', label: 'MD5', bidirectional: false },
  { id: 'sha256', label: 'SHA-256', bidirectional: false },
  { id: 'jwt', label: 'JWT', bidirectional: false },
  { id: 'json', label: 'JSON', bidirectional: true },
];

export default function EncodePage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState('base64');
  const [isClient, setIsClient] = useState(false);

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');
  const [jwtExpiry, setJwtExpiry] = useState(null);

  const [CryptoJS, setCryptoJS] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    import('crypto-js').then((module) => {
      setCryptoJS(module.default);
    });
  }, [isClient]);

  useEffect(() => {
    setInput('');
    setOutput('');
    setJwtHeader('');
    setJwtPayload('');
    setJwtExpiry(null);
  }, [tabValue]);

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

  const encodeBase64 = () => {
    try {
      setOutput(encodeBase64Utf8(input));
      showToast('Base64 인코딩 완료');
    } catch (e) {
      setOutput('');
      showToast(`인코딩 실패: ${e.message}`, 'error');
    }
  };

  const decodeBase64 = () => {
    try {
      setOutput(decodeBase64Utf8(input));
      showToast('Base64 디코딩 완료');
    } catch {
      setOutput('');
      showToast('디코딩 실패: 유효하지 않은 Base64 문자열', 'error');
    }
  };

  const encodeUrl = () => {
    try {
      setOutput(encodeURIComponent(input));
      showToast('URL 인코딩 완료');
    } catch (e) {
      setOutput('');
      showToast(`인코딩 실패: ${e.message}`, 'error');
    }
  };

  const decodeUrl = () => {
    try {
      setOutput(decodeURIComponent(input));
      showToast('URL 디코딩 완료');
    } catch (e) {
      setOutput('');
      showToast('디코딩 실패: 유효하지 않은 URL 인코딩', 'error');
    }
  };

  const encodeHtml = () => {
    try {
      setOutput(
        input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;'),
      );
      showToast('HTML 인코딩 완료');
    } catch (e) {
      setOutput('');
      showToast(`인코딩 실패: ${e.message}`, 'error');
    }
  };

  const decodeHtml = () => {
    try {
      setOutput(
        input
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&#39;/g, "'"),
      );
      showToast('HTML 디코딩 완료');
    } catch (e) {
      setOutput('');
      showToast(`디코딩 실패: ${e.message}`, 'error');
    }
  };

  const encodeUnicode = () => {
    try {
      setOutput(encodeUnicodeEscapes(input));
      showToast('Unicode 인코딩 완료');
    } catch (e) {
      setOutput('');
      showToast(`인코딩 실패: ${e.message}`, 'error');
    }
  };

  const decodeUnicode = () => {
    try {
      setOutput(decodeUnicodeEscapes(input));
      showToast('Unicode 디코딩 완료');
    } catch (e) {
      setOutput('');
      showToast('디코딩 실패: 유효하지 않은 Unicode 문자열', 'error');
    }
  };

  const hashMd5 = () => {
    if (!CryptoJS) {
      showToast('암호화 라이브러리 로딩 중...', 'info');
      return;
    }
    try {
      setOutput(CryptoJS.MD5(input).toString());
      showToast('MD5 해시 생성 완료');
    } catch (e) {
      setOutput('');
      showToast(`해시 생성 실패: ${e.message}`, 'error');
    }
  };

  const hashSha256 = () => {
    if (!CryptoJS) {
      showToast('암호화 라이브러리 로딩 중...', 'info');
      return;
    }
    try {
      setOutput(CryptoJS.SHA256(input).toString());
      showToast('SHA-256 해시 생성 완료');
    } catch (e) {
      setOutput('');
      showToast(`해시 생성 실패: ${e.message}`, 'error');
    }
  };

  const decodeJwt = () => {
    try {
      const { header, payload } = decodeJwtToken(input) as { header: any; payload: any };

      setJwtHeader(JSON.stringify(header, null, 2));
      setJwtPayload(JSON.stringify(payload, null, 2));

      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        setJwtExpiry({
          date: format(expDate, 'yyyy-MM-dd HH:mm:ss'),
          expired: expDate < new Date(),
        });
      } else {
        setJwtExpiry(null);
      }

      setOutput(JSON.stringify({ header, payload }, null, 2));
      showToast('JWT 디코딩 완료');
    } catch (e) {
      setJwtHeader('');
      setJwtPayload('');
      setJwtExpiry(null);
      setOutput('');
      showToast(`JWT 디코딩 실패: ${e.message}`, 'error');
    }
  };

  const formatJson = () => {
    try {
      setOutput(formatJsonText(input));
      showToast('JSON 포맷팅 완료');
    } catch (e) {
      setOutput('');
      showToast(`JSON 파싱 실패: ${e.message}`, 'error');
    }
  };

  const minifyJson = () => {
    try {
      setOutput(minifyJsonText(input));
      showToast('JSON 압축 완료');
    } catch (e) {
      setOutput('');
      showToast(`JSON 파싱 실패: ${e.message}`, 'error');
    }
  };

  const renderBidirectionalPanel = ({
    encodeFn,
    decodeFn,
    inputPlaceholder,
    outputLabel,
    isMonospace = false,
  }) => (
    <div className="space-y-3">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={inputPlaceholder}
        rows={10}
        className={`${TEXTAREA_MIN_HEIGHT_CLASS} font-mono text-sm`}
      />
      <div className="flex gap-2 justify-center items-center">
        <Button variant="primary" onClick={encodeFn}>
          Encode
        </Button>
        <Button variant="primary" onClick={decodeFn}>
          Decode
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
        <label htmlFor="encode-output" className="text-xs text-dl-fg-muted mb-1 block">
          {outputLabel}
        </label>
        <div className="relative">
          <Textarea
            id="encode-output"
            value={output}
            lock
            rows={10}
            className={`${TEXTAREA_MIN_HEIGHT_CLASS} pr-8 ${isMonospace ? 'font-mono text-sm' : ''}`}
          />
          <CopyButton value={output} onCopy={handleCopy} />
        </div>
      </div>
    </div>
  );

  if (!isClient) {
    return <div className="p-4 flex justify-center items-center min-h-[50vh]">로딩 중...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button className="aspect-square p-0" variant="ghost" onClick={() => router.push('/util')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold">Encoder / Decoder</h1>
      </div>

      <div className="border rounded-md">
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabList className="w-full flex h-auto border-b rounded-none justify-start px-2 py-1 gap-1 overflow-x-auto">
            {ENCODING_TYPES.map((type) => (
              <Tab key={type.id} value={type.id} className="flex-none">
                {type.label}
              </Tab>
            ))}
          </TabList>

          <div className="p-2 sm:p-4">
            {/* Base64 */}
            <TabPanel value="base64">
              {renderBidirectionalPanel({
                encodeFn: encodeBase64,
                decodeFn: decodeBase64,
                inputPlaceholder: '인코딩/디코딩할 텍스트를 입력하세요',
                outputLabel: '출력',
              })}
            </TabPanel>

            {/* URL */}
            <TabPanel value="url">
              {renderBidirectionalPanel({
                encodeFn: encodeUrl,
                decodeFn: decodeUrl,
                inputPlaceholder: 'URL 인코딩/디코딩할 텍스트를 입력하세요',
                outputLabel: '출력',
              })}
            </TabPanel>

            {/* HTML */}
            <TabPanel value="html">
              {renderBidirectionalPanel({
                encodeFn: encodeHtml,
                decodeFn: decodeHtml,
                inputPlaceholder: 'HTML 인코딩/디코딩할 텍스트를 입력하세요',
                outputLabel: '출력',
              })}
            </TabPanel>

            {/* Unicode */}
            <TabPanel value="unicode">
              {renderBidirectionalPanel({
                encodeFn: encodeUnicode,
                decodeFn: decodeUnicode,
                inputPlaceholder:
                  'Unicode 인코딩: 일반 텍스트, 디코딩: \\u0048\\u0065\\u006c\\u006c\\u006f',
                outputLabel: '출력',
              })}
            </TabPanel>

            {/* MD5 */}
            <TabPanel value="md5">
              <div className="space-y-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="해시할 텍스트를 입력하세요"
                  rows={10}
                  className={TEXTAREA_MIN_HEIGHT_CLASS}
                />
                <div className="flex justify-center">
                  <Button variant="primary" onClick={hashMd5}>
                    MD5 해시 생성
                  </Button>
                </div>
                <div>
                  <label htmlFor="encode-md5" className="text-xs text-dl-fg-muted mb-1 block">
                    MD5 해시 (32자)
                  </label>
                  <div className="relative">
                    <Input id="encode-md5" value={output} lock className="pr-8 font-mono" />
                    <CopyButton value={output} onCopy={handleCopy} />
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* SHA-256 */}
            <TabPanel value="sha256">
              <div className="space-y-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="해시할 텍스트를 입력하세요"
                  rows={10}
                  className={TEXTAREA_MIN_HEIGHT_CLASS}
                />
                <div className="flex justify-center">
                  <Button variant="primary" onClick={hashSha256}>
                    SHA-256 해시 생성
                  </Button>
                </div>
                <div>
                  <label htmlFor="encode-sha256" className="text-xs text-dl-fg-muted mb-1 block">
                    SHA-256 해시 (64자)
                  </label>
                  <div className="relative">
                    <Input id="encode-sha256" value={output} lock className="pr-8 font-mono" />
                    <CopyButton value={output} onCopy={handleCopy} />
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* JWT */}
            <TabPanel value="jwt">
              <div className="space-y-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={10}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className={`${TEXTAREA_MIN_HEIGHT_CLASS} font-mono text-xs`}
                />
                <div className="flex justify-center">
                  <Button variant="primary" onClick={decodeJwt}>
                    JWT 디코딩
                  </Button>
                </div>
                {jwtHeader && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="encode-jwt-header"
                          className="text-xs text-dl-fg-muted mb-1 block"
                        >
                          Header
                        </label>
                        <div className="relative">
                          <Textarea
                            id="encode-jwt-header"
                            value={jwtHeader}
                            lock
                            rows={10}
                            className={`${TEXTAREA_MIN_HEIGHT_CLASS} pr-8 font-mono text-xs`}
                          />
                          <CopyButton value={jwtHeader} onCopy={handleCopy} />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="encode-jwt-payload"
                          className="text-xs text-dl-fg-muted mb-1 block"
                        >
                          Payload
                        </label>
                        <div className="relative">
                          <Textarea
                            id="encode-jwt-payload"
                            value={jwtPayload}
                            lock
                            rows={10}
                            className={`${TEXTAREA_MIN_HEIGHT_CLASS} pr-8 font-mono text-xs`}
                          />
                          <CopyButton value={jwtPayload} onCopy={handleCopy} />
                        </div>
                      </div>
                    </div>
                    {jwtExpiry && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">만료 시간:</span>
                        <span className="text-sm font-mono">{jwtExpiry.date}</span>
                        <Badge tone={jwtExpiry.expired ? 'danger' : 'primary'}>
                          {jwtExpiry.expired ? '만료됨' : '유효'}
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabPanel>

            {/* JSON */}
            <TabPanel value="json">
              <div className="space-y-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={10}
                  placeholder={'{"name":"John","age":30}'}
                  className={`${TEXTAREA_MIN_HEIGHT_CLASS} font-mono text-xs`}
                />
                <div className="flex gap-2 justify-center items-center">
                  <Button variant="primary" onClick={formatJson}>
                    포맷팅 (Beautify)
                  </Button>
                  <Button variant="primary" onClick={minifyJson}>
                    압축 (Minify)
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
                  <label
                    htmlFor="encode-json-output"
                    className="text-xs text-dl-fg-muted mb-1 block"
                  >
                    출력
                  </label>
                  <div className="relative">
                    <Textarea
                      id="encode-json-output"
                      value={output}
                      lock
                      rows={10}
                      className={`${TEXTAREA_MIN_HEIGHT_CLASS} pr-8 font-mono text-xs`}
                    />
                    <CopyButton value={output} onCopy={handleCopy} />
                  </div>
                </div>
              </div>
            </TabPanel>
          </div>
        </Tabs>
      </div>

      <div className="mt-4 p-3 bg-dl-option-hover rounded-md">
        <p className="text-sm font-semibold mb-1">인코딩 타입 안내</p>
        <ul className="text-sm text-dl-fg-muted list-disc ml-5 space-y-0.5">
          <li>
            <strong>Base64</strong>: 바이너리 데이터를 ASCII 문자로 변환
          </li>
          <li>
            <strong>URL</strong>: URL에서 사용할 수 없는 문자를 % 인코딩
          </li>
          <li>
            <strong>HTML</strong>: HTML 특수문자를 엔티티로 변환
          </li>
          <li>
            <strong>Unicode</strong>: 문자를 \uXXXX 형식으로 변환
          </li>
          <li>
            <strong>MD5</strong>: 128비트 해시 (단방향)
          </li>
          <li>
            <strong>SHA-256</strong>: 256비트 해시 (단방향)
          </li>
          <li>
            <strong>JWT</strong>: JSON Web Token 디코딩 (서명 검증 없음)
          </li>
          <li>
            <strong>JSON</strong>: JSON 문자열 포맷팅/압축
          </li>
        </ul>
      </div>
    </div>
  );
}
