using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Data;
using SalesSystem.Interfaces;
using SalesSystem.Repositries;
using SalesSystem.Models;
namespace SalesSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerController : ControllerBase
    {
        private readonly DatabaseContext _context;
        private readonly ICustomerRepository _customerRepository;

        public CustomerController(DatabaseContext context, ICustomerRepository customerRepository)
        {
            _context = context;
            _customerRepository = customerRepository;
        }

        [HttpGet]
        [Route("getAllCustomers")]
        
        public async Task<IActionResult> GetAllCustomers()
        {
            var customers = await _customerRepository.GetAllCustomers();
            return Ok(customers);
        }

        [HttpGet("getcustomer/{id}")]
        public async Task<IActionResult> GetCustomerById(int id) 
        {
            var customer = await _customerRepository.GetCustomerByIdAsync(id);

            return customer == null ? NotFound() : Ok(customer);
        }

        [HttpPost]
        [Route("AddCustomer")]
        public async Task<IActionResult> AddCustomer([FromBody]Customer customer)
        {
            if (customer == null)
            {
                return BadRequest("Customer is null.");
            }
            var createdCustomer = await _customerRepository.AddCustomerAsync(customer);
            return CreatedAtAction(nameof(GetCustomerById), new { id = createdCustomer.CustomerId }, createdCustomer);
        }

        //[HttpPut("updateCustomer/{id}")]
        //public async Task<IActionResult>UpdateCustomer()

    }
}
