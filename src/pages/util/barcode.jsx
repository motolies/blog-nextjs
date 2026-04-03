import {useState, useEffect, useRef, useCallback} from 'react'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '../../components/ui/tabs'
import {Button} from '../../components/ui/button'
import {Input} from '../../components/ui/input'
import {Textarea} from '../../components/ui/textarea'
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from '../../components/ui/select'
import {Download, ArrowLeft} from 'lucide-react'
import {toast} from 'sonner'
import {useRouter} from 'next/router'
import {downloadBlob, downloadDataUrl} from '../../util/browserUtils'

const BARCODE_FORMATS = [
    {value: 'CODE128', label: 'CODE128', description: '모든 ASCII 문자 지원', example: 'ABC-12345'},
    {value: 'EAN13', label: 'EAN-13', description: '숫자 12-13자리', example: '5901234123457'},
    {value: 'EAN8', label: 'EAN-8', description: '숫자 7-8자리', example: '96385074'},
    {value: 'UPC', label: 'UPC-A', description: '숫자 11-12자리', example: '042100005264'},
    {value: 'CODE39', label: 'CODE39', description: '영문 대문자, 숫자, 일부 특수문자', example: 'CODE39'}
]

const QR_ERROR_LEVELS = [
    {value: 'L', label: 'L (7%)', description: '낮음'},
    {value: 'M', label: 'M (15%)', description: '중간'},
    {value: 'Q', label: 'Q (25%)', description: '높음'},
    {value: 'H', label: 'H (30%)', description: '최고'}
]

export default function BarcodePage() {
    const router = useRouter()
    const [tabValue, setTabValue] = useState('barcode')
    const [isClient, setIsClient] = useState(false)

    const [barcodeFormat, setBarcodeFormat] = useState('CODE128')
    const [barcodeText, setBarcodeText] = useState('ABC-12345')
    const [barcodeWidth, setBarcodeWidth] = useState(2)
    const [barcodeHeight, setBarcodeHeight] = useState(100)
    const [displayValue, setDisplayValue] = useState(true)
    const barcodeRef = useRef(null)
    const barcodeSvgRef = useRef(null)

    const [qrText, setQrText] = useState('https://example.com')
    const [qrSize, setQrSize] = useState(256)
    const [qrErrorLevel, setQrErrorLevel] = useState('M')
    const qrRef = useRef(null)
    const qrCanvasRef = useRef(null)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const renderBarcode = useCallback(async () => {
        if (!isClient || !barcodeSvgRef.current) return

        if (!barcodeText.trim()) {
            barcodeSvgRef.current.innerHTML = ''
            return
        }

        try {
            const JsBarcode = (await import('jsbarcode')).default
            JsBarcode(barcodeSvgRef.current, barcodeText, {
                format: barcodeFormat,
                width: barcodeWidth,
                height: barcodeHeight,
                displayValue: displayValue,
                font: 'D2Coding',
                fontSize: 16,
                margin: 10,
                background: '#ffffff'
            })
        } catch (e) {
            console.error('Barcode generation error:', e)
            if (barcodeSvgRef.current) barcodeSvgRef.current.innerHTML = ''
            toast.error('바코드 생성 실패: ' + (e.message || '유효하지 않은 입력값'))
        }
    }, [isClient, barcodeText, barcodeFormat, barcodeWidth, barcodeHeight, displayValue])

    const renderQrCode = useCallback(async () => {
        if (!isClient || !qrCanvasRef.current) return

        const context = qrCanvasRef.current.getContext('2d')
        context?.clearRect(0, 0, qrCanvasRef.current.width, qrCanvasRef.current.height)

        if (!qrText.trim()) {
            return
        }

        try {
            const QRCode = (await import('qrcode')).default
            await QRCode.toCanvas(qrCanvasRef.current, qrText, {
                width: qrSize,
                margin: 2,
                errorCorrectionLevel: qrErrorLevel,
                color: {dark: '#000000', light: '#ffffff'}
            })
        } catch (e) {
            console.error('QR Code generation error:', e)
            toast.error('QR 코드 생성 실패: ' + (e.message || '유효하지 않은 입력값'))
        }
    }, [isClient, qrText, qrSize, qrErrorLevel])

    useEffect(() => {
        if (tabValue === 'barcode') {
            const timer = setTimeout(() => renderBarcode(), 300)
            return () => clearTimeout(timer)
        }
    }, [tabValue, renderBarcode])

    useEffect(() => {
        if (tabValue === 'qr') {
            const timer = setTimeout(() => renderQrCode(), 300)
            return () => clearTimeout(timer)
        }
    }, [tabValue, renderQrCode])

    const handleFormatChange = (format) => {
        setBarcodeFormat(format)
        const formatInfo = BARCODE_FORMATS.find(f => f.value === format)
        if (formatInfo) setBarcodeText(formatInfo.example)
    }

    const downloadBarcodePng = async () => {
        try {
            const {toPng} = await import('html-to-image')
            const svgElement = barcodeSvgRef.current
            if (!svgElement) { toast.warning('바코드를 먼저 생성해주세요.'); return }
            const dataUrl = await toPng(svgElement, {backgroundColor: 'white', pixelRatio: 2})
            downloadDataUrl(dataUrl, `barcode-${barcodeFormat}-${Date.now()}.png`)
            toast.success('PNG 다운로드 완료')
        } catch (e) {
            toast.error('다운로드 실패: ' + e.message)
        }
    }

    const downloadBarcodeSvg = () => {
        const svgElement = barcodeSvgRef.current
        if (!svgElement) { toast.warning('바코드를 먼저 생성해주세요.'); return }
        const svgData = new XMLSerializer().serializeToString(svgElement)
        try {
            downloadBlob(new Blob([svgData], {type: 'image/svg+xml'}), `barcode-${barcodeFormat}-${Date.now()}.svg`)
            toast.success('SVG 다운로드 완료')
        } catch (e) {
            toast.error('다운로드 실패: ' + e.message)
        }
    }

    const downloadQrPng = () => {
        const canvas = qrCanvasRef.current
        if (!canvas) { toast.warning('QR 코드를 먼저 생성해주세요.'); return }
        const dataUrl = canvas.toDataURL('image/png')
        try {
            downloadDataUrl(dataUrl, `qrcode-${Date.now()}.png`)
            toast.success('PNG 다운로드 완료')
        } catch (e) {
            toast.error('다운로드 실패: ' + e.message)
        }
    }

    const downloadQrSvg = async () => {
        try {
            const QRCode = (await import('qrcode')).default
            const svgString = await QRCode.toString(qrText, {
                type: 'svg', width: qrSize, margin: 2,
                errorCorrectionLevel: qrErrorLevel,
                color: {dark: '#000000', light: '#ffffff'}
            })
            downloadBlob(new Blob([svgString], {type: 'image/svg+xml'}), `qrcode-${Date.now()}.svg`)
            toast.success('SVG 다운로드 완료')
        } catch (e) {
            toast.error('다운로드 실패: ' + e.message)
        }
    }

    if (!isClient) {
        return <div className="p-4 flex justify-center items-center min-h-[50vh]">로딩 중...</div>
    }

    const currentFormat = BARCODE_FORMATS.find(f => f.value === barcodeFormat)

    return (
        <div className="p-2 sm:p-4">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/util')}>
                    <ArrowLeft className="h-5 w-5"/>
                </Button>
                <h1 className="text-xl sm:text-3xl font-bold">Barcode Generator</h1>
            </div>

            <div className="border rounded-md">
                <Tabs value={tabValue} onValueChange={setTabValue}>
                    <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
                        <TabsTrigger value="barcode">1D 바코드</TabsTrigger>
                        <TabsTrigger value="qr">QR 코드</TabsTrigger>
                    </TabsList>

                    {/* 1D Barcode */}
                    <TabsContent value="barcode">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-2 sm:p-4">
                            {/* 설정 영역 */}
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500 mb-1 block">포맷</label>
                                    <Select value={barcodeFormat} onValueChange={handleFormatChange}>
                                        <SelectTrigger>
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BARCODE_FORMATS.map(format => (
                                                <SelectItem key={format.value} value={format.value}>
                                                    {format.label} - {format.description}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500 mb-1 block">텍스트</label>
                                    <Input
                                        value={barcodeText}
                                        onChange={(e) => setBarcodeText(e.target.value)}
                                        placeholder={currentFormat?.example}
                                    />
                                    {currentFormat && <p className="text-xs text-gray-500 mt-1">{currentFormat.description}</p>}
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-1">선 굵기: {barcodeWidth}</p>
                                    <input
                                        type="range"
                                        min={1} max={5} step={0.5}
                                        value={barcodeWidth}
                                        onChange={(e) => setBarcodeWidth(Number(e.target.value))}
                                        className="w-full accent-blue-600"
                                    />
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-1">높이: {barcodeHeight}px</p>
                                    <input
                                        type="range"
                                        min={50} max={200} step={10}
                                        value={barcodeHeight}
                                        onChange={(e) => setBarcodeHeight(Number(e.target.value))}
                                        className="w-full accent-blue-600"
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
                                    <Button onClick={downloadBarcodePng} className="flex-1">
                                        <Download className="h-4 w-4 mr-1"/>
                                        PNG
                                    </Button>
                                    <Button onClick={downloadBarcodeSvg} className="flex-1">
                                        <Download className="h-4 w-4 mr-1"/>
                                        SVG
                                    </Button>
                                </div>
                            </div>

                            {/* 미리보기 영역 */}
                            <div ref={barcodeRef} className="md:col-span-3 min-h-[250px] flex justify-center items-center bg-gray-50 border rounded-md p-4">
                                <svg ref={barcodeSvgRef}/>
                            </div>
                        </div>
                    </TabsContent>

                    {/* QR Code */}
                    <TabsContent value="qr">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-2 sm:p-4">
                            {/* 설정 영역 */}
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500 mb-1 block">텍스트 / URL</label>
                                    <Textarea
                                        value={qrText}
                                        onChange={(e) => setQrText(e.target.value)}
                                        rows={3}
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-1">사이즈: {qrSize}px</p>
                                    <input
                                        type="range"
                                        min={100} max={500} step={50}
                                        value={qrSize}
                                        onChange={(e) => setQrSize(Number(e.target.value))}
                                        className="w-full accent-blue-600"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                                        <span>100</span>
                                        <span>256</span>
                                        <span>500</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500 mb-1 block">에러 보정 레벨</label>
                                    <Select value={qrErrorLevel} onValueChange={setQrErrorLevel}>
                                        <SelectTrigger>
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {QR_ERROR_LEVELS.map(level => (
                                                <SelectItem key={level.value} value={level.value}>
                                                    {level.label} - {level.description}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={downloadQrPng} className="flex-1">
                                        <Download className="h-4 w-4 mr-1"/>
                                        PNG
                                    </Button>
                                    <Button onClick={downloadQrSvg} className="flex-1">
                                        <Download className="h-4 w-4 mr-1"/>
                                        SVG
                                    </Button>
                                </div>
                            </div>

                            {/* 미리보기 영역 */}
                            <div ref={qrRef} className="md:col-span-3 min-h-[250px] flex justify-center items-center bg-gray-50 border rounded-md p-4">
                                <canvas ref={qrCanvasRef}/>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm font-semibold mb-1">바코드 포맷 안내</p>
                <ul className="text-sm text-gray-500 list-disc ml-5 space-y-0.5">
                    <li><strong>CODE128</strong>: 가장 범용적인 포맷, 모든 ASCII 문자 지원</li>
                    <li><strong>EAN-13</strong>: 상품 바코드, 숫자 12-13자리</li>
                    <li><strong>EAN-8</strong>: 소형 상품용, 숫자 7-8자리</li>
                    <li><strong>UPC-A</strong>: 북미 상품 바코드, 숫자 11-12자리</li>
                    <li><strong>CODE39</strong>: 산업용, 영문 대문자/숫자/특수문자(-. $/+%)</li>
                </ul>
            </div>
        </div>
    )
}
