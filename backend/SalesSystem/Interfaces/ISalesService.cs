using SalesSystem.Models;
using SalesSystem.DTOs;
namespace SalesSystem.Interfaces
{
    public interface ISalesService
    {
        Task<OrderDto> CreateSaleAsync(int customerId, List<ProductDto> products);
    }
}