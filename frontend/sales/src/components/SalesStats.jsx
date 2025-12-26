import { useEffect, useState, useMemo } from 'react'
import { CustomerApi, OrderApi, OrderProductApi } from '../api.js'

// Minimal normalizers
function normalizeOrder(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    orderId: raw.orderId ?? raw.OrderId ?? raw.id ?? raw.ID,
    isCheckedOut: raw.isCheckedOut ?? raw.IsCheckedOut ?? false,
    deleted: raw.deleted ?? raw.Deleted ?? false,
  }
}
function normalizeOrderProduct(raw) {
  if (!raw || typeof raw !== 'object') return null
  const quantity = raw.quantity ?? raw.Quantity ?? 0
  const unitPriceAtOrder = raw.unitPriceAtOrder ?? raw.UnitPriceAtOrder ?? raw.unitPrice ?? raw.UnitPrice ?? 0
  return {
    orderId: raw.orderId ?? raw.OrderId,
    totalPriceAtOrder: raw.totalPriceAtOrder ?? raw.TotalPriceAtOrder ?? (unitPriceAtOrder * quantity),
  }
}
function normalizeCustomer(raw) {
  if (!raw || typeof raw !== 'object') return null
  return { customerId: raw.customerId ?? raw.CustomerId ?? raw.id ?? raw.ID }
}

export default function SalesStats() {
  const [orders, setOrders] = useState([])
  const [orderProducts, setOrderProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadStats() {
    setLoading(true)
    setError('')
    try {
      const [ordersRaw, orderProductsRaw, customersRaw] = await Promise.all([
        OrderApi.list(),
        OrderProductApi.listCheckedout(),
        CustomerApi.list(),
      ])
      setOrders((Array.isArray(ordersRaw) ? ordersRaw : []).map(normalizeOrder).filter(Boolean))
      setOrderProducts((Array.isArray(orderProductsRaw) ? orderProductsRaw : []).map(normalizeOrderProduct).filter(Boolean))
      setCustomers((Array.isArray(customersRaw) ? customersRaw : []).map(normalizeCustomer).filter(Boolean))
    } catch (e) {
      setError(e.message || 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const stats = useMemo(() => {
    const totalCustomers = customers.length
    const totalOrders = orders.filter(o => !o.deleted).length

    const checkedOutIds = new Set(orders.filter(o => o.isCheckedOut && !o.deleted).map(o => o.orderId))
    const totalSales = orderProducts
      .filter(op => checkedOutIds.has(op.orderId))
      .reduce((sum, op) => sum + (op.totalPriceAtOrder || 0), 0)

    return { totalCustomers, totalOrders, totalSales }
  }, [customers, orders, orderProducts])
  console.log(orderProducts)
  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <button onClick={loadStats} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        {error && <span style={{ color: 'red', marginLeft: 8 }}>{error}</span>}
      </div>

      <h3>Sales Stats</h3>
      <table className="table">
        <tbody>
          <tr><td>Total Customers</td><td>{stats.totalCustomers}</td></tr>
          <tr><td>Total Orders</td><td>{stats.totalOrders}</td></tr>
          <tr><td>Total Sales</td><td>₱{stats.totalSales.toFixed(2)}</td></tr>
        </tbody>
      </table>
    </div>
  )
}