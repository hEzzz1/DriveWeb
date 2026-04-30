import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { resolveCapabilities } from '../access/capabilities'

export function useAccess() {
  const authStore = useAuthStore()
  const { permissions, workspaceDomain } = storeToRefs(authStore)

  return computed(() =>
    resolveCapabilities({
      permissions: permissions.value,
      workspaceDomain: workspaceDomain.value,
    }),
  )
}
