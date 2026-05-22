import type { UseQueryResult } from '@tanstack/react-query'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type QueryStateResult<TData, TError> = UseQueryResult<TData, TError> & {
  /**
   * ⏳ Aucune donnée ET fetch en cours (tout premier chargement)
   */
  isInitialLoading: boolean

  /**
   * 🔄 Données déjà présentes ET fetch en cours (refetch en arrière-plan)
   */
  isRefetching: boolean

  /**
   * 🔴 Stream actif : au moins un chunk reçu, stream toujours ouvert
   * (uniquement pertinent avec streamedOptions / liveOptions)
   */
  isStreaming: boolean

  /**
   * ⏳ Stream démarré mais aucun chunk encore reçu
   * (uniquement pertinent avec streamedOptions / liveOptions)
   */
  isStreamPending: boolean

  /**
   * ✅ Stream terminé avec succès (données présentes, fetch idle)
   */
  isStreamDone: boolean

  /**
   * 📡 Query en pause (réseau offline ou networkMode)
   */
  isOffline: boolean

  /**
   * ⏳ isInitialLoading OU isStreamPending
   */
  isLoadingOrStreaming: boolean

  /**
   * 🗂️ Données présentes mais vides (array vide ou null/undefined)
   */
  isEmpty: boolean
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

export function queryState<TData, TError = Error>(
  query: UseQueryResult<TData, TError>
): QueryStateResult<TData, TError> {
  const { fetchStatus, data, isFetching, isSuccess, isPending } = query

  // ── Core derived states ──────────────────────
  const isInitialLoading = isPending && fetchStatus === 'fetching'
  const isRefetching     = isSuccess && isFetching
  const isOffline        = fetchStatus === 'paused'

  // ── Streaming states ─────────────────────────
  const isStreaming      = isSuccess && isFetching
  const isStreamPending  = isPending && isFetching
  const isStreamDone     = isSuccess && fetchStatus === 'idle'

  // ── Combined ─────────────────────────────────
  const isLoadingOrStreaming = isInitialLoading || isStreamPending

  // ── Empty check ───────────────────────────────
  const isEmpty = isSuccess && (
    data == null ||
    (Array.isArray(data) && data.length === 0)
  )

  return {
    ...query,
    isInitialLoading,
    isRefetching,
    isStreaming,
    isStreamPending,
    isStreamDone,
    isOffline,
    isLoadingOrStreaming,
    isEmpty,
  }
}