using Microsoft.AspNetCore.Mvc;
using SalesSystem.Interfaces;
using SalesSystem.Models;
using SalesSystem.DTOs;
using AutoMapper;
using SalesSystem.Services;
namespace SalesSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IOrderRespository _orderRepository;
        private readonly IMapper _mapper;

        private readonly SalesSocket _salesSocket;
        public OrderController( IOrderRespository orderRepository, IMapper mapper, SalesSocket salesSocket)
        {
            _orderRepository = orderRepository;
            _mapper = mapper;
            _salesSocket = salesSocket;
        }

        [HttpGet("getAllOrders")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = _mapper.Map<List<OrderDto>>(await _orderRepository.GetAllOrdersAsync());
            return Ok(orders);
        }

        // GET: api/order/5
        [HttpGet("getOrderById/{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var order = _mapper.Map<OrderDto>(await _orderRepository.GetOrderByIdAsync(id));
            if (order == null)
            {
                return NotFound();
            }
            return Ok(order);
        }

        // POST: api/order
        [HttpPost]
        [Route("addOrder")]
        public async Task<IActionResult> AddOrder([FromBody] OrderDto order)
        {
            if (order == null)
                return BadRequest();
            var orderEntity = _mapper.Map<Order>(order);
            var createdOrder =  await _orderRepository.AddOrderAsync(orderEntity);
            return CreatedAtAction(nameof(GetOrderById), new { id = createdOrder.OrderId }, createdOrder);
        }

        [HttpPut]
        [Route("updateOrder/{id}")]
        public async Task<IActionResult> UpdateOrder(int id, [FromBody] OrderDto order)
        {
            if (order == null)
                return BadRequest();

            var orderEntity = _mapper.Map<Order>(order);
            var updatedOrder = await _orderRepository.UpdateOrderAsync(id, orderEntity);

            if (updatedOrder == null)
                return NotFound();

            var updatedOrderDto = _mapper.Map<OrderDto>(updatedOrder);
            return Ok(updatedOrderDto);
        }

        // New: checkout endpoint
        // POST: api/order/checkoutOrder/5
        [HttpPost("checkoutOrder/{id}")]
        public async Task<IActionResult> CheckoutOrder(int id)
        {
            try
            {
                var updatedOrder = await _orderRepository.CheckoutOrderAsync(id);

                if (updatedOrder.OrderProducts != null)
                {
                    foreach (var op in updatedOrder.OrderProducts)
                    {
                        await _salesSocket.SendMessageAsync(op.ProductId, op.Quantity);
                    }
                }

                var dto = _mapper.Map<OrderDto>(updatedOrder);
                return Ok(dto);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }


        // DELETE: api/order/5
        [HttpDelete("deleteOrder/{id}")]
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