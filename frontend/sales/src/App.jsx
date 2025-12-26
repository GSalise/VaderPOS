import Customers from './components/Customers.jsx'
import Orders from './components/Orders.jsx'
import OrderProducts from './components/OrderProducts.jsx'
import Products from './components/Products.jsx'
import SalesStats from './components/SalesStats.jsx'
export default function App() {
  return (
    <div className="container">
      <h1>Orders</h1>
      <section>
        <h2>Order Products</h2>
        <SalesStats/>
      </section>
      <section>
        <h2>Products</h2>
        <Products />
      </section>

      <section>
        <h2>Customers</h2>
        <Customers />
      </section>

      <section>
        <h2>Orders</h2>
        <Orders />
      </section>

      <section>
        <h2>Order Products</h2>
        <OrderProducts />
      </section>
    </div>
  )
}
