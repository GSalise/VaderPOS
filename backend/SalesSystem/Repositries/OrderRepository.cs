using SalesSystem.Data;
using SalesSystem.Interfaces;
using SalesSystem.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.HttpResults;
namespace SalesSystem.Repositries
{
    public class OrderRepository : IOrderRespository
    {
        private readonly DatabaseContext _context;
        public OrderRepository(DatabaseContext context)
        {
            _context = context;
        }

        public async Task<bool> DeleteOrderAsync(int id)
        {
                var order = await _context.orders.FindAsync(id);
            if (order == null)
            {
                return false;
            }
            _context.orders.Remove(order);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<IEnumerable<Order>> GetAllOrdersAsync()
        {
            return await _context.orders
                .Include(o => o.Customer) // load customer details
                .Include(o => o.OrderProducts) // load related products
                .ToListAsync();
        }
        public async Task<Order> GetOrderByIdAsync(int id)
        {
            var order = await _context.orders
                .Include(o => o.Customer)
                .Include(o => o.OrderProducts)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                throw new InvalidOperationException($"Order with ID {id} not found.");
            }

            return order;
        }
        public async Task<Order> AddOrderAsync(Order order)
        {
            if (order == null) {
                throw new ArgumentNullException(nameof(order), "Order not found");
            }
            order.isCheckedOut = false;
            await _context.orders.AddAsync(order);
             await _context.SaveChangesAsync();
            return order;
        }
        public async Task<Order> UpdateOrderAsync(int id, Order order)
        {
            var orderToUpdate =   await _context.orders.FirstOrDefaultAsync(x => x.OrderId == id);
            if (orderToUpdate == null)
            {
                throw new ArgumentNullException(nameof(order), "Order not found");
            }
            orderToUpdate.CustomerId = order.CustomerId;
            orderToUpdate.OrderDate = order.OrderDate;
            orderToUpdate.isCheckedOut = order.isCheckedOut;
            await _context.SaveChangesAsync();
            return orderToUpdate;
        }
    }
}
