namespace SalesSystem.Models
{
    public class Customer
    {
        public int CustomerId { get; set; }
        public string Name { get; set; }
        public string Contact_No { get; set; }

        public ICollection<Order>? Orders { get; set; }
    }
        
}
