import { useState } from 'react'
import { CustomerApi } from '../api.js'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadCustomers() {
    setLoading(true)
    try {
      const data = await CustomerApi.list()
      setCustomers(data)
    } catch (e) {
      alert(`Failed to load customers: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function addCustomer() {
    if (!name.trim() || !contact.trim()) {
      alert('Missing fields.')
      return
    }
    try {
      await CustomerApi.add({ name: name.trim(), contact_No: contact.trim() })
      setName('')
      setContact('')
      await loadCustomers()
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
          {customers.map(c => (
            <tr key={c.customerId}>
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
