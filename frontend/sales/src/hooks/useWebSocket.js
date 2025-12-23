import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL = 'ws://127.0.0.1:5265/ws/'

export function useWebSocket(onMessage) {
  const [products, setProducts] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const onMessageRef = useRef(onMessage)

  // Keep onMessage callback ref updated
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket message:', data)

          if (data.type === 'productUpdate') {
            if (data.updateType === 'global' && data.products) {
              // Replace all products with the new list
              setProducts(data.products)
              if (onMessageRef.current) {
                onMessageRef.current(data.products)
              }
            } else if (data.updateType === 'single' && data.updatedProduct) {
              // Update only the specific product
              setProducts(prevProducts => {
                const updated = [...prevProducts]
                const index = updated.findIndex(p => p.productId === data.updatedProduct.productId)
                
                if (index >= 0) {
                  // Update existing product
                  updated[index] = { ...updated[index], ...data.updatedProduct }
                } else {
                  // Add new product if it doesn't exist
                  updated.push(data.updatedProduct)
                }
                
                // Notify callback with updated products
                if (onMessageRef.current) {
                  onMessageRef.current(updated)
                }
                
                return updated
              })
            }
          } else if (data.status === 'success' && data.productId && data.remainingStock !== undefined) {
            // Handle stock reduction confirmation - update the product quantity
            setProducts(prevProducts => {
              const updated = [...prevProducts]
              const index = updated.findIndex(p => p.productId === data.productId)
              
              if (index >= 0) {
                updated[index] = { ...updated[index], quantity: data.remainingStock }
                
                // Notify callback with updated products
                if (onMessageRef.current) {
                  onMessageRef.current(updated)
                }
                
                return updated
              }
              
              return prevProducts
            })
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect after 3 seconds
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null
            connect()
          }, 3000)
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return { products, isConnected, reconnect: connect }
}

