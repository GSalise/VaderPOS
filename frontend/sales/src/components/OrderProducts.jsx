import { useMemo, useState, useEffect } from 'react'
import { OrderProductApi, OrderApi, ProductApi, SalesApi, CustomerApi } from '../api.js'
import { useWebSocket, useWebSocketUpdates } from '../hooks/useWebSocket.js'

// Normalize server/customer objects
function normalizeCustomer(raw) {
  if (!raw || typeof raw !== 'object') return null
  const customerId = raw.customerId ?? raw.CustomerId ?? raw.id ?? raw.ID
  const name = raw.name ?? raw.Name
  const contact_No = raw.contact_No ?? raw.Contact_No ?? raw.contactNo ?? raw.ContactNo
  return { customerId, name, contact_No }
}

// Normalize server/orderProduct objects
function normalizeOrderProduct(raw) {
  if (!raw || typeof raw !== 'object') return null
  const orderId = raw.orderId ?? raw.OrderId
  const productId = raw.productId ?? raw.ProductId
  const quantity = raw.quantity ?? raw.Quantity ?? 0
  const unitPriceAtOrder = raw.unitPriceAtOrder ?? raw.UnitPriceAtOrder ?? raw.unitPrice ?? raw.UnitPrice ?? 0
  const totalPriceAtOrder = raw.totalPriceAtOrder ?? raw.TotalPriceAtOrder ?? unitPriceAtOrder * quantity
  if (orderId == null || productId == null) return null
  return { orderId, productId, quantity, unitPriceAtOrder, totalPriceAtOrder }
}

// Normalize server/order objects
function normalizeOrder(raw) {
  if (!raw || typeof raw !== 'object') return null
  const orderId = raw.orderId ?? raw.OrderId
  const isCheckedOut = Boolean(raw.isCheckedOut ?? raw.checkedOut ?? raw.CheckedOut)
  const isDeleted = Boolean(raw.deleted ?? raw.isDeleted ?? raw.Deleted)
  const status = raw.status ?? raw.Status
  return { orderId, isCheckedOut, isDeleted, status }
}

function isOrderClosed(order) {
  if (!order) return false
  if (order.isDeleted || order.isCheckedOut) return true
  const s = String(order.status || '')
  return /closed|completed|fulfilled|checked[_\s]?out/i.test(s)
}

export default function OrderProducts() {
  const [orderProducts, setOrderProducts] = useState([])
  const [orderId, setOrderId] = useState('')
  const [productId, setProductId] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Create Sale state
  const [customers, setCustomers] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [saleProducts, setSaleProducts] = useState([]) // [{ productId, quantity, unitPrice }]
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedQuantity, setSelectedQuantity] = useState('1')
  const [creatingSale, setCreatingSale] = useState(false)
  
  // Get products from WebSocket instead of API
  const { products: productsCache } = useWebSocket()

  async function loadCustomers() {
    try {
      const data = await CustomerApi.list()
      const normalized = (Array.isArray(data) ? data : []).map(normalizeCustomer).filter(Boolean)
      setCustomers(normalized)
    } catch (e) {
      console.error('Failed to load customers:', e)
    }
  }

  async function loadOrderProducts() {
    setLoading(true)
    try {
      const data = await OrderProductApi.list()
      console.log(data)
      const normalized = (Array.isArray(data) ? data : []).map(normalizeOrderProduct).filter(Boolean)
      setOrderProducts(normalized)
    } catch (e) {
      alert(`Failed to load order products: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Listen to WebSocket order product updates
  useWebSocketUpdates('orderProduct', (data) => {
    if (data.updateType === 'single' && data.orderProduct) {
      const updated = normalizeOrderProduct(data.orderProduct)
      if (!updated) return
      setOrderProducts(prev => {
        const key = `${updated.orderId}-${updated.productId}`
        const index = prev.findIndex(op => `${op.orderId}-${op.productId}` === key)
        if (index >= 0) {
          return prev.map((op, i) => i === index ? updated : op)
        } else {
          return [...prev, updated]
        }
      })
    } else if (data.updateType === 'global' && data.orderProducts) {
      const normalized = data.orderProducts.map(normalizeOrderProduct).filter(Boolean)
      setOrderProducts(normalized)
    }
  })

  // Listen to WebSocket order updates (remove rows on checkout/delete)
  useWebSocketUpdates('order', (data) => {
    // Seen payload: { type: 'orderUpdate', updateType: 'single', order: { OrderId, isCheckedOut, deleted } }
    if (data.updateType === 'single' && data.order) {
      const ord = normalizeOrder(data.order)
      if (!ord) return
      if (isOrderClosed(ord)) {
        setOrderProducts(prev => prev.filter(op => op.orderId !== ord.orderId))
      }
      return
    }

    // Global snapshot: remove closed orders' rows
    if (data.updateType === 'global' && Array.isArray(data.orders)) {
      const closedIds = new Set(
        data.orders.map(normalizeOrder).filter(o => o && isOrderClosed(o)).map(o => o.orderId)
      )
      if (closedIds.size > 0) {
        setOrderProducts(prev => prev.filter(op => !closedIds.has(op.orderId)))
      }
    }
  })

  async function addOrderProduct() {
    const oid = parseInt(orderId, 10)
    const pid = parseInt(productId, 10)
    if (!oid || !pid) {
      alert('Invalid fields.')
      return
    }
    try {
      await OrderProductApi.addToOrder({ orderId, productId, quantity: 1 })
      setOrderId('')
      setProductId('')
      alert('Added!')
    } catch (e) {
      alert(`Failed to add product to order: ${e.message}`)
    }
  }

  async function subtractOrderProductQuantity() {
    // try {
    //   const ops = await OrderProductApi.list()
    //   const normalizedOps = (Array.isArray(ops) ? ops : []).map(normalizeOrderProduct).filter(Boolean)
    //   const checkedOut = new Set()

    //   for (const op of normalizedOps) {
    //     // Find product from WebSocket cache instead of API call
    //     const product = productsCache.find(p => p.productId === op.productId)
    //     if (!product) continue

    //     const newQuantity = Math.max(0, (product.quantity ?? 0) - (op.quantity ?? 0))
    //     const updatedProduct = { ...product, quantity: newQuantity }
    //     // Still use API to update product, but get initial data from WebSocket
    //     await ProductApi.update(op.productId, updatedProduct).catch(err => {
    //       console.error('Update failed', err)
    //     })

    //     if (!checkedOut.has(op.orderId)) {
    //       await OrderApi.checkout(op.orderId).catch(err => {
    //         console.error('Checkout failed', err)
    //       })
    //       checkedOut.add(op.orderId)
    //     }
    //   }

    //   alert('✔ Quantities subtracted and ✔ related orders checked out!')
    // } catch (e) {
    //   console.error(e)
    //   alert('Error processing subtraction and checkout.')
    // }
  }

  function addProductToSale() {
    const pid = parseInt(selectedProductId, 10)
    const qty = parseInt(selectedQuantity, 10)
    
    if (!pid || !qty || qty <= 0) {
      alert('Please select a product and enter a valid quantity.')
      return
    }

    const product = productsCache.find(p => p.productId === pid)
    if (!product) {
      alert('Product not found.')
      return
    }

    if (product.quantity < qty) {
      alert(`Insufficient stock. Available: ${product.quantity}, Requested: ${qty}`)
      return
    }

    const existingIndex = saleProducts.findIndex(p => p.productId === pid)
    if (existingIndex >= 0) {
      const newQty = saleProducts[existingIndex].quantity + qty
      if (product.quantity < newQty) {
        alert(`Insufficient stock. Available: ${product.quantity}, Total Requested: ${newQty}`)
        return
      }
      setSaleProducts(prev => prev.map((p, i) => 
        i === existingIndex ? { ...p, quantity: newQty } : p
      ))
    } else {
      setSaleProducts(prev => [...prev, {
        productId: pid,
        quantity: qty,
        unitPrice: product.price
      }])
    }

    setSelectedProductId('')
    setSelectedQuantity('1')
  }

  function removeProductFromSale(productId) {
    setSaleProducts(prev => prev.filter(p => p.productId !== productId))
  }

  async function createSale() {
    const cid = parseInt(selectedCustomerId, 10)
    
    if (!cid) {
      alert('Please select a customer.')
      return
    }

    if (saleProducts.length === 0) {
      alert('Please add at least one product to the sale.')
      return
    }

    setCreatingSale(true)
    try {
      const payload = {
        customerId: cid,
        products: saleProducts.map(p => ({
          productId: p.productId,
          unitPrice: p.unitPrice,
          quantity: p.quantity
        }))
      }

      const result = await SalesApi.createSale(payload)
      alert(`Sale created successfully! Order ID: ${result.orderId}`)
      
      setSelectedCustomerId('')
      setSaleProducts([])
      setSelectedProductId('')
      setSelectedQuantity('1')
      
      await loadOrderProducts()
    } catch (e) {
      const errorMessage = e.message || 'Failed to create sale'
      alert(`Failed to create sale: ${errorMessage}`)
    } finally {
      setCreatingSale(false)
    }
  }

  const saleTotal = useMemo(() => {
    return saleProducts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0)
  }, [saleProducts])

  const totalCost = useMemo(() => {
    const priceById = new Map(productsCache.map(p => [p.productId, p.price || 0]))
    return orderProducts.reduce((sum, op) => sum + (priceById.get(op.productId) || 0) * (op.quantity || 0), 0)
  }, [orderProducts, productsCache])

  // Load customers and order products on mount
  useEffect(() => {
    loadCustomers()
    loadOrderProducts()
  }, [])

  return (
    <div>
      {/* Create Sale Section */}
      <h3>Create Sale</h3>
      <div className="row" style={{ marginBottom: '10px' }}>
        <select 
          value={selectedCustomerId} 
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          style={{ padding: '6px', margin: '5px', minWidth: '200px' }}
        >
          <option value="">Select Customer</option>
          {customers.map(c => (
            <option key={c.customerId} value={c.customerId}>
              {c.customerId} - {c.name}
            </option>
          ))}
        </select>
        <button onClick={loadCustomers} style={{ marginLeft: '5px' }}>
          Refresh Customers
        </button>
      </div>

      <div className="row" style={{ marginBottom: '10px' }}>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          style={{ padding: '6px', margin: '5px', minWidth: '200px' }}
        >
          <option value="">Select Product</option>
          {productsCache
            .filter(p => p.quantity > 0)
            .map(p => (
              <option key={p.productId} value={p.productId}>
                {p.productName} - ₱{p.price?.toFixed(2)} (Stock: {p.quantity})
              </option>
            ))}
        </select>
        <input
          type="number"
          value={selectedQuantity}
          onChange={(e) => setSelectedQuantity(e.target.value)}
          placeholder="Quantity"
          min="1"
          style={{ padding: '6px', margin: '5px', width: '100px' }}
        />
        <button onClick={addProductToSale}>Add to Sale</button>
      </div>

      {saleProducts.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h4>Sale Items:</h4>
          <table className="table" style={{ marginTop: '10px' }}>
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {saleProducts.map(sp => {
                const product = productsCache.find(p => p.productId === sp.productId)
                return (
                  <tr key={sp.productId}>
                    <td>{sp.productId}</td>
                    <td>{product?.productName || 'N/A'}</td>
                    <td>{sp.quantity}</td>
                    <td>₱{sp.unitPrice.toFixed(2)}</td>
                    <td>₱{(sp.unitPrice * sp.quantity).toFixed(2)}</td>
                    <td>
                      <button 
                        onClick={() => removeProductFromSale(sp.productId)}
                        style={{ background: '#f44336', fontSize: '12px', padding: '4px 8px' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
            Total: ₱{saleTotal.toFixed(2)}
          </div>
          <div className="row" style={{ marginTop: '10px' }}>
            <button 
              onClick={createSale} 
              disabled={creatingSale || !selectedCustomerId || saleProducts.length === 0}
              style={{ background: '#4caf50' }}
            >
              {creatingSale ? 'Creating...' : 'Create Sale'}
            </button>
            <button 
              onClick={() => {
                setSaleProducts([])
                setSelectedCustomerId('')
              }}
              style={{ background: '#9e9e9e', marginLeft: '5px' }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <hr style={{ margin: '20px 0', border: '1px solid #ddd' }} />

      {/* Existing Order Products Section */}
      <div className="row">
        <button onClick={loadOrderProducts} disabled={loading}>
          {loading ? 'Loading…' : 'Load Order Products'}
        </button>
      </div>

      <h3>Add Product to Existing Order</h3>
      <div className="row">
        <input type="number" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID" />
        <input type="number" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Product ID" />
        <button onClick={addOrderProduct}>Add Product</button>
      </div>

      {/* <div className="row" style={{ marginTop: 8 }}>
        <button onClick={subtractOrderProductQuantity}>Subtract Quantities</button>
      </div> */}

      <table className="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Product ID</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {orderProducts.map(op => (
            <tr key={`${op.orderId}-${op.productId}`}>
              <td>{op.orderId}</td>
              <td>{op.productId}</td>
              <td>{op.quantity}</td>
              <td>₱{Number(op.unitPriceAtOrder ?? 0).toFixed(2)}</td>
              <td>₱{Number(op.totalPriceAtOrder ?? (op.unitPriceAtOrder ?? 0) * (op.quantity ?? 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Total Cost: <span>₱{totalCost.toFixed(2)}</span></h3>
    </div>
  )
}
