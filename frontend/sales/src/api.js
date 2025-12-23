export const API_BASE = 'http://localhost:5264/api'
export const PRODUCT_API = 'http://localhost:8080/api/products'

async function request(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Request failed ${res.status}: ${text}`)
  }
  const contentType = res.headers.get('content-type') || ''
  return contentType.includes('application/json') ? res.json() : res.text()
}

export const CustomerApi = {
  list: () => request(`${API_BASE}/Customer/getAllCustomers`),
  add: (payload) => request(`${API_BASE}/Customer/addCustomer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export const OrderApi = {
  list: () => request(`${API_BASE}/Order/getAllOrders`),
  add: (payload) => request(`${API_BASE}/Order/addOrder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  delete: (id) => request(`${API_BASE}/Order/deleteOrder/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  checkout: (orderId) => request(`${API_BASE}/Order/checkoutOrder/${encodeURIComponent(orderId)}`, { method: 'POST' })
}

export const OrderProductApi = {
  list: () => request(`${API_BASE}/OrderProduct/getAllOrderProduct`),
  addToOrder: ({ orderId, productId, quantity = 1 }) => request(`${API_BASE}/OrderProduct/addProductToOrder?orderId=${orderId}&productId=${productId}&quantity=${quantity}`, { method: 'POST' })
}

export const ProductApi = {
  list: () => request(PRODUCT_API),
  get: (id) => request(`${PRODUCT_API}/${id}`),
  update: (id, product) => request(`${PRODUCT_API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  })
}

export const SalesApi = {
  createSale: (payload) => request(`${API_BASE}/Sales/createSale`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}