export interface EnterpriseBindCodeSummary {
  enterpriseId: number
  enterpriseName?: string
  bindCode: string
  bindCodeMasked?: string
  status: string
  rotatedAt?: string
  expiresAt?: string
}

export interface EnterpriseBindCodeApiItem {
  enterpriseId: number
  enterpriseName?: string | null
  bindCode: string
  bindCodeMasked?: string | null
  status: string
  rotatedAt?: string | null
  expiresAt?: string | null
}
