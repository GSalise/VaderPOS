using Microsoft.AspNetCore.Mvc;
using SalesSystem.Interfaces;
using SalesSystem.Models;
using AutoMapper;
using SalesSystem.DTOs;
namespace SalesSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerController : ControllerBase
    {

        private readonly ICustomerRepository _customerRepository;
        private readonly IMapper _mapper;
        public CustomerController( ICustomerRepository customerRepository, IMapper mapper)
        {
            _customerRepository = customerRepository;
            _mapper = mapper;
        }

        [HttpGet]
        [Route("getAllCustomers")]
        
        public async Task<IActionResult> GetAllCustomers()
        {
            var customers =_mapper.Map<List<CustomerDto>> (await _customerRepository.GetAllCustomers());
            return Ok(customers);
        }

        [HttpGet("getCustomer/{id}")]
        public async Task<IActionResult> GetCustomerById(int id) 
        {
            var customer = _mapper.Map<CustomerDto>(await _customerRepository.GetCustomerByIdAsync(id));

            return customer == null ? NotFound() : Ok(customer);
        }

        [HttpPost]
        [Route("AddCustomer")]
        public async Task<IActionResult> AddCustomer(CustomerDto customer)
        {
            if (customer == null)
            {
                return BadRequest("Customer is null.");
            }
            var customerEntity = _mapper.Map<Customer>(customer);
            var createdCustomer = await _customerRepository.AddCustomerAsync(customerEntity);
            return CreatedAtAction(nameof(GetCustomerById), new { id = createdCustomer.CustomerId }, createdCustomer);
        }

        //[HttpPut("updateCustomer/{id}")]
        //public async Task<IActionResult>UpdateCustomer()

    }
}
