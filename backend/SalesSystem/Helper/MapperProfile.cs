using AutoMapper;
using SalesSystem.Models;
using SalesSystem.DTOs;
namespace SalesSystem.Helper
{
    public class MapperProfile  : Profile
    {
        public MapperProfile() 
        {
            CreateMap<Order, OrderDto>();
            CreateMap<OrderDto, Order>();
            CreateMap<OrderProducts, OrderProductDto>();
            CreateMap<OrderProductDto, OrderProducts>();
            CreateMap<Customer, CustomerDto>();
            CreateMap<CustomerDto, Customer>();
        }
    }
}
