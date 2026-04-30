import { request } from './http'
import type {
  EnterpriseActivationCodeApiItem,
  EnterpriseActivationCodeSummary,
} from '../types/enterprise-activation-codes'

function normalizeEnterpriseActivationCode(
  item: EnterpriseActivationCodeApiItem,
): EnterpriseActivationCodeSummary {
  return {
    enterpriseId: item.enterpriseId,
    enterpriseName: item.enterpriseName || undefined,
    activationCode: item.activationCode,
    activationCodeMasked: item.activationCodeMasked || undefined,
    status: item.status,
    rotatedAt: item.rotatedAt || undefined,
    expiresAt: item.expiresAt || undefined,
  }
}

export function getEnterpriseActivationCode(
  enterpriseId: number | string,
  options?: { silentError?: boolean },
): Promise<EnterpriseActivationCodeSummary> {
  return request<EnterpriseActivationCodeApiItem>({
    url: `/enterprises/${enterpriseId}/activation-code`,
    method: 'GET',
    silentError: options?.silentError,
  }).then(normalizeEnterpriseActivationCode)
}

export function rotateEnterpriseActivationCode(
  enterpriseId: number | string,
): Promise<EnterpriseActivationCodeSummary> {
  return request<EnterpriseActivationCodeApiItem>({
    url: `/enterprises/${enterpriseId}/activation-code/rotate`,
    method: 'POST',
  }).then(normalizeEnterpriseActivationCode)
}

export function disableEnterpriseActivationCode(
  enterpriseId: number | string,
): Promise<EnterpriseActivationCodeSummary> {
  return request<EnterpriseActivationCodeApiItem>({
    url: `/enterprises/${enterpriseId}/activation-code/disable`,
    method: 'POST',
  }).then(normalizeEnterpriseActivationCode)
}

export function getOrgEnterpriseActivationCode(options?: {
  silentError?: boolean
}): Promise<EnterpriseActivationCodeSummary> {
  return request<EnterpriseActivationCodeApiItem>({
    url: '/org/enterprise-profile/activation-code',
    method: 'GET',
    silentError: options?.silentError,
  }).then(normalizeEnterpriseActivationCode)
}

export function rotateOrgEnterpriseActivationCode(): Promise<EnterpriseActivationCodeSummary> {
  return request<EnterpriseActivationCodeApiItem>({
    url: '/org/enterprise-profile/activation-code/rotate',
    method: 'POST',
  }).then(normalizeEnterpriseActivationCode)
}

export function disableOrgEnterpriseActivationCode(): Promise<EnterpriseActivationCodeSummary> {
  return request<EnterpriseActivationCodeApiItem>({
    url: '/org/enterprise-profile/activation-code/disable',
    method: 'POST',
  }).then(normalizeEnterpriseActivationCode)
}
