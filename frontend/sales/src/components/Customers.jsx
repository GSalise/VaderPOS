import { useState, useEffect } from 'react'
import { CustomerApi } from '../api.js'
import { useWebSocketUpdates } from '../hooks/useWebSocket.js'

// Normalize server/customer objects to a consistent shape used by the UI
function normalizeCustomer(raw) {
  if (!raw || typeof raw !== 'object') return null
  const customerId = raw.customerId ?? raw.CustomerId ?? raw.id ?? raw.ID
  const name = raw.name ?? raw.Name
  const contact_No = raw.contact_No ?? raw.Contact_No ?? raw.contactNo ?? raw.ContactNo
  return { customerId, name, contact_No }
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadCustomers() {
    setLoading(true)
    try {
      const data = await CustomerApi.list()
      // normalize list results
      const normalized = (Array.isArray(data) ? data : []).map(normalizeCustomer).filter(Boolean)
      setCustomers(normalized)
    } catch (e) {
      alert(`Failed to load customers: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Listen to WebSocket customer updates
  useWebSocketUpdates('customer', (data) => {
    if (data.updateType === 'single' && data.customer) {
      const updated = normalizeCustomer(data.customer)
      if (!updated || updated.customerId == null) return
      setCustomers(prev => {
        const index = prev.findIndex(c => c.customerId === updated.customerId)
        if (index >= 0) {
          return prev.map((c, i) => (i === index ? updated : c))
        } else {
          return [...prev, updated]
        }
      })
    } else if (data.updateType === 'global' && data.customers) {
      const normalized = data.customers.map(normalizeCustomer).filter(Boolean)
      setCustomers(normalized)
    }
  })

  // Load customers on mount
  useEffect(() => {
    loadCustomers()
  }, [])

  async function addCustomer() {
    if (!name.trim() || !contact.trim()) {
      alert('Missing fields.')
      return
    }
    try {
      // Send fields in the case the backend uses
      await CustomerApi.add({ Name: name.trim(), Contact_No: contact.trim() })
      setName('')
      setContact('')
      // WebSocket should push the new customer; no manual reload needed
      alert('Added!')
    } catch (e) {
      alert(`Failed to add customer: ${e.message}`)
    }
  }

  return (
    <div>
      <div className="row">
        <button onClick={loadCustomers} disabled={loading}>
          {loading ? 'Loading…' : 'Load Customers'}
        </button>
      </div>

      <h3>Add Customer</h3>
      <div className="row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact" />
        <button onClick={addCustomer}>Add</button>
      </div>

      <table className="table">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Contact</th></tr>
        </thead>
        <tbody>
          {customers.map((c, idx) => (
            <tr key={c.customerId ?? `row-${idx}`}>
              <td>{c.customerId}</td>
              <td>{c.name}</td>
              <td>{c.contact_No}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
