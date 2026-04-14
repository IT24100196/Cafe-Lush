import { useCallback, useEffect, useRef } from 'react'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000'
const RECONNECT_DELAY = 3000

/**
 * Connects to ws/orders/ and fires callbacks on incoming events.
 *
 * @param {object} handlers
 * @param {(order: object) => void} handlers.onNewOrder
 * @param {(order: object) => void} handlers.onOrderUpdated
 * @param {(status: 'connecting'|'connected'|'reconnecting'|'offline') => void} handlers.onStatusChange
 */
export function useOrderSocket({ onNewOrder, onOrderUpdated, onStatusChange } = {}) {
  const wsRef = useRef(null)
  const timerRef = useRef(null)
  const mountedRef = useRef(true)
  const connectRef = useRef(null)

  const onNewOrderRef = useRef(onNewOrder)
  const onOrderUpdatedRef = useRef(onOrderUpdated)
  const onStatusChangeRef = useRef(onStatusChange)

  useEffect(() => { onNewOrderRef.current = onNewOrder }, [onNewOrder])
  useEffect(() => { onOrderUpdatedRef.current = onOrderUpdated }, [onOrderUpdated])
  useEffect(() => { onStatusChangeRef.current = onStatusChange }, [onStatusChange])

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return
    onStatusChangeRef.current?.('reconnecting')
    timerRef.current = setTimeout(() => connectRef.current?.(), RECONNECT_DELAY)
  }, [])

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    onStatusChangeRef.current?.('connecting')

    const ws = new WebSocket(`${WS_BASE}/ws/orders/`)
    wsRef.current = ws

    ws.onopen = () => {
      onStatusChangeRef.current?.('connected')
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'new_order') onNewOrderRef.current?.(msg.order)
        if (msg.type === 'order_updated') onOrderUpdatedRef.current?.(msg.order)
      } catch {
        // Ignore malformed frames.
      }
    }

    ws.onerror = () => {
      onStatusChangeRef.current?.('reconnecting')
    }

    ws.onclose = () => {
      scheduleReconnect()
    }
  }, [scheduleReconnect])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      clearTimeout(timerRef.current)

      const ws = wsRef.current
      if (!ws) {
        onStatusChangeRef.current?.('offline')
        return
      }

      if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => ws.close()
      } else {
        ws.close()
      }

      onStatusChangeRef.current?.('offline')
    }
  }, [connect])
}
