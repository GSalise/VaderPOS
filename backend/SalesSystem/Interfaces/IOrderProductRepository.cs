using SalesSystem.Models;
namespace SalesSystem.Interfaces
{
    public interface IOrderProductRepository
    {
        Task<IEnumerable<OrderProducts>> GetAllOrderProductsAsync();
        Task<OrderProducts> AddProductToOrder(int orderID,int productID);
        
    }
}
