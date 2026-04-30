export interface EnterpriseActivationCodeSummary {
  enterpriseId: number
  enterpriseName?: string
  activationCode: string
  activationCodeMasked?: string
  status: string
  rotatedAt?: string
  expiresAt?: string
}

export interface EnterpriseActivationCodeApiItem {
  enterpriseId: number
  enterpriseName?: string | null
  activationCode: string
  activationCodeMasked?: string | null
  status: string
  rotatedAt?: string | null
  expiresAt?: string | null
}
