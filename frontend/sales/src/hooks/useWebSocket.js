import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL = 'ws://127.0.0.1:5265/ws/'
const RECONNECT_DELAY = 3000 // 3 seconds
const MAX_RECONNECT_DELAY = 30000 // 30 seconds max

// Singleton WebSocket manager - shared across all components
class WebSocketManager {
  constructor() {
    this.ws = null
    this.listeners = new Set()
    this.products = []
    this.isConnected = false
    this.reconnectTimeout = null
    this.reconnectAttempts = 0
    this.isConnecting = false
    this.connectionId = 0 // Track connection attempts to prevent premature closes
    this.updateCallbacks = {
      customer: new Set(),
      order: new Set(),
      orderProduct: new Set(),
      product: new Set()
    }
  }

  subscribe(listener) {
    this.listeners.add(listener)
    // Immediately notify new subscriber with current state
    listener({ products: this.products, isConnected: this.isConnected })
    
    // Connect if not already connected/connecting and we have listeners
    if (!this.isConnected && !this.isConnecting && this.listeners.size > 0) {
      this.connect()
    }
    
    return () => {
      this.listeners.delete(listener)
      // Only disconnect if no more listeners
      if (this.listeners.size === 0) {
        this.disconnect()
      }
    }
  }

  // Subscribe to specific update types
  onUpdate(type, callback) {
    if (this.updateCallbacks[type]) {
      this.updateCallbacks[type].add(callback)
      return () => {
        this.updateCallbacks[type].delete(callback)
      }
    }
    return () => {}
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({ products: this.products, isConnected: this.isConnected })
    })
  }

  notifyUpdateCallbacks(type, data) {
    if (this.updateCallbacks[type]) {
      this.updateCallbacks[type].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in ${type} update callback:`, error)
        }
      })
    }
  }

  connect() {
    // Don't connect if already connected or connecting
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    if (this.isConnecting || this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket connection already in progress')
      return
    }

    // Don't connect if no listeners
    if (this.listeners.size === 0) {
      console.log('No listeners, skipping connection')
      return
    }

    // Clean up existing connection if in closing/closed state
    if (this.ws && (this.ws.readyState === WebSocket.CLOSING || this.ws.readyState === WebSocket.CLOSED)) {
      this.ws = null
    }

    try {
      const connectionId = ++this.connectionId
      console.log(`Attempting to connect to WebSocket... (connection ${connectionId})`)
      this.isConnecting = true
      const ws = new WebSocket(WS_URL)
      this.ws = ws

      ws.onopen = () => {
        // Only proceed if this is still the current connection attempt
        if (connectionId !== this.connectionId) {
          console.log(`Connection ${connectionId} opened but superseded, closing`)
          ws.close(1000, 'Superseded')
          return
        }
        
        console.log(`✅ WebSocket connected successfully (connection ${connectionId})`)
        this.isConnected = true
        this.isConnecting = false
        this.reconnectAttempts = 0
        
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout)
          this.reconnectTimeout = null
        }
        
        this.notifyListeners()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket message received:', data)

          // Handle product updates
          if (data.type === 'productUpdate') {
            if (data.updateType === 'global' && data.products) {
              // Replace all products with the new list
              this.products = data.products
              this.notifyListeners()
              this.notifyUpdateCallbacks('product', { updateType: 'global', products: data.products })
            } else if (data.updateType === 'single' && data.updatedProduct) {
              // Update only the specific product
              const index = this.products.findIndex(p => p.productId === data.updatedProduct.productId)
              
              if (index >= 0) {
                // Update existing product
                this.products[index] = { ...this.products[index], ...data.updatedProduct }
              } else {
                // Add new product if it doesn't exist
                this.products.push(data.updatedProduct)
              }
              
              this.notifyListeners()
              this.notifyUpdateCallbacks('product', { updateType: 'single', product: data.updatedProduct })
            }
          } else if (data.status === 'success' && data.productId && data.remainingStock !== undefined) {
            // Handle stock reduction confirmation - update the product quantity
            const index = this.products.findIndex(p => p.productId === data.productId)
            
            if (index >= 0) {
              this.products[index] = { ...this.products[index], quantity: data.remainingStock }
              this.notifyListeners()
              this.notifyUpdateCallbacks('product', { updateType: 'single', product: { productId: data.productId, quantity: data.remainingStock } })
            }
          }
          // Handle customer updates
          else if (data.type === 'customerUpdate') {
            this.notifyUpdateCallbacks('customer', data)
          }
          // Handle order updates
          else if (data.type === 'orderUpdate') {
            this.notifyUpdateCallbacks('order', data)
          }
          // Handle order product updates
          else if (data.type === 'orderProductUpdate') {
            this.notifyUpdateCallbacks('orderProduct', data)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        this.isConnected = false
        this.isConnecting = false
        this.notifyListeners()
        // Note: onclose will be called after onerror, so we'll handle reconnection there
      }

      ws.onclose = (event) => {
        // Only handle if this is still the current connection
        if (connectionId !== this.connectionId) {
          return
        }
        
        console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`)
        this.isConnected = false
        this.isConnecting = false
        this.ws = null
        this.notifyListeners()

        // Only reconnect if it wasn't a manual close and there are still listeners
        if (event.code !== 1000 && this.listeners.size > 0) {
          // Clear any existing reconnect timeout
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
          }

          // Exponential backoff with max delay
          const delay = Math.min(RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), MAX_RECONNECT_DELAY)
          this.reconnectAttempts += 1

          console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)
          
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null
            // Only reconnect if we still have listeners
            if (this.listeners.size > 0) {
              this.connect()
            }
          }, delay)
        }
      }
    } catch (error) {
      console.error('❌ Error creating WebSocket:', error)
      this.isConnected = false
      this.isConnecting = false
      this.ws = null
      this.notifyListeners()
      
      // Schedule reconnect if there are still listeners
      if (this.listeners.size > 0) {
        // Clear any existing reconnect timeout
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout)
        }

        // Exponential backoff with max delay
        const delay = Math.min(RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), MAX_RECONNECT_DELAY)
        this.reconnectAttempts += 1

        console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)
        
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectTimeout = null
          if (this.listeners.size > 0) {
            this.connect()
          }
        }, delay)
      }
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.ws) {
      // Only close if we're actually connected (not connecting)
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Manual disconnect')
      } else if (this.ws.readyState === WebSocket.CONNECTING) {
        // If connecting, increment connectionId so the onopen handler will close it
        this.connectionId++
      }
      this.ws = null
    }
    
    this.isConnected = false
    this.isConnecting = false
    this.notifyListeners()
  }
}

// Create singleton instance
const wsManager = new WebSocketManager()

// Hook for products (existing functionality)
export function useWebSocket(onMessage) {
  const [state, setState] = useState({ products: [], isConnected: false })
  const listenerRef = useRef(null)

  useEffect(() => {
    // Create listener function
    listenerRef.current = (newState) => {
      setState(newState)
      if (onMessage) {
        onMessage(newState.products)
      }
    }

    // Subscribe to WebSocket manager
    const unsubscribe = wsManager.subscribe(listenerRef.current)

    return () => {
      unsubscribe()
    }
  }, [onMessage])

  const reconnect = useCallback(() => {
    wsManager.disconnect()
    wsManager.connect()
  }, [])

  return { 
    products: state.products, 
    isConnected: state.isConnected, 
    reconnect 
  }
}

// Hook for listening to specific update types
export function useWebSocketUpdates(type, callback) {
  useEffect(() => {
    if (!type || !callback) return
    
    const unsubscribe = wsManager.onUpdate(type, callback)
    return unsubscribe
  }, [type, callback])
}
