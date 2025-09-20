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
    public class OrderController : ControllerBase
    {
        private readonly DatabaseContext _context;
        private readonly IOrderRespository _orderRepository;

        public OrderController(DatabaseContext context, IOrderRespository orderRepository)
        {
            _context = context;
            _orderRepository = orderRepository;
        }

        [HttpGet("getAllOrders")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _orderRepository.GetAllOrdersAsync();
            return Ok(orders);
        }

        // GET: api/order/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var order = await _orderRepository.GetOrderByIdAsync(id);
            if (order == null)
            {
                return NotFound();
            }
            return Ok(order);
        }

        // POST: api/order
        [HttpPost]
        public async Task<IActionResult> AddOrder([FromBody] Order order)
        {
            if (order == null)
                return BadRequest();

            var createdOrder = await _orderRepository.AddOrderAsync(order);
            return CreatedAtAction(nameof(GetOrderById), new { id = createdOrder.OrderId }, createdOrder);
        }

        // DELETE: api/order/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var success = await _orderRepository.DeleteOrderAsync(id);
            if (!success)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}