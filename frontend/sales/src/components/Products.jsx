import { useWebSocket } from '../hooks/useWebSocket.js'

export default function Products() {
  const { products, isConnected } = useWebSocket()

  return (
    <div>
      <div className="row" style={{ marginBottom: '10px' }}>
        <span style={{ 
          padding: '6px 12px', 
          backgroundColor: isConnected ? '#4caf50' : '#f44336',
          color: 'white',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      <h3>Products ({products.length})</h3>
      
      {products.length === 0 ? (
        <p>No products available. Waiting for updates...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Category ID</th>
              <th>Price</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.productId}>
                <td>{product.productId}</td>
                <td>{product.productName}</td>
                <td>{product.categoryId}</td>
                <td>₱{product.price?.toFixed(2) || '0.00'}</td>
                <td style={{ 
                  color: product.quantity === 0 ? '#f44336' : '#000',
                  fontWeight: product.quantity === 0 ? 'bold' : 'normal'
                }}>
                  {product.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

