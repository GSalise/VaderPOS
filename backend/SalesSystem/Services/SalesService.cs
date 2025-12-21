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
            
            var transaction = await _context.Database.BeginTransactionAsync();
            try{
                var customer = await _customerRepository.GetCustomerByIdAsync(customerId);
                if (customer == null)
                {
                    throw new InvalidOperationException($"Customer with ID {customerId} not found.");
                }
                var order = new Order
                {
                    CustomerId = customerId,
                    OrderDate = DateTime.UtcNow,
                    isCheckedOut = false
                };
                var neworder = await _orderRepository.AddOrderAsync(order);
                await _context.SaveChangesAsync();

                foreach (var product in products)
                {
                    
                    var newOrderProduct = await _orderProductRepository.AddProductToOrder(neworder.OrderId, product.ProductId, product.UnitPrice, product.Quantity);
                    if (newOrderProduct == null)
                    {
                        throw new InvalidOperationException($"Product with ID {product.ProductId} not found.");
                    }
                    else
                    {
                        await _salesSocket.SendMessageAsync(product.ProductId, product.Quantity, action: "takeProduct");
                    }
                }
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var completeOrder = await _orderRepository.GetOrderByIdAsync(neworder.OrderId);

                return _mapper.Map<OrderDto>(completeOrder);
            }
            catch (InvalidOperationException ex)
            {
                await transaction.RollbackAsync();
                throw new InvalidOperationException($"Customer with ID {customerId} not found. + {ex.Message}");
                throw;
            }
        }
    }

}