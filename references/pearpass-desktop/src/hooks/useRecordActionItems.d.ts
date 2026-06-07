export type RecordActionItem = {
  name: string
  type: string
  click?: () => void
}

export function useRecordActionItems(params?: {
  excludeTypes?: string[]
  record?: { id?: string; type?: string; isFavorite?: boolean } & Record<
    string,
    unknown
  >
onSelect?: () => void
  onClose?: () => void
}): {
  actions: RecordActionItem[]
}
