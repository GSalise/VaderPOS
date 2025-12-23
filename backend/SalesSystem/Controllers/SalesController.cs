using Microsoft.AspNetCore.Mvc;
using SalesSystem.Interfaces;
using SalesSystem.Models;
using AutoMapper;
using SalesSystem.DTOs;
namespace SalesSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SalesController : ControllerBase
    {

        private readonly ISalesService _salesService;
        private readonly IMapper _mapper;
        public SalesController(ISalesService salesService, IMapper mapper)
        {
            _salesService = salesService;
            _mapper = mapper;
        }
        
        [HttpPost]
        [Route("createSale")]
        public async Task<IActionResult> CreateSale([FromBody] CreateSaleRequestDto saleRequest)
        {
            try{
            if (saleRequest.CustomerId == 0 || saleRequest.Products == null)
            {
                return BadRequest();
            }
            var createdOrder = await _salesService.CreateSaleAsync(saleRequest.CustomerId, saleRequest.Products);
            return Ok(createdOrder);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
