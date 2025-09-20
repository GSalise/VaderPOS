
namespace SalesSystem.Models
{
    public class Order
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public DateTime OrderDate { get; set; }

        public Customer? Customer { get; set; }

        public ICollection<OrderProducts>? OrderProducts { get; set; }

     }
}
