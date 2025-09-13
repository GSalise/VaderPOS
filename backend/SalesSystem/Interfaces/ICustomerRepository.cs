using SalesSystem.Models;
namespace SalesSystem.Interfaces
{
    public interface ICustomerRepository
    {
        Task <IEnumerable<Customer>> GetAllCustomers();
        Task<Customer> GetCustomerByIdAsync(int id);
        Task<Customer> AddCustomerAsync(Customer customer);
        Task<Customer> UpdateCustomerAsync(Customer customer);
        Task<bool> DeleteCustomerAsync(int id);

    }
}
