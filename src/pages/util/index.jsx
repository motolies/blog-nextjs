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
        <div className="p-5 sm:p-7">
            <div className="max-w-3xl">
                <span className="section-eyebrow">
                    <Braces className="h-3.5 w-3.5"/>
                    Developer Utilities
                </span>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {utilities.map((util) => {
                    const Icon = util.icon
                    return (
                        <Link
                            key={util.id}
                            href={util.path}
                            className="group block rounded-[1.6rem] border border-slate-200/80 bg-white/82 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_24px_50px_rgba(15,23,42,0.1)]"
                        >
                            <div className="flex items-start gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0d7ff2,#7dd3fc)] text-white shadow-[0_12px_30px_rgba(13,127,242,0.24)]">
                                    <Icon className="h-5 w-5"/>
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950 transition group-hover:text-sky-700">
                                        {util.title}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{util.description}</p>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
