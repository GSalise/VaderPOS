//using Microsoft.EntityFrameworkCore;
//using Microsoft.OpenApi.Models;
//using SalesSystem.Data;
//using SalesSystem.Interfaces;
//using SalesSystem.Repositries;
//using System.Text.Json.Serialization;
//var builder = WebApplication.CreateBuilder(args);

//// Add services to the container.

//builder.Services.AddControllers();
//builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
//builder.Services.AddScoped<ICustomerRepository,CustomerRepository>();
//builder.Services.AddScoped<IOrderRespository, OrderRepository>();
//builder.Services.AddScoped<IOrderProductRepository, OrderProductRepository>();
//builder.Services.AddDbContext<DatabaseContext>(options =>
//    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));


//// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
//builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();

//var app = builder.Build();

//// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    app.UseSwaggerUI();
//}

//app.UseHttpsRedirection();

//app.UseAuthorization();

//app.MapControllers();

//app.Run();




using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using SalesSystem.Data;
using SalesSystem.Interfaces;
using SalesSystem.Repositries;
using System.Text.Json.Serialization;
using SalesSystem.Services;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSingleton<SalesSocket>();
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<IOrderRespository, OrderRepository>();
builder.Services.AddScoped<IOrderProductRepository, OrderProductRepository>();


builder.Services.AddDbContext<DatabaseContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// ✅ Add CORS service here
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()   // Allow all origins (frontend on localhost)
              .AllowAnyMethod()   // Allow GET, POST, PUT, DELETE, etc.
              .AllowAnyHeader();  // Allow all headers
    });
});

// Learn more about configuring Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

var salesSocket = app.Services.GetRequiredService<SalesSocket>();
await salesSocket.ConnectAsync();
_ = salesSocket.StartSalesSocketAsync();
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// ✅ Enable CORS before Authorization or Controllers
app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();
