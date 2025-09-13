using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Data;
using SalesSystem.Interfaces;
using SalesSystem.Repositries;
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

        //[HttpGet("getcustomer/{id}")]
        //[ValidateAntiForgeryToken]

        
    }
}
