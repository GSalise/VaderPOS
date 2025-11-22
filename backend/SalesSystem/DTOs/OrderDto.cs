namespace SalesSystem.DTOs
{
    public class OrderDto
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }

        public bool isCheckedOut { get; set; }
        public DateTime OrderDate { get; set; }

    }
}
