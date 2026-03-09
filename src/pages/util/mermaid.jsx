import {useState, useEffect, useRef, useCallback} from 'react'
import {createPortal} from 'react-dom'
import {Button} from '../../components/ui/button'
import {Input} from '../../components/ui/input'
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from '../../components/ui/select'
import {Download, ArrowLeft, ZoomIn, ZoomOut, Crosshair, Maximize, Minimize, Eye, EyeOff} from 'lucide-react'
import {toast} from 'sonner'
import {useRouter} from 'next/router'
import {downloadBlob, downloadDataUrl} from '../../util/browserUtils'

const SAMPLE_CODES = {
    flowchart: [
        {
            name: '기본 플로우차트',
            code: `flowchart TD
    A[시작] --> B{조건 확인}
    B -->|Yes| C[처리 실행]
    B -->|No| D[대체 처리]
    C --> E[결과 저장]
    D --> E
    E --> F[완료]`
        },
        {
            name: '의사결정 트리',
            code: `flowchart TD
    A[요청 수신] --> B{인증 확인}
    B -->|실패| C[401 반환]
    B -->|성공| D{권한 확인}
    D -->|없음| E[403 반환]
    D -->|있음| F{데이터 유효성}
    F -->|실패| G[400 반환]
    F -->|통과| H[처리 실행]
    H --> I[200 반환]`
        },
        {
            name: '에러 처리 흐름',
            code: `flowchart LR
    A[API 호출] --> B{응답 확인}
    B -->|성공| C[데이터 처리]
    B -->|실패| D{재시도 가능?}
    D -->|Yes, 3회 미만| E[대기 후 재시도]
    E --> A
    D -->|No| F[에러 로그]
    F --> G[사용자 알림]
    C --> H[완료]`
        }
    ],
    sequence: [
        {
            name: '옵저버 패턴',
            code: `sequenceDiagram
    participant Subject as Subject<br/>(OrderService)
    participant Observer1 as Observer 1<br/>(EmailService)
    participant Observer2 as Observer 2<br/>(PointService)
    participant Observer3 as Observer 3<br/>(InventoryService)

    Note over Subject,Observer3: 1. 옵저버 등록
    Observer1->>Subject: registerObserver()
    Observer2->>Subject: registerObserver()
    Observer3->>Subject: registerObserver()

    Note over Subject,Observer3: 2. 상태 변경 발생
    Subject->>Subject: 주문 완료 처리

    Note over Subject,Observer3: 3. 모든 옵저버에게 알림
    Subject->>Observer1: update(OrderEvent)
    Subject->>Observer2: update(OrderEvent)
    Subject->>Observer3: update(OrderEvent)

    Observer1-->>Subject: 이메일 발송 완료
    Observer2-->>Subject: 포인트 적립 완료
    Observer3-->>Subject: 재고 감소 완료`
        },
        {
            name: 'API 인증 흐름',
            code: `sequenceDiagram
    participant C as 클라이언트
    participant G as API 게이트웨이
    participant Auth as 인증 서버
    participant S as 서비스

    C->>G: 요청 (JWT 토큰 포함)
    G->>Auth: 토큰 검증 요청
    Auth-->>G: 검증 결과
    alt 토큰 유효
        G->>S: 요청 전달
        S-->>G: 응답 데이터
        G-->>C: 200 OK
    else 토큰 만료
        G-->>C: 401 Unauthorized
        C->>Auth: 토큰 갱신 요청
        Auth-->>C: 새 Access Token
    end`
        },
        {
            name: '주문 처리',
            code: `sequenceDiagram
    participant U as 사용자
    participant O as 주문 서비스
    participant P as 결제 서비스
    participant I as 재고 서비스

    U->>O: 주문 생성 요청
    O->>I: 재고 확인
    I-->>O: 재고 충분
    O->>P: 결제 요청
    P-->>O: 결제 완료
    O->>I: 재고 차감
    O-->>U: 주문 완료`
        }
    ],
    classDiagram: [
        {
            name: '옵저버 패턴',
            code: `classDiagram
    class Subject {
        <<interface>>
        +registerObserver(Observer): void
        +removeObserver(Observer): void
        +notifyObservers(): void
    }

    class ConcreteSubject {
        -observers: List~Observer~
        -state: Object
        +registerObserver(Observer): void
        +removeObserver(Observer): void
        +notifyObservers(): void
        +getState(): Object
        +setState(Object): void
    }

    class Observer {
        <<interface>>
        +update(Object): void
    }

    class ConcreteObserverA {
        -subject: Subject
        +update(Object): void
    }

    class ConcreteObserverB {
        -subject: Subject
        +update(Object): void
    }

    Subject <|.. ConcreteSubject
    Observer <|.. ConcreteObserverA
    Observer <|.. ConcreteObserverB
    Subject o--> Observer : notifies
    ConcreteSubject --> Observer : "1..*"

    note for Subject "상태 변경을 알리는 주제"
    note for Observer "상태 변경에 반응하는 관찰자"`
        },
        {
            name: '전략 패턴',
            code: `classDiagram
    class Context {
        -strategy: Strategy
        +setStrategy(Strategy): void
        +executeStrategy(): void
    }

    class Strategy {
        <<interface>>
        +execute(): void
    }

    class ConcreteStrategyA {
        +execute(): void
    }

    class ConcreteStrategyB {
        +execute(): void
    }

    Context --> Strategy
    Strategy <|.. ConcreteStrategyA
    Strategy <|.. ConcreteStrategyB

    note for Context "전략을 사용하는 컨텍스트"
    note for Strategy "알고리즘 인터페이스"`
        },
        {
            name: '팩토리 패턴',
            code: `classDiagram
    class Creator {
        <<abstract>>
        +createProduct(): Product
        +operation(): void
    }

    class ConcreteCreatorA {
        +createProduct(): Product
    }

    class ConcreteCreatorB {
        +createProduct(): Product
    }

    class Product {
        <<interface>>
        +use(): void
    }

    class ConcreteProductA {
        +use(): void
    }

    class ConcreteProductB {
        +use(): void
    }

    Creator <|-- ConcreteCreatorA
    Creator <|-- ConcreteCreatorB
    ConcreteCreatorA ..> ConcreteProductA : creates
    ConcreteCreatorB ..> ConcreteProductB : creates
    Product <|.. ConcreteProductA
    Product <|.. ConcreteProductB`
        }
    ],
    erDiagram: [
        {
            name: '주문 시스템',
            code: `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "ordered in"

    USER {
        int id PK
        string name
        string email
    }
    ORDER {
        int id PK
        int user_id FK
        date created_at
    }
    PRODUCT {
        int id PK
        string name
        decimal price
    }
    LINE_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
    }`
        },
        {
            name: '블로그 시스템',
            code: `erDiagram
    USER ||--o{ POST : writes
    POST ||--o{ COMMENT : has
    POST }o--o{ TAG : tagged

    USER {
        int id PK
        string username
        string email
    }
    POST {
        int id PK
        int user_id FK
        string title
        text content
        datetime created_at
    }
    COMMENT {
        int id PK
        int post_id FK
        int user_id FK
        text body
    }
    TAG {
        int id PK
        string name
    }`
        },
        {
            name: '학생 관리',
            code: `erDiagram
    STUDENT ||--o{ ENROLLMENT : enrolls
    COURSE ||--o{ ENROLLMENT : includes
    TEACHER ||--o{ COURSE : teaches

    STUDENT {
        int id PK
        string name
        string email
        date birth_date
    }
    COURSE {
        int id PK
        int teacher_id FK
        string title
        int credits
    }
    TEACHER {
        int id PK
        string name
        string department
    }
    ENROLLMENT {
        int student_id FK
        int course_id FK
        string grade
    }`
        }
    ],
    blockDiagram: [
        {
            name: '화면 UI 레이아웃',
            code: `block-beta
    columns 4

    H["헤더 (64px)"]:4

    N["사이드 메뉴 (1/4)"]:1
    C["메인 콘텐츠 영역 (3/4)"]:3

    F["푸터 (48px)"]:4

    style H fill:#333,color:#fff
    style N fill:#e1f5fe,stroke:#01579b
    style C fill:#fff,stroke:#333
    style F fill:#f4f4f4`
        },
        {
            name: '시스템 아키텍처',
            code: `block-beta
    columns 3
    title["시스템 아키텍처"]:3
    space
    block:infra:2
        web["웹 서버"]
        app["앱 서버"]
    end
    db[("데이터베이스")]
    web --> app
    app --> db`
        },
        {
            name: 'CI/CD 파이프라인',
            code: `block-beta
    columns 5
    A["1. Push"]:1
    B["2. Build"]:1
    C["3. Test"]:1
    D["4. Staging"]:1
    E["5. Production"]:1`
        }
    ],
    stateDiagram: [
        {
            name: '요청 처리',
            code: `stateDiagram-v2
    [*] --> 대기중
    대기중 --> 처리중 : 요청 접수
    처리중 --> 검토중 : 처리 완료
    검토중 --> 승인됨 : 승인
    검토중 --> 반려됨 : 반려
    반려됨 --> 처리중 : 재처리 요청
    승인됨 --> [*]

    state 처리중 {
        [*] --> 데이터검증
        데이터검증 --> 비즈니스로직
        비즈니스로직 --> 결과생성
        결과생성 --> [*]
    }`
        },
        {
            name: '주문 상태',
            code: `stateDiagram-v2
    [*] --> 주문접수
    주문접수 --> 결제대기 : 주문 확인
    결제대기 --> 결제완료 : 결제 성공
    결제대기 --> 주문취소 : 결제 실패
    결제완료 --> 배송준비 : 상품 준비
    배송준비 --> 배송중 : 배송 시작
    배송중 --> 배송완료 : 배송 완료
    배송완료 --> [*]
    주문취소 --> [*]`
        },
        {
            name: '인증 상태',
            code: `stateDiagram-v2
    [*] --> 비로그인
    비로그인 --> 로그인중 : 로그인 시도
    로그인중 --> 로그인 : 인증 성공
    로그인중 --> 비로그인 : 인증 실패
    로그인 --> 비로그인 : 로그아웃
    로그인 --> 토큰갱신중 : 토큰 만료
    토큰갱신중 --> 로그인 : 갱신 성공
    토큰갱신중 --> 비로그인 : 갱신 실패`
        }
    ]
}

const SAMPLE_TYPES = [
    {key: 'flowchart', label: 'Flowchart'},
    {key: 'sequence', label: 'Sequence'},
    {key: 'classDiagram', label: 'Class'},
    {key: 'erDiagram', label: 'ER Diagram'},
    {key: 'blockDiagram', label: 'Block'},
    {key: 'stateDiagram', label: 'State'},
]

export default function MermaidPage() {
    const router = useRouter()
    const [code, setCode] = useState(SAMPLE_CODES.flowchart[0].code)
    const [scaleMode, setScaleMode] = useState('ratio')
    const [scale, setScale] = useState(2)
    const [customWidth, setCustomWidth] = useState(1920)
    const [customHeight, setCustomHeight] = useState(1080)
    const [error, setError] = useState(null)
    const [isClient, setIsClient] = useState(false)
    const [isMermaidReady, setIsMermaidReady] = useState(false)
    const [selectedSample, setSelectedSample] = useState('flowchart')
    const [selectedSampleIndex, setSelectedSampleIndex] = useState(0)

    const [previewZoom, setPreviewZoom] = useState(1)
    const [panOffset, setPanOffset] = useState({x: 0, y: 0})
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({x: 0, y: 0})
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isEditorVisible, setIsEditorVisible] = useState(true)

    const previewRef = useRef(null)
    const fullscreenPreviewRef = useRef(null)
    const mermaidRef = useRef(null)
    const renderRequestIdRef = useRef(0)

    const applyPreviewTransform = useCallback((container) => {
        const svg = container?.querySelector('svg')

        if (!svg) {
            return
        }

        svg.style.transform = `scale(${previewZoom}) translate(${panOffset.x / previewZoom}px, ${panOffset.y / previewZoom}px)`
        svg.style.transformOrigin = 'center center'
        svg.style.transition = isDragging ? 'none' : 'transform 0.1s ease-out'
    }, [isDragging, panOffset.x, panOffset.y, previewZoom])

    useEffect(() => { setIsClient(true) }, [])

    useEffect(() => {
        if (!isClient) return
        const initMermaid = async () => {
            try {
                const mermaid = (await import('mermaid')).default
                mermaidRef.current = mermaid
                mermaid.initialize({startOnLoad: false, theme: 'default', securityLevel: 'loose', fontFamily: 'D2Coding, monospace'})
                setIsMermaidReady(true)
            } catch (e) {
                setError('Mermaid 초기화에 실패했습니다.')
            }
        }
        initMermaid()
    }, [isClient])

    const renderDiagram = useCallback(async (container) => {
        if (!mermaidRef.current || !container) return

        const requestId = ++renderRequestIdRef.current
        const trimmedCode = code.trim()

        if (!trimmedCode) {
            if (container.isConnected) {
                container.innerHTML = ''
            }
            if (requestId === renderRequestIdRef.current) {
                setError(null)
            }
            return
        }

        try {
            await mermaidRef.current.parse(trimmedCode)
            const id = `mermaid-${Date.now()}`
            const {svg} = await mermaidRef.current.render(id, trimmedCode)

            if (requestId !== renderRequestIdRef.current || !container.isConnected) {
                return
            }

            container.innerHTML = svg
            applyPreviewTransform(container)
            setError(null)
        } catch (e) {
            if (requestId !== renderRequestIdRef.current || !container.isConnected) {
                return
            }

            let errorMsg = e.message || 'Mermaid 문법 오류'
            errorMsg = errorMsg.replace(/💣/g, '').replace(/Syntax error in text\s*/gi, '')
            if (errorMsg.includes('No diagram type detected')) {
                errorMsg = '다이어그램 타입을 인식할 수 없습니다. flowchart, sequenceDiagram 등으로 시작해주세요.'
            }
            setError(errorMsg.trim() || '문법 오류')
            container.innerHTML = ''
        }
    }, [applyPreviewTransform, code])

    useEffect(() => {
        if (!mermaidRef.current || !isMermaidReady) return

        const target = isFullscreen ? fullscreenPreviewRef.current : previewRef.current
        if (!target) return

        const timer = setTimeout(() => {
            void renderDiagram(target)
        }, isFullscreen ? 80 : 300)

        return () => clearTimeout(timer)
    }, [code, isFullscreen, isMermaidReady, renderDiagram])

    useEffect(() => {
        const target = isFullscreen ? fullscreenPreviewRef.current : previewRef.current
        applyPreviewTransform(target)
    }, [applyPreviewTransform, isFullscreen])

    const downloadPng = async () => {
        try {
            const {toPng} = await import('html-to-image')
            const svgElement = (isFullscreen ? fullscreenPreviewRef.current : previewRef.current)?.querySelector('svg')
            if (!svgElement) { toast.warning('다이어그램을 먼저 생성해주세요.'); return }
            let options = {backgroundColor: 'white'}
            if (scaleMode === 'ratio') {
                options.pixelRatio = scale
            } else {
                const bbox = svgElement.getBoundingClientRect()
                const scaleX = customWidth / bbox.width
                const scaleY = customHeight / bbox.height
                options.pixelRatio = Math.min(scaleX, scaleY)
            }
            const dataUrl = await toPng(svgElement, options)
            downloadDataUrl(dataUrl, `mermaid-diagram-${Date.now()}.png`)
            toast.success('PNG 다운로드 완료')
        } catch (e) {
            toast.error('다운로드 실패: ' + e.message)
        }
    }

    const downloadSvg = () => {
        const svgElement = (isFullscreen ? fullscreenPreviewRef.current : previewRef.current)?.querySelector('svg')
        if (!svgElement) { toast.warning('다이어그램을 먼저 생성해주세요.'); return }
        const svgData = new XMLSerializer().serializeToString(svgElement)
        try {
            downloadBlob(new Blob([svgData], {type: 'image/svg+xml'}), `mermaid-diagram-${Date.now()}.svg`)
            toast.success('SVG 다운로드 완료')
        } catch (e) {
            toast.error('다운로드 실패: ' + e.message)
        }
    }

    const handleSampleChange = (type) => {
        setSelectedSample(type)
        setSelectedSampleIndex(0)
        setCode(SAMPLE_CODES[type][0].code)
    }

    const handleSampleIndexChange = (indexStr) => {
        const index = Number(indexStr)
        setSelectedSampleIndex(index)
        setCode(SAMPLE_CODES[selectedSample][index].code)
    }

    const handleWheel = useCallback((e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setPreviewZoom(prev => Math.min(Math.max(prev * delta, 0.1), 5))
    }, [])

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return
        setIsDragging(true)
        setDragStart({x: e.clientX - panOffset.x, y: e.clientY - panOffset.y})
    }, [panOffset])

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return
        setPanOffset({x: e.clientX - dragStart.x, y: e.clientY - dragStart.y})
    }, [isDragging, dragStart])

    const handleMouseUp = useCallback(() => { setIsDragging(false) }, [])

    const handleResetZoom = useCallback(() => {
        setPreviewZoom(1)
        setPanOffset({x: 0, y: 0})
    }, [])

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => {
            if (!prev) handleResetZoom()
            return !prev
        })
    }, [handleResetZoom])

    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false) }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFullscreen])

    if (!isClient) {
        return <div className="p-4 flex justify-center items-center min-h-[50vh]">로딩 중...</div>
    }

    const ZoomControls = () => (
        <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewZoom(z => Math.max(z * 0.8, 0.1))}>
                <ZoomOut className="h-3.5 w-3.5"/>
            </Button>
            <span className="text-xs w-11 text-center">{Math.round(previewZoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewZoom(z => Math.min(z * 1.2, 5))}>
                <ZoomIn className="h-3.5 w-3.5"/>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetZoom} title="리셋">
                <Crosshair className="h-3.5 w-3.5"/>
            </Button>
        </div>
    )

    const DownloadControls = () => (
        <div className="flex gap-1.5 items-center flex-wrap">
            <Select value={scaleMode} onValueChange={setScaleMode}>
                <SelectTrigger className="h-8 w-20 text-xs">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ratio">배율</SelectItem>
                    <SelectItem value="custom">픽셀</SelectItem>
                </SelectContent>
            </Select>

            {scaleMode === 'ratio' ? (
                <Select value={String(scale)} onValueChange={(v) => setScale(Number(v))}>
                    <SelectTrigger className="h-8 w-16 text-xs">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1x</SelectItem>
                        <SelectItem value="2">2x</SelectItem>
                        <SelectItem value="3">3x</SelectItem>
                        <SelectItem value="4">4x</SelectItem>
                    </SelectContent>
                </Select>
            ) : (
                <div className="flex items-center gap-1">
                    <Input type="number" value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} className="h-8 w-20 text-xs" min={100} max={8000}/>
                    <span className="text-xs">×</span>
                    <Input type="number" value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} className="h-8 w-20 text-xs" min={100} max={8000}/>
                </div>
            )}

            <div className="flex gap-1">
                <Button size="sm" onClick={downloadPng}>
                    <Download className="h-3.5 w-3.5 mr-1"/>PNG
                </Button>
                <Button size="sm" onClick={downloadSvg}>
                    <Download className="h-3.5 w-3.5 mr-1"/>SVG
                </Button>
            </div>
        </div>
    )

    const previewInteractionProps = {
        onWheel: handleWheel,
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseUp
    }
    const previewAreaClassName = `flex-1 overflow-hidden flex justify-center items-center bg-gray-50 border ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`

    // 일반 모드
    return (
        <>
            <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/util')}>
                        <ArrowLeft className="h-5 w-5"/>
                    </Button>
                    <h1 className="text-3xl font-bold">Mermaid Editor</h1>
                </div>

                {/* 샘플 선택 */}
                <div className="border rounded-md p-3 mb-3">
                    <p className="text-sm font-medium mb-2">샘플 다이어그램</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {SAMPLE_TYPES.map(({key, label}) => (
                            <button
                                key={key}
                                onClick={() => handleSampleChange(key)}
                                className={`text-sm px-3 py-1 rounded-full border transition-all ${selectedSample === key ? 'bg-blue-600 text-white border-blue-600 font-semibold' : 'hover:bg-gray-100'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <Select value={String(selectedSampleIndex)} onValueChange={handleSampleIndexChange}>
                        <SelectTrigger className="w-56">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            {SAMPLE_CODES[selectedSample].map((sample, index) => (
                                <SelectItem key={index} value={String(index)}>{sample.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{height: '65vh'}}>
                    {/* 에디터 영역 */}
                    <div className="border rounded-md p-3 flex flex-col">
                        <p className="font-semibold mb-2">코드</p>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="flex-1 w-full font-mono text-sm resize-none border rounded p-2 outline-none focus:ring-1 focus:ring-blue-400"
                        />
                    </div>

                    {/* 프리뷰 영역 */}
                    <div className="border rounded-md p-3 flex flex-col">
                        {/* 헤더 */}
                        <div className="flex justify-between items-center mb-2">
                            <p className="font-semibold">미리보기</p>
                            <div className="flex items-center gap-1">
                                <ZoomControls/>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleFullscreen} title="전체화면">
                                    <Maximize className="h-3.5 w-3.5"/>
                                </Button>
                            </div>
                        </div>

                        {/* 다운로드 컨트롤 */}
                        <div className="flex justify-end mb-2">
                            <DownloadControls/>
                        </div>

                        {error && (
                            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
                        )}

                        <div
                            ref={previewRef}
                            {...previewInteractionProps}
                            className={`${previewAreaClassName} rounded`}
                        />
                    </div>
                </div>

                <div className="mt-4 p-3 bg-gray-100 rounded-md">
                    <p className="text-sm font-semibold mb-1">Mermaid 문법 참고</p>
                    <p className="text-sm text-gray-500">
                        Mermaid는 텍스트 기반으로 다이어그램을 생성하는 도구입니다.
                        Flowchart, Sequence Diagram, Class Diagram, ER Diagram, Block Diagram, State Diagram 등 다양한 다이어그램을 지원합니다.
                        자세한 문법은{' '}
                        <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Mermaid 공식 문서
                        </a>
                        를 참고하세요.
                    </p>
                </div>
            </div>

            {isFullscreen && isClient && createPortal(
                <div className="fixed inset-0 z-[1200] bg-white flex flex-col">
                    <div className="p-2 border-b flex justify-between items-center flex-wrap gap-2 bg-white shadow-sm">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                                <Minimize className="h-5 w-5"/>
                            </Button>
                            <span className="font-semibold">미리보기</span>
                            <span className="text-xs text-gray-400">(ESC로 닫기)</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <ZoomControls/>
                            <div className="h-4 border-l"/>
                            <DownloadControls/>
                        </div>
                    </div>

                    {error && (
                        <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
                    )}

                    <div
                        ref={fullscreenPreviewRef}
                        {...previewInteractionProps}
                        className={`${previewAreaClassName} border-0 rounded-none`}
                    />

                    <div
                        className={`fixed bottom-5 right-5 z-[1300] shadow-2xl rounded-lg overflow-hidden border bg-white transition-all duration-300 ${isEditorVisible ? 'w-[420px]' : 'w-auto'}`}
                        style={{maxHeight: isEditorVisible ? '45vh' : 'auto'}}
                    >
                        <div className="flex items-center px-3 py-2 border-b bg-gray-50">
                            <span className="text-sm font-bold flex-1">코드</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditorVisible(!isEditorVisible)}>
                                {isEditorVisible ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
                            </Button>
                        </div>
                        {isEditorVisible && (
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full font-mono text-xs p-3 resize-none border-none outline-none"
                                style={{height: 'calc(45vh - 40px)'}}
                            />
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
