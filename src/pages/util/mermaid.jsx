import {useState, useEffect, useRef, useCallback} from 'react'
import {
    Box, TextField, Button, Paper, Typography, Grid,
    Select, MenuItem, FormControl, InputLabel, ButtonGroup, Chip,
    IconButton, Tabs, Tab, Divider
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {useSnackbar} from 'notistack'
import {useRouter} from 'next/router'

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

export default function MermaidPage() {
    const router = useRouter()
    const {enqueueSnackbar} = useSnackbar()
    const [code, setCode] = useState(SAMPLE_CODES.flowchart[0].code)
    const [scaleMode, setScaleMode] = useState('ratio') // 'ratio' or 'custom'
    const [scale, setScale] = useState(2)
    const [customWidth, setCustomWidth] = useState(1920)
    const [customHeight, setCustomHeight] = useState(1080)
    const [error, setError] = useState(null)
    const [isClient, setIsClient] = useState(false)
    const [selectedSample, setSelectedSample] = useState('flowchart')
    const [selectedSampleIndex, setSelectedSampleIndex] = useState(0)

    // 미리보기 줌/팬 상태
    const [previewZoom, setPreviewZoom] = useState(1)
    const [panOffset, setPanOffset] = useState({x: 0, y: 0})
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({x: 0, y: 0})

    // 전체화면 상태
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isEditorVisible, setIsEditorVisible] = useState(true)

    const previewRef = useRef(null)
    const mermaidRef = useRef(null)

    // 클라이언트 사이드 체크
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Mermaid 초기화
    useEffect(() => {
        if (!isClient) return

        const initMermaid = async () => {
            try {
                const mermaid = (await import('mermaid')).default
                mermaidRef.current = mermaid
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose',
                    fontFamily: 'D2Coding, monospace'
                })
                renderDiagram()
            } catch (e) {
                setError('Mermaid 초기화에 실패했습니다.')
            }
        }

        initMermaid()
    }, [isClient])

    // 코드 변경 시 다이어그램 재렌더링 (디바운스 적용)
    useEffect(() => {
        if (!mermaidRef.current) return

        const timer = setTimeout(() => {
            renderDiagram()
        }, 300)

        return () => clearTimeout(timer)
    }, [code])

    // 전체화면 모드 전환 시 다이어그램 재렌더링
    useEffect(() => {
        if (!mermaidRef.current) return

        // DOM이 업데이트된 후 렌더링
        const timer = setTimeout(() => {
            renderDiagram()
        }, 50)

        return () => clearTimeout(timer)
    }, [isFullscreen])

    const renderDiagram = useCallback(async () => {
        if (!mermaidRef.current || !previewRef.current) return

        // 빈 코드일 경우 렌더링 건너뛰기
        const trimmedCode = code.trim()
        if (!trimmedCode) {
            previewRef.current.innerHTML = ''
            setError(null)
            return
        }

        try {
            // 먼저 문법 검사
            await mermaidRef.current.parse(trimmedCode)

            // 이전 렌더링 결과 삭제
            previewRef.current.innerHTML = ''

            // 고유 ID 생성
            const id = `mermaid-${Date.now()}`

            const {svg} = await mermaidRef.current.render(id, trimmedCode)
            previewRef.current.innerHTML = svg
            setError(null)
        } catch (e) {
            // 에러 메시지 정리 (폭탄 이모지 등 제거)
            let errorMsg = e.message || 'Mermaid 문법 오류'
            // 불필요한 특수문자 제거
            errorMsg = errorMsg.replace(/💣/g, '').replace(/Syntax error in text\s*/gi, '')
            if (errorMsg.includes('No diagram type detected')) {
                errorMsg = '다이어그램 타입을 인식할 수 없습니다. flowchart, sequenceDiagram 등으로 시작해주세요.'
            }
            setError(errorMsg.trim() || '문법 오류')
            previewRef.current.innerHTML = ''
        }
    }, [code])

    const downloadPng = async () => {
        try {
            const {toPng} = await import('html-to-image')
            const svgElement = previewRef.current?.querySelector('svg')
            if (!svgElement) {
                enqueueSnackbar('다이어그램을 먼저 생성해주세요.', {variant: 'warning'})
                return
            }

            let options = {backgroundColor: 'white'}

            if (scaleMode === 'ratio') {
                options.pixelRatio = scale
            } else {
                // 커스텀 사이즈: SVG의 원본 비율 유지하면서 스케일 계산
                const bbox = svgElement.getBoundingClientRect()
                const scaleX = customWidth / bbox.width
                const scaleY = customHeight / bbox.height
                options.pixelRatio = Math.min(scaleX, scaleY)
            }

            const dataUrl = await toPng(svgElement, options)

            const link = document.createElement('a')
            link.download = `mermaid-diagram-${Date.now()}.png`
            link.href = dataUrl
            link.click()

            enqueueSnackbar('PNG 다운로드 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('다운로드 실패: ' + e.message, {variant: 'error'})
        }
    }

    const downloadSvg = () => {
        const svgElement = previewRef.current?.querySelector('svg')
        if (!svgElement) {
            enqueueSnackbar('다이어그램을 먼저 생성해주세요.', {variant: 'warning'})
            return
        }

        const svgData = new XMLSerializer().serializeToString(svgElement)
        const blob = new Blob([svgData], {type: 'image/svg+xml'})
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.download = `mermaid-diagram-${Date.now()}.svg`
        link.href = url
        link.click()

        URL.revokeObjectURL(url)
        enqueueSnackbar('SVG 다운로드 완료', {variant: 'success'})
    }

    const handleSampleChange = (type) => {
        setSelectedSample(type)
        setSelectedSampleIndex(0)
        setCode(SAMPLE_CODES[type][0].code)
    }

    const handleSampleIndexChange = (index) => {
        setSelectedSampleIndex(index)
        setCode(SAMPLE_CODES[selectedSample][index].code)
    }

    // 줌/패닝 이벤트 핸들러
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
        setPanOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        })
    }, [isDragging, dragStart])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleResetZoom = useCallback(() => {
        setPreviewZoom(1)
        setPanOffset({x: 0, y: 0})
    }, [])

    // 전체화면 토글
    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => {
            if (!prev) {
                // 전체화면 진입 시 줌 리셋
                handleResetZoom()
            }
            return !prev
        })
    }, [handleResetZoom])

    // ESC 키로 전체화면 종료
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFullscreen])

    if (!isClient) {
        return (
            <Box sx={{p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh'}}>
                <Typography>로딩 중...</Typography>
            </Box>
        )
    }

    // 미리보기 컨테이너 공통 컴포넌트
    const PreviewContainer = ({fullscreen = false}) => (
        <Box
            ref={!fullscreen ? previewRef : undefined}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            sx={{
                flexGrow: 1,
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#fafafa',
                borderRadius: 1,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                '& svg': {
                    transform: `scale(${previewZoom}) translate(${panOffset.x / previewZoom}px, ${panOffset.y / previewZoom}px)`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }
            }}
        />
    )

    // 줌 컨트롤 공통 컴포넌트
    const ZoomControls = () => (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
            <IconButton size="small" onClick={() => setPreviewZoom(z => Math.max(z * 0.8, 0.1))}>
                <ZoomOutIcon fontSize="small"/>
            </IconButton>
            <Typography variant="body2" sx={{minWidth: 45, textAlign: 'center'}}>
                {Math.round(previewZoom * 100)}%
            </Typography>
            <IconButton size="small" onClick={() => setPreviewZoom(z => Math.min(z * 1.2, 5))}>
                <ZoomInIcon fontSize="small"/>
            </IconButton>
            <IconButton size="small" onClick={handleResetZoom} title="리셋">
                <CenterFocusStrongIcon fontSize="small"/>
            </IconButton>
        </Box>
    )

    // 다운로드 컨트롤 공통 컴포넌트
    const DownloadControls = () => (
        <Box sx={{display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap'}}>
            <FormControl size="small" sx={{minWidth: 80}}>
                <InputLabel>모드</InputLabel>
                <Select
                    value={scaleMode}
                    label="모드"
                    onChange={(e) => setScaleMode(e.target.value)}
                >
                    <MenuItem value="ratio">배율</MenuItem>
                    <MenuItem value="custom">픽셀</MenuItem>
                </Select>
            </FormControl>

            {scaleMode === 'ratio' ? (
                <FormControl size="small" sx={{minWidth: 70}}>
                    <InputLabel>배율</InputLabel>
                    <Select
                        value={scale}
                        label="배율"
                        onChange={(e) => setScale(e.target.value)}
                    >
                        <MenuItem value={1}>1x</MenuItem>
                        <MenuItem value={2}>2x</MenuItem>
                        <MenuItem value={3}>3x</MenuItem>
                        <MenuItem value={4}>4x</MenuItem>
                    </Select>
                </FormControl>
            ) : (
                <>
                    <TextField
                        size="small"
                        label="너비"
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Number(e.target.value))}
                        sx={{width: 80}}
                        InputProps={{inputProps: {min: 100, max: 8000}}}
                    />
                    <Typography variant="body2">×</Typography>
                    <TextField
                        size="small"
                        label="높이"
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Number(e.target.value))}
                        sx={{width: 80}}
                        InputProps={{inputProps: {min: 100, max: 8000}}}
                    />
                </>
            )}

            <ButtonGroup variant="contained" size="small">
                <Button onClick={downloadPng} startIcon={<DownloadIcon/>}>PNG</Button>
                <Button onClick={downloadSvg} startIcon={<DownloadIcon/>}>SVG</Button>
            </ButtonGroup>
        </Box>
    )

    // 전체화면 모드
    if (isFullscreen) {
        return (
            <Box sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1200,
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* 상단 툴바 */}
                <Paper elevation={2} sx={{p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <IconButton onClick={toggleFullscreen}>
                            <FullscreenExitIcon/>
                        </IconButton>
                        <Typography variant="h6">미리보기</Typography>
                        <Typography variant="caption" color="text.secondary">(ESC로 닫기)</Typography>
                    </Box>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
                        <ZoomControls/>
                        <Divider orientation="vertical" flexItem/>
                        <DownloadControls/>
                    </Box>
                </Paper>

                {/* 에러 표시 */}
                {error && (
                    <Paper sx={{p: 1, mx: 2, mt: 1, backgroundColor: 'error.light'}}>
                        <Typography color="error.contrastText" variant="body2">
                            {error}
                        </Typography>
                    </Paper>
                )}

                {/* 전체화면 미리보기 */}
                <Box
                    ref={previewRef}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    sx={{
                        flexGrow: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#fafafa',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        userSelect: 'none',
                        '& svg': {
                            transform: `scale(${previewZoom}) translate(${panOffset.x / previewZoom}px, ${panOffset.y / previewZoom}px)`,
                            transformOrigin: 'center center',
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                        }
                    }}
                />

                {/* 플로팅 코드 에디터 */}
                <Paper
                    elevation={8}
                    sx={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        width: isEditorVisible ? 420 : 'auto',
                        maxHeight: isEditorVisible ? '45vh' : 'auto',
                        zIndex: 1300,
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        borderBottom: isEditorVisible ? 1 : 0,
                        borderColor: 'divider',
                        backgroundColor: 'grey.100'
                    }}>
                        <Typography variant="subtitle2" sx={{flexGrow: 1, fontWeight: 'bold'}}>
                            코드
                        </Typography>
                        <IconButton size="small" onClick={() => setIsEditorVisible(!isEditorVisible)}>
                            {isEditorVisible ? <VisibilityOffIcon fontSize="small"/> : <VisibilityIcon fontSize="small"/>}
                        </IconButton>
                    </Box>
                    {isEditorVisible && (
                        <TextField
                            multiline
                            fullWidth
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            sx={{
                                flexGrow: 1,
                                '& .MuiInputBase-root': {
                                    height: '100%',
                                    alignItems: 'flex-start',
                                    borderRadius: 0
                                },
                                '& .MuiInputBase-input': {
                                    height: 'calc(45vh - 56px) !important',
                                    overflow: 'auto !important'
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none'
                                }
                            }}
                            InputProps={{
                                sx: {fontFamily: 'D2Coding, monospace', fontSize: 13}
                            }}
                        />
                    )}
                </Paper>
            </Box>
        )
    }

    // 일반 모드
    return (
        <Box sx={{p: 2}}>
            <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                <IconButton onClick={() => router.push('/util')} sx={{mr: 1}}>
                    <ArrowBackIcon/>
                </IconButton>
                <Typography variant="h4" sx={{fontWeight: 'bold'}}>
                    Mermaid Editor
                </Typography>
            </Box>

            {/* 샘플 선택 */}
            <Paper elevation={1} sx={{p: 2, mb: 2}}>
                <Typography variant="subtitle2" sx={{mb: 1}}>샘플 다이어그램</Typography>
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5}}>
                    {[
                        {key: 'flowchart', label: 'Flowchart'},
                        {key: 'sequence', label: 'Sequence'},
                        {key: 'classDiagram', label: 'Class'},
                        {key: 'erDiagram', label: 'ER Diagram'},
                        {key: 'blockDiagram', label: 'Block'},
                        {key: 'stateDiagram', label: 'State'},
                    ].map(({key, label}) => (
                        <Chip
                            key={key}
                            label={label}
                            onClick={() => handleSampleChange(key)}
                            color={selectedSample === key ? 'primary' : 'default'}
                            variant={selectedSample === key ? 'filled' : 'outlined'}
                            sx={{
                                fontWeight: selectedSample === key ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        />
                    ))}
                </Box>
                <FormControl size="small" sx={{minWidth: 220}}>
                    <InputLabel>샘플</InputLabel>
                    <Select
                        value={selectedSampleIndex}
                        label="샘플"
                        onChange={(e) => handleSampleIndexChange(e.target.value)}
                    >
                        {SAMPLE_CODES[selectedSample].map((sample, index) => (
                            <MenuItem key={index} value={index}>{sample.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            <Grid container spacing={2}>
                {/* 에디터 영역 */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{p: 2, height: '65vh', display: 'flex', flexDirection: 'column'}}>
                        <Typography variant="h6" gutterBottom>코드</Typography>
                        <TextField
                            multiline
                            fullWidth
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            sx={{
                                flexGrow: 1,
                                '& .MuiInputBase-root': {
                                    height: '100%',
                                    alignItems: 'flex-start'
                                },
                                '& .MuiInputBase-input': {
                                    height: '100% !important',
                                    overflow: 'auto !important'
                                }
                            }}
                            InputProps={{
                                sx: {fontFamily: 'D2Coding, monospace', fontSize: 14}
                            }}
                        />
                    </Paper>
                </Grid>

                {/* 프리뷰 영역 */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{p: 2, height: '65vh', display: 'flex', flexDirection: 'column'}}>
                        {/* 헤더: 제목 + 줌 컨트롤 + 전체화면 */}
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                            <Typography variant="h6">미리보기</Typography>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <ZoomControls/>
                                <IconButton size="small" onClick={toggleFullscreen} title="전체화면">
                                    <FullscreenIcon/>
                                </IconButton>
                            </Box>
                        </Box>

                        {/* 다운로드 컨트롤 */}
                        <Box sx={{display: 'flex', justifyContent: 'flex-end', mb: 1, flexWrap: 'wrap', gap: 1}}>
                            <DownloadControls/>
                        </Box>

                        {error && (
                            <Paper sx={{p: 1, mb: 1, backgroundColor: 'error.light'}}>
                                <Typography color="error.contrastText" variant="body2">
                                    {error}
                                </Typography>
                            </Paper>
                        )}

                        <Box
                            ref={previewRef}
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            sx={{
                                flexGrow: 1,
                                overflow: 'hidden',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#fafafa',
                                borderRadius: 1,
                                cursor: isDragging ? 'grabbing' : 'grab',
                                userSelect: 'none',
                                '& svg': {
                                    transform: `scale(${previewZoom}) translate(${panOffset.x / previewZoom}px, ${panOffset.y / previewZoom}px)`,
                                    transformOrigin: 'center center',
                                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                                }
                            }}
                        />
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1}}>
                <Typography variant="subtitle2" sx={{mb: 1}}>Mermaid 문법 참고</Typography>
                <Typography variant="body2" color="text.secondary">
                    Mermaid는 텍스트 기반으로 다이어그램을 생성하는 도구입니다.
                    Flowchart, Sequence Diagram, Class Diagram, ER Diagram, Block Diagram, State Diagram 등 다양한 다이어그램을 지원합니다.
                    자세한 문법은{' '}
                    <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" rel="noopener noreferrer">
                        Mermaid 공식 문서
                    </a>
                    를 참고하세요.
                </Typography>
            </Box>
        </Box>
    )
}
