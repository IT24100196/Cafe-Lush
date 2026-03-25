import { useEffect, useRef, useCallback } from 'react'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000'
const RECONNECT_DELAY = 3000

/**
 * Connects to ws/orders/ and fires callbacks on incoming events.
 *
 * @param {object} handlers
 * @param {(order: object) => void} handlers.onNewOrder     — fired when type === 'new_order'
 * @param {(order: object) => void} handlers.onOrderUpdated — fired when type === 'order_updated'
 */
export function useOrderSocket({ onNewOrder, onOrderUpdated } = {}) {
  const wsRef      = useRef(null)
  const timerRef   = useRef(null)
  const mountedRef = useRef(true)

  const onNewOrderRef     = useRef(onNewOrder)
  const onOrderUpdatedRef = useRef(onOrderUpdated)
  useEffect(() => { onNewOrderRef.current     = onNewOrder     }, [onNewOrder])
  useEffect(() => { onOrderUpdatedRef.current = onOrderUpdated }, [onOrderUpdated])

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    const ws = new WebSocket(`${WS_BASE}/ws/orders/`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'new_order')     onNewOrderRef.current?.(msg.order)
        if (msg.type === 'order_updated') onOrderUpdatedRef.current?.(msg.order)
      } catch { /* malformed frame — ignore */ }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      timerRef.current = setTimeout(connect, RECONNECT_DELAY)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimeout(timerRef.current)
      const ws = wsRef.current
      if (!ws) return
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => ws.close()
      } else {
        ws.close()
      }
    }
  }, [connect])
}
