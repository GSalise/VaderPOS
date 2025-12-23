namespace SalesSystem.DTOs
{
    public class OrderProductDto
    {   
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public decimal UnitPriceAtOrder { get; set; }
        public decimal TotalPriceAtOrder { get; set; }
        public int Quantity { get; set; }
    }
}
