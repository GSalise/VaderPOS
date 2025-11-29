using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Data;
using SalesSystem.Interfaces;
using SalesSystem.Repositries;
using SalesSystem.Models;
using SalesSystem.DTOs;
using AutoMapper;
using System.Collections.Generic;
namespace SalesSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IOrderRespository _orderRepository;
        private readonly IMapper _mapper;
        public OrderController( IOrderRespository orderRepository, IMapper mapper)
        {
            _orderRepository = orderRepository;
            _mapper = mapper;
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