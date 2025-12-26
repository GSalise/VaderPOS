import { useState, useEffect } from 'react'
import { OrderApi } from '../api.js'
import { useWebSocketUpdates } from '../hooks/useWebSocket.js'

// Normalize server/order objects to a consistent shape used by the UI
function normalizeOrder(raw) {
  if (!raw || typeof raw !== 'object') return null
  const orderId = raw.orderId ?? raw.OrderId ?? raw.id ?? raw.ID
  const customerId = raw.customerId ?? raw.CustomerId
  const orderDate = raw.orderDate ?? raw.OrderDate
  const isCheckedOut = raw.isCheckedOut ?? raw.IsCheckedOut ?? false
  const deleted = raw.deleted ?? raw.Deleted ?? false
  return { orderId, customerId, orderDate, isCheckedOut, deleted }
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [deleteId, setDeleteId] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadOrders() {
    setLoading(true)
    try {
      const data = await OrderApi.list()
      console.log(data)
      const normalized = (Array.isArray(data) ? data : [])
        .map(normalizeOrder)
        .filter(Boolean)
        .filter(o => !o.isCheckedOut)
      setOrders(normalized)
    } catch (e) {
      alert(`Failed to load orders: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Listen to WebSocket order updates
  useWebSocketUpdates('order', (data) => {
    if (data.updateType === 'single' && data.order) {
      const updated = normalizeOrder(data.order)
      if (!updated || updated.orderId == null) return
      if (updated.deleted) {
        setOrders(prev => prev.filter(o => o.orderId !== updated.orderId))
      } else {
        setOrders(prev => {
          const index = prev.findIndex(o => o.orderId === updated.orderId)
          if (index >= 0) {
            // Update existing order (only if not checked out)
            return updated.isCheckedOut
              ? prev.filter((o, i) => i !== index)
              : prev.map((o, i) => (i === index ? updated : o))
          } else {
            // Add new order (only if not checked out)
            return updated.isCheckedOut ? prev : [...prev, updated]
          }
        })
      }
    } else if (data.updateType === 'global' && data.orders) {
      const normalized = data.orders
        .map(normalizeOrder)
        .filter(Boolean)
        .filter(o => !o.isCheckedOut)
      setOrders(normalized)
    }
  })

  // Load orders on mount
  useEffect(() => {
    loadOrders()
  }, [])

  async function addOrder() {
    const cid = parseInt(customerId, 10)
    if (!cid || !orderDate) {
      alert('Please fill out all fields.')
      return
    }
    try {
      // Send fields in the case the backend uses
      await OrderApi.add({ CustomerId: cid, OrderDate: orderDate })
      setCustomerId('')
      setOrderDate('')
      alert('Order added!')
    } catch (e) {
      alert(`Failed to add order: ${e.message}`)
    }
  }

  async function deleteOrder() {
    if (!deleteId.trim()) {
      alert('Enter ID.')
      return
    }
    try {
      await OrderApi.delete(deleteId.trim())
      setDeleteId('')
      alert('Deleted!')
    } catch (e) {
      alert(`Failed to delete order: ${e.message}`)
    }
  }


  async function checkoutOrder(orderId) {
    try {
      await OrderApi.checkout(orderId)
      alert('Order checked out!')
    } catch (e) {
      alert(`Failed to checkout order: ${e.message}`)
    }
  } 

  return (
    <div>
      <div className="row">
        <button onClick={loadOrders} disabled={loading}>
          {loading ? 'Loading…' : 'Load Orders'}
        </button>
      </div>

      <h3>Add Order</h3>
      <div className="row">
        <input type="number" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer ID" />
        <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        <button onClick={addOrder}>Add</button>
      </div>

      <h3>Delete Order</h3>
      <div className="row">
        <input value={deleteId} onChange={(e) => setDeleteId(e.target.value)} placeholder="Order ID" />
        <button onClick={deleteOrder}>Delete</button>
      </div>

      <table className="table">
        <thead>
          <tr><th>ID</th><th>Customer</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.orderId}>
              <td>{o.orderId}</td>
              <td>{o.customerId}</td>
              <td>{new Date(o.orderDate).toLocaleDateString()}</td>
              <td style={{ textAlign: 'center' }}><button onClick={() => checkoutOrder(o.orderId)}> Checkout</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
