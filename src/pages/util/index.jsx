import Link from 'next/link'
import {ArrowLeftRight, GitBranch, QrCode, Lock, Clock, Braces} from 'lucide-react'

const utilities = [
    {
        id: 'tsid',
        title: 'TSID Converter',
        description: 'TSID 생성 및 변환 도구. TSID와 숫자, 날짜/시간 간 변환 기능을 제공합니다.',
        icon: ArrowLeftRight,
        path: '/util/tsid'
    },
    {
        id: 'mermaid',
        title: 'Mermaid Editor',
        description: '실시간 Mermaid 다이어그램 에디터. 차트를 편집하고 이미지로 내보낼 수 있습니다.',
        icon: GitBranch,
        path: '/util/mermaid'
    },
    {
        id: 'barcode',
        title: 'Barcode Generator',
        description: '1D 바코드(CODE128, EAN 등)와 QR 코드를 생성하고 이미지로 다운로드할 수 있습니다.',
        icon: QrCode,
        path: '/util/barcode'
    },
    {
        id: 'encode',
        title: 'Encoder / Decoder',
        description: 'Base64, URL, HTML, Unicode, 해시(MD5/SHA256), JWT, JSON 등 다양한 인코딩/디코딩 도구입니다.',
        icon: Lock,
        path: '/util/encode'
    },
    {
        id: 'crontab',
        title: 'Crontab Calculator',
        description: 'Unix crontab과 Spring Scheduler cron 표현식을 분석하고 다음 실행 시간을 계산합니다.',
        icon: Clock,
        path: '/util/crontab'
    },
    {
        id: 'regex-tester',
        title: '정규식 테스터',
        description: 'JavaScript, Java, C#, Python 정규식 패턴을 테스트하고 매칭 결과와 그룹 캡처를 확인합니다.',
        icon: Braces,
        path: '/util/regex-tester'
    }
]

export default function UtilIndexPage() {
    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-2">유틸리티</h1>
            <p className="text-gray-500 mb-6">개발에 유용한 도구 모음입니다.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {utilities.map((util) => {
                    const Icon = util.icon
                    return (
                        <Link
                            key={util.id}
                            href={util.path}
                            className="border rounded-lg p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 block"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <Icon className="h-10 w-10 text-blue-600 shrink-0"/>
                                <h2 className="text-lg font-medium">{util.title}</h2>
                            </div>
                            <p className="text-sm text-gray-500">{util.description}</p>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
