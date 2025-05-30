export interface ItemWithId {
  id: number
}

export interface GlossaryItem extends ItemWithId {
  term: string
  description: string
}

export interface RequiredToolsItem extends ItemWithId {
  body: string
}

export interface GenerationSettings {
  title: string
  author: string
  patternUrl: string
  coverImageUri: string
  glossary: GlossaryItem[]
  content: {
    requiredItems: RequiredToolsItem[]
    body: string
  }
}
