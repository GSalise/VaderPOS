using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesSystem.Migrations
{
    /// <inheritdoc />
    public partial class addisCheckedOut : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "isCheckedOut",
                table: "orders",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "isCheckedOut",
                table: "orders");
        }
    }
}
