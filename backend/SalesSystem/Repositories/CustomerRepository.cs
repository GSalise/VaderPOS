using SalesSystem.Interfaces;
using SalesSystem.Data;
using SalesSystem.Models;
using Microsoft.EntityFrameworkCore;
namespace SalesSystem.Repositories
{
    public class CustomerRepository : ICustomerRepository
    {
        private readonly DatabaseContext _context;

        public CustomerRepository(DatabaseContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Customer>> GetAllCustomers()
        {
            return await _context.customers.ToListAsync();
        }
        
        public async Task<Customer> GetCustomerByIdAsync(int id)
        {
            var customer = await _context.customers.FindAsync(id);
            if (customer == null)
            {
                throw new InvalidOperationException($"Customer with ID {id} not found.");
            }
            return customer;
        }

        public async Task<Customer> AddCustomerAsync(Customer customer)
        {
            await _context.customers.AddAsync(customer);
            await _context.SaveChangesAsync();
            return customer;
        }

        public async Task<Customer> UpdateCustomerAsync(Customer customer)
        {
            var existingCustomer = await _context.customers.FirstOrDefaultAsync(c => c.CustomerId == customer.CustomerId);
            if (existingCustomer == null)
            {
                throw new InvalidOperationException($"Customer with ID {customer.CustomerId} not found.");
            }
            else
            {

                existingCustomer.Name = customer.Name;
                existingCustomer.Contact_No = customer.Contact_No;
            }
            await _context.SaveChangesAsync();
            return existingCustomer;
        }

        public async Task<bool> DeleteCustomerAsync(int id)
        {
            var customer = await _context.customers.FindAsync(id);
            if (customer == null)
            {
                return false;
            }

            _context.customers.Remove(customer);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
