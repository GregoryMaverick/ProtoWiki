import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const QUERY_KEY = 'engineerMode'

function parseEngineerModeQuery(value: unknown): boolean {
  if (value === null || value === undefined) return false
  const s = Array.isArray(value) ? value[0] : String(value)
  return s === '1' || s === 'true'
}

/**
 * Opt-in Engineer Mode (?engineerMode=1). Syncs with the URL query so links are shareable.
 */
export function useEngineerMode() {
  const route = useRoute()
  const router = useRouter()

  const active = ref(parseEngineerModeQuery(route.query[QUERY_KEY]))

  watch(
    () => route.query[QUERY_KEY],
    (q) => {
      active.value = parseEngineerModeQuery(q)
    },
  )

  const isActive = computed(() => active.value)

  async function setActive(next: boolean) {
    active.value = next
    const query = { ...route.query }
    if (next) {
      query[QUERY_KEY] = '1'
    } else {
      delete query[QUERY_KEY]
    }
    await router.replace({ path: route.path, query, hash: route.hash })
  }

  async function toggle() {
    await setActive(!active.value)
  }

  return {
    isActive,
    setActive,
    toggle,
  }
}
