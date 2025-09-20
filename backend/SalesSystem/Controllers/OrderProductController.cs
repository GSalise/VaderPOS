using Microsoft.AspNetCore.Mvc;
using SalesSystem.Data;
using SalesSystem.Interfaces;
using SalesSystem.Models;

namespace SalesSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderProductController : ControllerBase
    {
        private readonly IOrderProductRepository _orderProductRepository;

        public OrderProductController(IOrderProductRepository orderProductRepository)
        {
            _orderProductRepository = orderProductRepository;
        }

        // GET: api/OrderProduct
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderProducts>>> GetAllOrderProducts()
        {
            var orderProducts = await _orderProductRepository.GetAllOrderProductsAsync();
            return Ok(orderProducts);
        }

        // POST: api/OrderProduct
        [HttpPost]
        public async Task<ActionResult<OrderProducts>> AddProductToOrder([FromQuery] int orderId, [FromQuery] int productId)
        {
            try
            {
                var orderProduct = await _orderProductRepository.AddProductToOrder(orderId, productId);
                return Ok(orderProduct);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}