import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { resolveCapabilities } from '../access/capabilities'

export function useAccess() {
  const authStore = useAuthStore()
  const { roles } = storeToRefs(authStore)

  return computed(() => resolveCapabilities({ roles: roles.value }))
}
