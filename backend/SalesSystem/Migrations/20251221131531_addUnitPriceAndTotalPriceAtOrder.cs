using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesSystem.Migrations
{
    /// <inheritdoc />
    public partial class addUnitPriceAndTotalPriceAtOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TotalPriceAtOrder",
                table: "orderProducts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitPriceAtOrder",
                table: "orderProducts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalPriceAtOrder",
                table: "orderProducts");

            migrationBuilder.DropColumn(
                name: "UnitPriceAtOrder",
                table: "orderProducts");
        }
    }
}
