using SalesSystem.Models;
namespace SalesSystem.Interfaces
{
    public interface IOrderRespository
    {
         Task<IEnumerable<Order>> GetAllOrdersAsync();
         Task<Order> GetOrderByIdAsync(int id);
         Task <Order> AddOrderAsync(Order order);
         Task<Order> UpdateOrderAsync(Order order);
         Task<bool> DeleteOrderAsync(int id);
         

    }
}
