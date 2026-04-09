export interface SearchEngine {
  id: string | number
  name: string
  url: string
  [key: string]: unknown
}
