import { useMemo, useState, useEffect } from 'react'
import { OrderProductApi, OrderApi, ProductApi, SalesApi, CustomerApi } from '../api.js'
import { useWebSocket } from '../hooks/useWebSocket.js'

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
      setCustomers(data || [])
    } catch (e) {
      console.error('Failed to load customers:', e)
    }
  }

  async function loadOrderProducts() {
    setLoading(true)
    try {
      const data = await OrderProductApi.list()
      console.log(data)
      setOrderProducts(data || [])
    } catch (e) {
      alert(`Failed to load order products: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function addOrderProduct() {
    const oid = parseInt(orderId, 10)
    const pid = parseInt(productId, 10)
    if (!oid || !pid) {
      alert('Invalid fields.')
      return
    }
    try {
      await OrderProductApi.addToOrder({ orderId: oid, productId: pid, quantity: 1 })
      setOrderId('')
      setProductId('')
      await loadOrderProducts()
      alert('Added!')
    } catch (e) {
      alert(`Failed to add product to order: ${e.message}`)
    }
  }

  async function subtractOrderProductQuantity() {
    try {
      const ops = await OrderProductApi.list()
      const checkedOut = new Set()

      for (const op of ops) {
        // Find product from WebSocket cache instead of API call
        const product = productsCache.find(p => p.productId === op.productId)
        if (!product) continue

        const newQuantity = Math.max(0, (product.quantity ?? 0) - (op.quantity ?? 0))
        const updatedProduct = { ...product, quantity: newQuantity }
        // Still use API to update product, but get initial data from WebSocket
        await ProductApi.update(op.productId, updatedProduct).catch(err => {
          console.error('Update failed', err)
        })

        if (!checkedOut.has(op.orderId)) {
          await OrderApi.checkout(op.orderId).catch(err => {
            console.error('Checkout failed', err)
          })
          checkedOut.add(op.orderId)
        }
      }

      alert('✔ Quantities subtracted and ✔ related orders checked out!')
      await loadOrderProducts()
    } catch (e) {
      console.error(e)
      alert('Error processing subtraction and checkout.')
    }
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

    // Check if product already in sale, update quantity if so
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
      
      // Reset form
      setSelectedCustomerId('')
      setSaleProducts([])
      setSelectedProductId('')
      setSelectedQuantity('1')
      
      // Reload orders and order products
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

  // Load customers on mount
  useEffect(() => {
    loadCustomers()
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

      <div className="row" style={{ marginTop: 8 }}>
        <button onClick={subtractOrderProductQuantity}>Subtract Quantities</button>
      </div>

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
          {orderProducts.map(op => {
            const product = productsCache.find(p => p.productId === op.productId)
            const price = product?.price ?? 0
            const subtotal = price * (op.quantity ?? 0)
            return (
              <tr key={`${op.orderId}-${op.productId}`}>
                <td>{op.orderId}</td>
                <td>{op.productId}</td>
                <td>{op.quantity}</td>
                <td>₱{op.unitPriceAtOrder.toFixed(2)}</td>
                <td>₱{op.totalPriceAtOrder.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h3>Total Cost: <span>₱{totalCost.toFixed(2)}</span></h3>
    </div>
  )
}
