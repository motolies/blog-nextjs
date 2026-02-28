import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {useState} from "react"
import {ArrowUpRight, Search} from "lucide-react"

export const SearchEngineComponent = ({engines = []}) => {
  const [selectedUrl, setSelectedUrl] = useState(engines[0]?.url ?? "")
  const [text, setText] = useState("")
  // 맥북에서 한글 입력 상태를 관리하기 위함
  const [isComposing, setIsComposing] = useState(false)
  const controlClassName = "h-12 min-h-12 rounded-2xl text-sm"

  const selectedEngine = engines.find((engine) => engine.url === selectedUrl) ?? engines[0]

  const host = (() => {
    try {
      return new URL(selectedEngine?.url ?? "").hostname.replace(/^www\./, "")
    } catch (error) {
      return "search endpoint"
    }
  })()

  const goSearch = () => {
    if (!selectedEngine?.url || text.length === 0) {
      return
    }

    const searchUrl = selectedEngine.url.replace("%s", encodeURIComponent(text))
    window.open(searchUrl, "_blank")
  }

  return (
      <div className="surface-panel-strong w-full rounded-[1.75rem] border border-slate-200/80 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Quick Search</p>
            <p className="mt-2 text-sm text-slate-500">
              현재 선택: <span className="font-medium text-slate-700">{host}</span>
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Search className="h-4 w-4"/>
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(160px,220px)_minmax(0,1fr)_140px]">
          <Select value={selectedEngine?.url ?? ""} onValueChange={setSelectedUrl}>
            <SelectTrigger className={`${controlClassName} w-full border-slate-200/90 bg-white/90 px-4 py-0 leading-none`}>
              <SelectValue placeholder="검색 엔진 선택"/>
            </SelectTrigger>
            <SelectContent>
              {engines.map((engine) => (
                  <SelectItem key={engine.id} value={engine.url}>
                    {engine.name}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
              type="search"
              value={text}
              placeholder={selectedEngine?.name ? `${selectedEngine.name}에서 검색` : "검색어 입력"}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (!isComposing && e.key === "Enter") {
                  goSearch()
                }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              className={`${controlClassName} border-slate-200/90 bg-white/90 px-4 text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-sky-100`}
          />

          <Button
              type="button"
              onClick={goSearch}
              disabled={!selectedEngine?.url || text.length === 0}
              className={`${controlClassName} w-full bg-sky-600 px-5 text-white hover:bg-sky-700 disabled:bg-slate-300`}
          >
            <ArrowUpRight className="h-4 w-4"/>
            Search
          </Button>
        </div>
      </div>
  )
}
