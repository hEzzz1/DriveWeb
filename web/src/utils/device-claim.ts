export interface DeviceClaimPayload {
  deviceCode?: string
  deviceName?: string
  activationCode?: string
}

export function formatClaimCode(activationCode?: string): string {
  if (!activationCode) {
    return ''
  }

  const normalized = activationCode.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
  if (!normalized) {
    return ''
  }

  const groups = normalized.match(/.{1,4}/g)
  return groups ? groups.join('-') : normalized
}

export function buildClaimQrPayload(payload: DeviceClaimPayload): string {
  const claimCode = formatClaimCode(payload.activationCode)

  return [
    'DriveWeb Device Claim',
    payload.deviceCode ? `设备码: ${payload.deviceCode}` : '',
    payload.deviceName ? `设备名: ${payload.deviceName}` : '',
    payload.activationCode ? `ActivationCode: ${payload.activationCode}` : '',
    claimCode ? `认领码: ${claimCode}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
