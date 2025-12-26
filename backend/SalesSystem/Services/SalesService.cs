using SalesSystem.Interfaces;
using SalesSystem.DTOs;
using SalesSystem.Models;
using AutoMapper;
using SalesSystem.Data;
namespace SalesSystem.Services
{
    public class SalesService : ISalesService
    {
    private readonly DatabaseContext _context;
    private readonly ICustomerRepository _customerRepository;
    private readonly IOrderRespository _orderRepository;
    private readonly IOrderProductRepository _orderProductRepository;
    private readonly IMapper _mapper;
    private readonly SalesSocket _salesSocket;
        public SalesService(
            DatabaseContext context,
            ICustomerRepository customerRepository,
            IOrderRespository orderRepository,
            IOrderProductRepository orderProductRepository,
            IMapper mapper,
            SalesSocket salesSocket)
        {
            _context = context;
            _customerRepository = customerRepository;
            _orderRepository = orderRepository;
            _orderProductRepository = orderProductRepository;
            _mapper = mapper;
            _salesSocket = salesSocket;
        }

        public async Task<OrderDto> CreateSaleAsync(int customerId, List<ProductDto> products)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate customer exists
                var customer = await _customerRepository.GetCustomerByIdAsync(customerId);
                if (customer == null)
                {
                    throw new InvalidOperationException($"Customer with ID {customerId} not found.");
                }

                // Validate products array
                if (products == null || products.Count == 0)
                {
                    throw new ArgumentException("Products array cannot be empty.");
                }

                // Validate ALL products availability BEFORE creating order
                var unavailableProducts = new List<string>();
                foreach (var product in products)
                {
                    var availableStock = _salesSocket.GetProductStock(product.ProductId);
                    if (availableStock < product.Quantity)
                    {
                        unavailableProducts.Add($"Product ID {product.ProductId} (Requested: {product.Quantity}, Available: {availableStock})");
                    }
                }

                if (unavailableProducts.Count > 0)
                {
                    throw new InvalidOperationException($"Products not available: {string.Join(", ", unavailableProducts)}");
                }

                // Create order
                var order = new Order
                {
                    CustomerId = customerId,
                    OrderDate = DateTime.UtcNow,
                    isCheckedOut = false
                };
                var neworder = await _orderRepository.AddOrderAsync(order);
                await _context.SaveChangesAsync();

                // Add all products to the order (we already validated availability)
                var orderProductDtos = new List<OrderProductDto>();
                foreach (var product in products)
                {
                    var newOrderProduct = await _orderProductRepository.AddProductToOrder(
                        neworder.OrderId, 
                        product.ProductId, 
                        product.UnitPrice, 
                        product.Quantity
                    );
                    
                    if (newOrderProduct == null)
                    {
                        throw new InvalidOperationException($"Failed to add Product with ID {product.ProductId} to order.");
                    }
                    
                    var orderProductDto = _mapper.Map<OrderProductDto>(newOrderProduct);
                    orderProductDtos.Add(orderProductDto);
                    
                    // Send WebSocket message to inventory to reduce stock
                    await _salesSocket.SendMessageAsync(product.ProductId, product.Quantity, action: "takeProduct");
                    
                    // Broadcast order product update via WebSocket
                    await _salesSocket.BroadcastOrderProductUpdateAsync(orderProductDto, "single");
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Get the complete order with all products
                var completeOrder = await _orderRepository.GetOrderByIdAsync(neworder.OrderId);
                var orderDto = _mapper.Map<OrderDto>(completeOrder);
                
                // Broadcast order update via WebSocket
                await _salesSocket.BroadcastOrderUpdateAsync(orderDto, "single");
                
                return orderDto;
            }
            catch (InvalidOperationException)
            {
                await transaction.RollbackAsync();
                throw; // Re-throw the original exception with correct message
            }
            catch (ArgumentException)
            {
                await transaction.RollbackAsync();
                throw; // Re-throw the original exception
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new InvalidOperationException($"An error occurred while creating the sale: {ex.Message}", ex);
            }
        }
    }

}