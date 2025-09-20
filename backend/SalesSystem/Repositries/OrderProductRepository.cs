﻿using SalesSystem.Data;
using Microsoft.EntityFrameworkCore;
using SalesSystem.Interfaces;
using SalesSystem.Models;
namespace SalesSystem.Repositries
{
    public class OrderProductRepository : IOrderProductRepository
    {
        private readonly DatabaseContext _context;

        public OrderProductRepository(DatabaseContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<OrderProducts>> GetAllOrderProductsAsync()
        {
            return await _context.orderProducts
                .Include(op => op.Order)
                .ToListAsync();
        }

        public async Task<OrderProducts> AddProductToOrder(int orderId, int productId)
        {
            var order = await _context.orders.FindAsync(orderId);
            if (order == null)
            {
                throw new InvalidOperationException($"Order with ID {orderId} not found.");
            }

            //var productExists = await _context.products.AnyAsync(p => p.ProductId == productId);
            //if (!productExists)
            //{
            //    throw new InvalidOperationException($"Product with ID {productId} not found.");
            //}

            var existingOrderProduct = await _context.orderProducts
                .FirstOrDefaultAsync(op => op.OrderId == orderId && op.ProductId == productId);

            if (existingOrderProduct != null)
            {
                existingOrderProduct.Quantity++;
                _context.orderProducts.Update(existingOrderProduct);
            }
            else
            {
                var newOrderProduct = new OrderProducts
                {
                    OrderId = orderId,
                    ProductId = productId,
                    Quantity = 1
                };

                await _context.orderProducts.AddAsync(newOrderProduct);
                existingOrderProduct = newOrderProduct;
            }

            await _context.SaveChangesAsync();
            return existingOrderProduct;
        }

        public async Task<bool> RemoveProductFromOrder(int orderId, int productId)
        {
            var orderProduct = await _context.orderProducts
                .FirstOrDefaultAsync(op => op.OrderId == orderId && op.ProductId == productId);
            if (orderProduct == null)
            {
                return false; // OrderProduct not found
            }
            _context.orderProducts.Remove(orderProduct);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateProductQuantity(int orderId, int productId, int newQuantity)
        {
            var orderProduct = await _context.orderProducts
                .FirstOrDefaultAsync(op => op.OrderId == orderId && op.ProductId == productId);
            if (orderProduct == null)
            {
                return false; // OrderProduct not found
            }
            if (newQuantity <= 0)
            {
                _context.orderProducts.Remove(orderProduct);
            }
            else
            {
                orderProduct.Quantity = newQuantity;
                _context.orderProducts.Update(orderProduct);
            }
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<OrderProducts> GetOrderProduct(int orderId, int productId)
        {
            var orderProduct = await _context.orderProducts
                .FirstOrDefaultAsync(op => op.OrderId == orderId && op.ProductId == productId);
            if (orderProduct == null)
            {
                throw new InvalidOperationException($"OrderProduct with Order ID {orderId} and Product ID {productId} not found.");
            }
            return orderProduct;
        }

         
    }
}
