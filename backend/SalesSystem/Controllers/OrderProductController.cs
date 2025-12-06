using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Interfaces;
using SalesSystem.Models;
using SalesSystem.Services;
namespace SalesSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderProductController : ControllerBase
    {
        private readonly IOrderProductRepository _orderProductRepository;
        private readonly IMapper _mapper;
        private readonly SalesSocket _salesSocket;

        public OrderProductController(IOrderProductRepository orderProductRepository, IMapper mapper, SalesSocket salesSocket)
        {
            _orderProductRepository = orderProductRepository;
            _mapper = mapper;
            _salesSocket = salesSocket;
        }

        // GET: api/OrderProduct
        [HttpGet]
        [Route("getAllOrderPorduct")]
        public async Task<ActionResult<IEnumerable<OrderProducts>>> GetAllOrderProducts()
        {
            var orderProducts =_mapper.Map<List<OrderProductDto>>(await _orderProductRepository.GetAllOrderProductsAsync());
            return Ok(orderProducts);
        }

        // POST: api/OrderProduct
        [HttpPost]
        [Route("addProductToOrder")]
        public async Task<ActionResult<OrderProducts>> AddProductToOrder([FromQuery] int orderId, [FromQuery] int productId)
        {
            try
            {   
                await _salesSocket.SendMessageAsync(productId, 1);
                var orderProduct = _mapper.Map<OrderProductDto> (await _orderProductRepository.AddProductToOrder(orderId, productId));
                return Ok(orderProduct);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}