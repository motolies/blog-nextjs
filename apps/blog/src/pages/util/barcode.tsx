import { Button, Input, Select, showToast, Tab, TabList, TabPanel, Tabs, Textarea } from '@hvy/ui';
import { ArrowLeft, Download } from 'lucide-react';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { downloadBlob, downloadDataUrl } from '@/util/browserUtils';

const BARCODE_FORMATS = [
  { value: 'CODE128', label: 'CODE128', description: '모든 ASCII 문자 지원', example: 'ABC-12345' },
  { value: 'EAN13', label: 'EAN-13', description: '숫자 12-13자리', example: '5901234123457' },
  { value: 'EAN8', label: 'EAN-8', description: '숫자 7-8자리', example: '96385074' },
  { value: 'UPC', label: 'UPC-A', description: '숫자 11-12자리', example: '042100005264' },
  {
    value: 'CODE39',
    label: 'CODE39',
    description: '영문 대문자, 숫자, 일부 특수문자',
    example: 'CODE39',
  },
];

const QR_ERROR_LEVELS = [
  { value: 'L', label: 'L (7%)', description: '낮음' },
  { value: 'M', label: 'M (15%)', description: '중간' },
  { value: 'Q', label: 'Q (25%)', description: '높음' },
  { value: 'H', label: 'H (30%)', description: '최고' },
];

export default function BarcodePage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState('barcode');
  const [isClient, setIsClient] = useState(false);

  const [barcodeFormat, setBarcodeFormat] = useState('CODE128');
  const [barcodeText, setBarcodeText] = useState('ABC-12345');
  const [barcodeWidth, setBarcodeWidth] = useState(2);
  const [barcodeHeight, setBarcodeHeight] = useState(100);
  const [displayValue, setDisplayValue] = useState(true);
  const barcodeRef = useRef(null);
  const barcodeSvgRef = useRef(null);

  const [qrText, setQrText] = useState('https://example.com');
  const [qrSize, setQrSize] = useState(256);
  const [qrErrorLevel, setQrErrorLevel] = useState('M');
  const qrRef = useRef(null);
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const renderBarcode = useCallback(async () => {
    if (!isClient || !barcodeSvgRef.current) return;

    if (!barcodeText.trim()) {
      barcodeSvgRef.current.innerHTML = '';
      return;
    }

    try {
      const JsBarcode = (await import('jsbarcode')).default;
      JsBarcode(barcodeSvgRef.current, barcodeText, {
        format: barcodeFormat,
        width: barcodeWidth,
        height: barcodeHeight,
        displayValue: displayValue,
        // canvas font 축약형으로 이어붙여지므로 공백 포함 family 명은 내장 따옴표 필수
        font: '"JetBrains Mono", "D2Coding", monospace',
        fontSize: 16,
        margin: 10,
        // token-exempt: 바코드 스캐너는 흑백 대비로 읽는다 — 테마색을 넣으면 인식률이 떨어진다
        background: '#ffffff',
      });
    } catch (e) {
      console.error('Barcode generation error:', e);
      if (barcodeSvgRef.current) barcodeSvgRef.current.innerHTML = '';
      showToast(`바코드 생성 실패: ${e.message || '유효하지 않은 입력값'}`, 'error');
    }
  }, [isClient, barcodeText, barcodeFormat, barcodeWidth, barcodeHeight, displayValue]);

  const renderQrCode = useCallback(async () => {
    if (!isClient || !qrCanvasRef.current) return;

    const context = qrCanvasRef.current.getContext('2d');
    context?.clearRect(0, 0, qrCanvasRef.current.width, qrCanvasRef.current.height);

    if (!qrText.trim()) {
      return;
    }

    try {
      const QRCode = (await import('qrcode')).default;
      await QRCode.toCanvas(qrCanvasRef.current, qrText, {
        width: qrSize,
        margin: 2,
        errorCorrectionLevel: qrErrorLevel,
        // token-exempt: QR 스캐너 인식 요건 — 순수 흑백이어야 한다
        color: { dark: '#000000', light: '#ffffff' },
      });
    } catch (e) {
      console.error('QR Code generation error:', e);
      showToast(`QR 코드 생성 실패: ${e.message || '유효하지 않은 입력값'}`, 'error');
    }
  }, [isClient, qrText, qrSize, qrErrorLevel]);

  useEffect(() => {
    if (tabValue === 'barcode') {
      const timer = setTimeout(() => renderBarcode(), 300);
      return () => clearTimeout(timer);
    }
  }, [tabValue, renderBarcode]);

  useEffect(() => {
    if (tabValue === 'qr') {
      const timer = setTimeout(() => renderQrCode(), 300);
      return () => clearTimeout(timer);
    }
  }, [tabValue, renderQrCode]);

  const handleFormatChange = (format) => {
    setBarcodeFormat(format);
    const formatInfo = BARCODE_FORMATS.find((f) => f.value === format);
    if (formatInfo) setBarcodeText(formatInfo.example);
  };

  const downloadBarcodePng = async () => {
    try {
      const { toPng } = await import('html-to-image');
      const svgElement = barcodeSvgRef.current;
      if (!svgElement) {
        showToast('바코드를 먼저 생성해주세요.', 'warning');
        return;
      }
      const dataUrl = await toPng(svgElement, { backgroundColor: 'white', pixelRatio: 2 });
      downloadDataUrl(dataUrl, `barcode-${barcodeFormat}-${Date.now()}.png`);
      showToast('PNG 다운로드 완료');
    } catch (e) {
      showToast(`다운로드 실패: ${e.message}`, 'error');
    }
  };

  const downloadBarcodeSvg = () => {
    const svgElement = barcodeSvgRef.current;
    if (!svgElement) {
      showToast('바코드를 먼저 생성해주세요.', 'warning');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgElement);
    try {
      downloadBlob(
        new Blob([svgData], { type: 'image/svg+xml' }),
        `barcode-${barcodeFormat}-${Date.now()}.svg`,
      );
      showToast('SVG 다운로드 완료');
    } catch (e) {
      showToast(`다운로드 실패: ${e.message}`, 'error');
    }
  };

  const downloadQrPng = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) {
      showToast('QR 코드를 먼저 생성해주세요.', 'warning');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    try {
      downloadDataUrl(dataUrl, `qrcode-${Date.now()}.png`);
      showToast('PNG 다운로드 완료');
    } catch (e) {
      showToast(`다운로드 실패: ${e.message}`, 'error');
    }
  };

  const downloadQrSvg = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      const svgString = await QRCode.toString(qrText, {
        type: 'svg',
        width: qrSize,
        margin: 2,
        errorCorrectionLevel: qrErrorLevel,
        // token-exempt: QR 스캐너 인식 요건 — 순수 흑백이어야 한다
        color: { dark: '#000000', light: '#ffffff' },
      });
      downloadBlob(new Blob([svgString], { type: 'image/svg+xml' }), `qrcode-${Date.now()}.svg`);
      showToast('SVG 다운로드 완료');
    } catch (e) {
      showToast(`다운로드 실패: ${e.message}`, 'error');
    }
  };

  if (!isClient) {
    return <div className="p-4 flex justify-center items-center min-h-[50vh]">로딩 중...</div>;
  }

  const currentFormat = BARCODE_FORMATS.find((f) => f.value === barcodeFormat);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button className="aspect-square p-0" variant="ghost" onClick={() => router.push('/util')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold">Barcode Generator</h1>
      </div>

      <div className="border rounded-md">
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabList className="w-full grid grid-cols-2 rounded-none border-b">
            <Tab value="barcode">1D 바코드</Tab>
            <Tab value="qr">QR 코드</Tab>
          </TabList>

          {/* 1D Barcode */}
          <TabPanel value="barcode">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-2 sm:p-4">
              {/* 설정 영역 */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="text-sm text-dl-fg-muted mb-1 block">포맷</label>
                  <Select
                    value={barcodeFormat}
                    onValueChange={handleFormatChange}
                    placeholder="포맷 선택"
                    options={BARCODE_FORMATS.map((format) => ({
                      value: format.value,
                      label: `${format.label} - ${format.description}`,
                    }))}
                  />
                </div>

                <div>
                  <label className="text-sm text-dl-fg-muted mb-1 block">텍스트</label>
                  <Input
                    value={barcodeText}
                    onChange={(e) => setBarcodeText(e.target.value)}
                    placeholder={currentFormat?.example}
                  />
                  {currentFormat && (
                    <p className="text-xs text-dl-fg-muted mt-1">{currentFormat.description}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-dl-fg-muted mb-1">선 굵기: {barcodeWidth}</p>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.5}
                    value={barcodeWidth}
                    onChange={(e) => setBarcodeWidth(Number(e.target.value))}
                    className="w-full accent-[color:var(--color-dl-primary)]"
                  />
                </div>

                <div>
                  <p className="text-sm text-dl-fg-muted mb-1">높이: {barcodeHeight}px</p>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    step={10}
                    value={barcodeHeight}
                    onChange={(e) => setBarcodeHeight(Number(e.target.value))}
                    className="w-full accent-[color:var(--color-dl-primary)]"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displayValue}
                    onChange={(e) => setDisplayValue(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>값 표시</span>
                </label>

                <div className="flex gap-2 mt-2">
                  <Button variant="primary" onClick={downloadBarcodePng} className="flex-1">
                    <Download className="h-4 w-4 mr-1" />
                    PNG
                  </Button>
                  <Button variant="primary" onClick={downloadBarcodeSvg} className="flex-1">
                    <Download className="h-4 w-4 mr-1" />
                    SVG
                  </Button>
                </div>
              </div>

              {/* 미리보기 영역 */}
              <div
                ref={barcodeRef}
                className="md:col-span-3 min-h-[250px] flex justify-center items-center bg-dl-grid-header border rounded-md p-4"
              >
                <svg ref={barcodeSvgRef} />
              </div>
            </div>
          </TabPanel>

          {/* QR Code */}
          <TabPanel value="qr">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-2 sm:p-4">
              {/* 설정 영역 */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="text-sm text-dl-fg-muted mb-1 block">텍스트 / URL</label>
                  <Textarea
                    value={qrText}
                    onChange={(e) => setQrText(e.target.value)}
                    rows={3}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <p className="text-sm text-dl-fg-muted mb-1">사이즈: {qrSize}px</p>
                  <input
                    type="range"
                    min={100}
                    max={500}
                    step={50}
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full accent-[color:var(--color-dl-primary)]"
                  />
                  <div className="flex justify-between text-xs text-dl-fg-muted mt-0.5">
                    <span>100</span>
                    <span>256</span>
                    <span>500</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-dl-fg-muted mb-1 block">에러 보정 레벨</label>
                  <Select
                    value={qrErrorLevel}
                    onValueChange={setQrErrorLevel}
                    placeholder="오류 수정 레벨"
                    options={QR_ERROR_LEVELS.map((level) => ({
                      value: level.value,
                      label: `${level.label} - ${level.description}`,
                    }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="primary" onClick={downloadQrPng} className="flex-1">
                    <Download className="h-4 w-4 mr-1" />
                    PNG
                  </Button>
                  <Button variant="primary" onClick={downloadQrSvg} className="flex-1">
                    <Download className="h-4 w-4 mr-1" />
                    SVG
                  </Button>
                </div>
              </div>

              {/* 미리보기 영역 */}
              <div
                ref={qrRef}
                className="md:col-span-3 min-h-[250px] flex justify-center items-center bg-dl-grid-header border rounded-md p-4"
              >
                <canvas ref={qrCanvasRef} />
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>

      <div className="mt-4 p-3 bg-dl-option-hover rounded-md">
        <p className="text-sm font-semibold mb-1">바코드 포맷 안내</p>
        <ul className="text-sm text-dl-fg-muted list-disc ml-5 space-y-0.5">
          <li>
            <strong>CODE128</strong>: 가장 범용적인 포맷, 모든 ASCII 문자 지원
          </li>
          <li>
            <strong>EAN-13</strong>: 상품 바코드, 숫자 12-13자리
          </li>
          <li>
            <strong>EAN-8</strong>: 소형 상품용, 숫자 7-8자리
          </li>
          <li>
            <strong>UPC-A</strong>: 북미 상품 바코드, 숫자 11-12자리
          </li>
          <li>
            <strong>CODE39</strong>: 산업용, 영문 대문자/숫자/특수문자(-. $/+%)
          </li>
        </ul>
      </div>
    </div>
  );
}
