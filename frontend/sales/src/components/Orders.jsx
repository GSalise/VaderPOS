import { useState } from 'react'
import { OrderApi } from '../api.js'

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
      setOrders((data || []).filter(o => !o.isCheckedOut))
    } catch (e) {
      alert(`Failed to load orders: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function addOrder() {
    const cid = parseInt(customerId, 10)
    if (!cid || !orderDate) {
      alert('Please fill out all fields.')
      return
    }
    try {
      await OrderApi.add({ customerId: cid, orderDate })
      setCustomerId('')
      setOrderDate('')
      await loadOrders()
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
      await loadOrders()
      alert('Deleted!')
    } catch (e) {
      alert(`Failed to delete order: ${e.message}`)
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
          <tr><th>ID</th><th>Customer</th><th>Date</th></tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.orderId}>
              <td>{o.orderId}</td>
              <td>{o.customerId}</td>
              <td>{new Date(o.orderDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
