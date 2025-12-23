using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalesSystem.Models
{
    public class OrderProducts
    {
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPriceAtOrder { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPriceAtOrder { get; set; }
        public Order? Order { get; set; }
    }
}
