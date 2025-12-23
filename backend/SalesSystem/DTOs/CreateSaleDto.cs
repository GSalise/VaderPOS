namespace SalesSystem.DTOs
{
    public class CreateSaleRequestDto
    {
        public int CustomerId { get; set; }
        public List<ProductDto>? Products { get; set; }
    }
}