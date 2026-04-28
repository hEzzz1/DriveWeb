import type { PageQuery, PageResult } from '../types/api'

export async function fetchAllPages<T, Q extends PageQuery>(
  fetchPage: (params: Q) => Promise<PageResult<T>>,
  params: Omit<Q, 'page' | 'size'>,
  pageSize = 100,
): Promise<T[]> {
  const items: T[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY

  while (items.length < total) {
    const data = await fetchPage({
      ...params,
      page,
      size: pageSize,
    } as Q)

    items.push(...data.items)
    total = data.total || items.length

    if (!data.items.length || data.items.length < pageSize) {
      break
    }

    page += 1
  }

  return items
}
