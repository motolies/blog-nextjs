import { Button, Input, showToast, Tab, TabList, TabPanel, Tabs } from '@hvy/ui';
import { format } from 'date-fns';
import { ArrowLeft, Copy, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/router';
import { useId, useState } from 'react';
import { getTsid, TSID } from 'tsid-ts';
import { copyTextToClipboard } from '@/util/browserUtils';

const TSID_EPOCH = 1577836800000;

export default function TsidPage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState('generate');

  const [generatedTsid, setGeneratedTsid] = useState('');
  const [generatedNumber, setGeneratedNumber] = useState('');
  const [generatedDate, setGeneratedDate] = useState('');

  const [tsidInput, setTsidInput] = useState('');
  const [numberResult, setNumberResult] = useState('');
  const [numberInput, setNumberInput] = useState('');
  const [tsidResult, setTsidResult] = useState('');

  const [tsidForDate, setTsidForDate] = useState('');
  const [dateResult, setDateResult] = useState('');

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

  const handleGenerate = () => {
    try {
      const newTsid = getTsid();
      setGeneratedTsid(newTsid.toString());
      setGeneratedNumber(newTsid.toBigInt().toString());
      setGeneratedDate(format(new Date(TSID_EPOCH + newTsid.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS'));
      showToast('새 TSID가 생성되었습니다.');
    } catch {
      showToast('TSID 생성에 실패했습니다.', 'error');
    }
  };

  const handleTsidToNumber = () => {
    if (!tsidInput.trim()) {
      showToast('TSID를 입력해주세요.', 'warning');
      return;
    }
    try {
      setNumberResult(TSID.fromString(tsidInput.trim()).toBigInt().toString());
    } catch {
      showToast('유효하지 않은 TSID입니다.', 'error');
      setNumberResult('');
    }
  };

  const handleNumberToTsid = () => {
    if (!numberInput.trim()) {
      showToast('숫자를 입력해주세요.', 'warning');
      return;
    }
    try {
      setTsidResult(new TSID(BigInt(numberInput.trim())).toString());
    } catch {
      showToast('유효하지 않은 숫자입니다.', 'error');
      setTsidResult('');
    }
  };

  const handleTsidToDate = () => {
    if (!tsidForDate.trim()) {
      showToast('TSID를 입력해주세요.', 'warning');
      return;
    }
    try {
      const tsid = TSID.fromString(tsidForDate.trim());
      setDateResult(format(new Date(TSID_EPOCH + tsid.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS'));
    } catch (e) {
      showToast('유효하지 않은 TSID입니다.', 'error');
      setDateResult('');
    }
  };

  const CopyButton = ({ value }) => (
    <button
      type="button"
      onClick={() => void handleCopy(value)}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-dl-option-hover"
      title="복사"
    >
      <Copy className="h-4 w-4 text-dl-fg-muted" />
    </button>
  );

  const ReadonlyInputWithCopy = ({ label, value }) => {
    // 라벨-입력 연결 — 같은 컴포넌트가 화면에 여러 번 뜨므로 id 를 고정할 수 없다.
    const id = useId();
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm text-dl-fg-muted">
          {label}
        </label>
        <div className="relative">
          <Input id={id} value={value} lock className="pr-8 font-mono" />
          <CopyButton value={value} />
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4">
      <div className="flex items-center gap-2 mb-4">
        <Button className="aspect-square p-0" variant="ghost" onClick={() => router.push('/util')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold">TSID Converter</h1>
      </div>

      <div className="border rounded-md">
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabList className="w-full grid grid-cols-3 rounded-none border-b">
            <Tab value="generate">TSID 생성</Tab>
            <Tab value="convert">TSID ↔ 숫자</Tab>
            <Tab value="date">TSID → 날짜</Tab>
          </TabList>

          <div className="p-2 sm:p-4">
            {/* TSID 생성 */}
            <TabPanel value="generate">
              <div className="text-center mb-4">
                <Button variant="primary" size="lg" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4 mr-2" />새 TSID 생성
                </Button>
              </div>
              {generatedTsid && (
                <div className="space-y-3">
                  <ReadonlyInputWithCopy label="TSID (문자열)" value={generatedTsid} />
                  <ReadonlyInputWithCopy label="숫자 (BigInt)" value={generatedNumber} />
                  <ReadonlyInputWithCopy label="생성 시각" value={generatedDate} />
                </div>
              )}
            </TabPanel>

            {/* TSID ↔ 숫자 변환 */}
            <TabPanel value="convert">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="font-medium">TSID → 숫자</p>
                  <Input
                    value={tsidInput}
                    onChange={(e) => setTsidInput(e.target.value)}
                    placeholder="예: 0GXWP1VXZS35J"
                  />
                  <Button variant="primary" onClick={handleTsidToNumber} className="w-full">
                    변환
                  </Button>
                  {numberResult && <ReadonlyInputWithCopy label="숫자 결과" value={numberResult} />}
                </div>
                <div className="space-y-3">
                  <p className="font-medium">숫자 → TSID</p>
                  <Input
                    value={numberInput}
                    onChange={(e) => setNumberInput(e.target.value)}
                    placeholder="예: 481294567894561234"
                  />
                  <Button variant="primary" onClick={handleNumberToTsid} className="w-full">
                    변환
                  </Button>
                  {tsidResult && <ReadonlyInputWithCopy label="TSID 결과" value={tsidResult} />}
                </div>
              </div>
            </TabPanel>

            {/* TSID → 날짜 */}
            <TabPanel value="date">
              <p className="text-sm text-dl-fg-muted mb-3">
                TSID에 포함된 타임스탬프를 추출하여 날짜/시간으로 변환합니다. (TSID Epoch:
                2020-01-01 00:00:00 UTC)
              </p>
              <div className="space-y-3">
                <Input
                  value={tsidForDate}
                  onChange={(e) => setTsidForDate(e.target.value)}
                  placeholder="예: 0GXWP1VXZS35J"
                />
                <Button variant="primary" onClick={handleTsidToDate} className="w-full">
                  날짜/시간 추출
                </Button>
                {dateResult && <ReadonlyInputWithCopy label="날짜/시간 결과" value={dateResult} />}
              </div>
            </TabPanel>
          </div>
        </Tabs>
      </div>

      <div className="mt-4 p-3 bg-dl-option-hover rounded-md">
        <p className="text-sm font-semibold mb-1">TSID란?</p>
        <p className="text-sm text-dl-fg-muted">
          TSID (Time-Sorted Unique Identifier)는 시간순 정렬이 가능한 고유 식별자입니다. 13자리
          문자열로 표현되며, 내부에 42비트 타임스탬프와 22비트 랜덤값을 포함합니다.
        </p>
      </div>
    </div>
  );
}
