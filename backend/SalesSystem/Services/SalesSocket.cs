using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Net.WebSockets;
using System.Threading;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace SalesSystem.Services
{
    // DTOs for inventory messages
    public class InventoryMessage
    {
        public string? Action { get; set; }
        public int? ProductId { get; set; }
        public int? Quantity { get; set; }
        public string? Status { get; set; }
        public ProductStatus? ProductStatus { get; set; }
    }

    // Product info from inventory productUpdate messages
    public class ProductInfo
    {
        public int productId { get; set; }
        public int quantity { get; set; }
        public decimal price { get; set; }
        public string productName { get; set; } = string.Empty;
        public int categoryId { get; set; }
    }

    // productUpdate wrapper (global or single)
    public class ProductUpdateMessage
    {
        public string type { get; set; } = string.Empty; // "productUpdate"
        public long timestamp { get; set; }
        public string? updateType { get; set; } // "global" or "single"
        public List<ProductInfo>? products { get; set; } // for global updates
        public ProductInfo? updatedProduct { get; set; } // for single updates
    }

    public class ProductStatus
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public bool IsAvailable { get; set; }
        public decimal? Price { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class SalesSocket
    {
        private string? _lastInventoryMessage;

        private string? _initialInventoryMessage;
        private readonly string _address = "127.0.0.1";
        private readonly int _Salesport = 5265;
        private readonly int _Inventoryport = 8080;
        private bool _isConnectedtoInventory = false;
        private ClientWebSocket _webSocket = new ClientWebSocket();
        private readonly List<WebSocket> _salesClients = new();
        private readonly object _lock = new();
        
        // Store product statuses - thread-safe dictionary
        private readonly ConcurrentDictionary<int, ProductStatus> _productStatuses = new();
        
        // Event for when product status changes
        public event EventHandler<ProductStatus>? ProductStatusChanged;

        public async Task StartSalesSocketAsync()
        {
            HttpListener listener = new HttpListener();
            listener.Prefixes.Add($"http://{_address}:{_Salesport}/ws/");
            listener.Start();
            Console.WriteLine($"Sales WebSocket server started at ws://{_address}:{_Salesport}/ws/");
            
            while (true)
            {
                HttpListenerContext context = await listener.GetContextAsync();
                if (context.Request.IsWebSocketRequest)
                {
                    HttpListenerWebSocketContext wsContext =
                        await context.AcceptWebSocketAsync(null);

                    WebSocket clientSocket = wsContext.WebSocket;

                    lock (_lock)
                    {
                        _salesClients.Add(clientSocket);
                    }

                    Console.WriteLine("New Sales client connected.");
                    
                    // Send last known inventory message if available
                    if (_lastInventoryMessage != null)
                    {
                        await clientSocket.SendAsync(
                            new ArraySegment<byte>(Encoding.UTF8.GetBytes(_lastInventoryMessage)),
                            WebSocketMessageType.Text,
                            true,
                            CancellationToken.None
                        );
                    }

                    if (_initialInventoryMessage != null)
                    {
                        await clientSocket.SendAsync(
                            new ArraySegment<byte>(Encoding.UTF8.GetBytes(_initialInventoryMessage)),
                            WebSocketMessageType.Text,
                            true,
                            CancellationToken.None
                        );
                    }
                    
                    _ = HandleSalesClientAsync(clientSocket);
                }
                else
                {
                    context.Response.StatusCode = 400;
                    context.Response.Close();
                }
            }
        }

        public async Task ConnectAsync()
        {
            try
            {
                if (_webSocket.State == WebSocketState.Open)
                    return;

                _webSocket = new ClientWebSocket();

                await _webSocket.ConnectAsync(
                    new Uri($"ws://{_address}:{_Inventoryport}/inventory-socket"),
                    CancellationToken.None
                );

                _isConnectedtoInventory = true;
                Console.WriteLine("Connected to Inventory WebSocket server.");

                _ = Task.Run(async () =>
                {
                    var buffer = new byte[4096]; // Increased buffer size

                    while (_isConnectedtoInventory && _webSocket.State == WebSocketState.Open)
                    {
                        try
                        {
                            var result = await _webSocket.ReceiveAsync(
                                new ArraySegment<byte>(buffer),
                                CancellationToken.None
                            );

                            if (result.MessageType == WebSocketMessageType.Close)
                            {
                                Console.WriteLine("Inventory WebSocket closed. Reconnecting...");
                                _isConnectedtoInventory = false;
                                await ConnectAsync();
                                break;
                            }

                            string message = Encoding.UTF8.GetString(buffer, 0, result.Count);

                            _lastInventoryMessage = message;

                            if(_initialInventoryMessage == null)
                            {
                                _initialInventoryMessage = message;
                            }
                            Console.WriteLine("Response from Inventory: " + message);
                            

                            // Parse and process the message
                            ProcessInventoryMessage(message);

                            // Broadcast to sales clients
                            await BroadcastToSalesClientsAsync(message);
                            

                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine("Receive error: " + ex.Message);
                            _isConnectedtoInventory = false;
                            await Task.Delay(2000);
                            await ConnectAsync();
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error connecting to Inventory WebSocket server: {ex.Message}");
                _isConnectedtoInventory = false;
            }
        }

        // Parse and process inventory messages
        private void ProcessInventoryMessage(string message)
        {
            try
            {
                // First, try productUpdate (global or single)
                var productUpdate = JsonSerializer.Deserialize<ProductUpdateMessage>(message);
                if (productUpdate != null && productUpdate.type == "productUpdate")
                {
                    if (productUpdate.updateType == "global" && productUpdate.products != null)
                    {
                        foreach (var p in productUpdate.products)
                        {
                            _productStatuses.AddOrUpdate(
                                p.productId,
                                _ => new ProductStatus
                                {
                                    ProductId = p.productId,
                                    Name = p.productName,
                                    StockQuantity = p.quantity,
                                    Price = p.price,
                                    IsAvailable = p.quantity > 0,
                                    LastUpdated = DateTime.UtcNow
                                },
                                (_, __) => new ProductStatus
                                {
                                    ProductId = p.productId,
                                    Name = p.productName,
                                    StockQuantity = p.quantity,
                                    Price = p.price,
                                    IsAvailable = p.quantity > 0,
                                    LastUpdated = DateTime.UtcNow
                                }
                            );
                        }
                        return;
                    }

                    if (productUpdate.updateType == "single" && productUpdate.updatedProduct != null)
                    {
                        var p = productUpdate.updatedProduct;
                        _productStatuses.AddOrUpdate(
                            p.productId,
                            _ => new ProductStatus
                            {
                                ProductId = p.productId,
                                Name = p.productName,
                                StockQuantity = p.quantity,
                                Price = p.price,
                                IsAvailable = p.quantity > 0,
                                LastUpdated = DateTime.UtcNow
                            },
                            (_, __) => new ProductStatus
                            {
                                ProductId = p.productId,
                                Name = p.productName,
                                StockQuantity = p.quantity,
                                Price = p.price,
                                IsAvailable = p.quantity > 0,
                                LastUpdated = DateTime.UtcNow
                            }
                        );
                        return;
                    }
                }

                // Fallback: single-product message
                var inventoryMessage = JsonSerializer.Deserialize<InventoryMessage>(message);

                if (inventoryMessage?.ProductId != null)
                {
                    // Update product status
                    var productStatus = inventoryMessage.ProductStatus ?? new ProductStatus
                    {
                        ProductId = inventoryMessage.ProductId.Value,
                        StockQuantity = inventoryMessage.Quantity ?? 0,
                        IsAvailable = inventoryMessage.Status == "available" || 
                                     (inventoryMessage.Quantity.HasValue && inventoryMessage.Quantity.Value > 0),
                        LastUpdated = DateTime.UtcNow
                    };

                    // Update or add to dictionary
                    _productStatuses.AddOrUpdate(
                        productStatus.ProductId,
                        productStatus,
                        (key, oldValue) => productStatus
                    );

                    // Trigger event
                    ProductStatusChanged?.Invoke(this, productStatus);
                    
                    Console.WriteLine($"Product {productStatus.ProductId} status updated: " +
                                    $"Stock={productStatus.StockQuantity}, " +
                                    $"Available={productStatus.IsAvailable}");
                }
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"Error parsing inventory message: {ex.Message}");
            }
        }

        // Get product status by ID
        public ProductStatus? GetProductStatus(int productId)
        {
            _productStatuses.TryGetValue(productId, out var status);
            return status;
        }

        // Get all product statuses
        public Dictionary<int, ProductStatus> GetAllProductStatuses()
        {
            return new Dictionary<int, ProductStatus>(_productStatuses);
        }

        // Check if product is available
        public bool IsProductAvailable(int productId)
        {
            var status = GetProductStatus(productId);
            return status?.IsAvailable ?? false;
        }

        // Check product stock quantity
        public int GetProductStock(int productId)
        {
            var status = GetProductStatus(productId);
            return status?.StockQuantity ?? 0;
        }

        public async Task SendMessageAsync(int Productid, int Quantity, string action = "takeProduct")
        {
            if (!_isConnectedtoInventory)
            {
                Console.WriteLine("Not connected to Inventory WebSocket server.");
                return;
            }

            try
            {
                string jsonMessage = JsonSerializer.Serialize(new 
                { 
                    productId = Productid, 
                    quantity = Quantity, 
                    action = action 
                });
                byte[] messageBytes = Encoding.UTF8.GetBytes(jsonMessage);
                var segment = new ArraySegment<byte>(messageBytes);

                await _webSocket.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None);
                Console.WriteLine("Message sent to Inventory WebSocket server.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending message to Inventory WebSocket server: {ex.Message}");
            }
        }

        private async Task HandleSalesClientAsync(WebSocket webSocket)
        {
            var buffer = new byte[1024];

            try
            {
                while (webSocket.State == WebSocketState.Open)
                {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        break;
                    }

                    // Handle incoming messages from sales clients if needed
                    string clientMessage = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    // You can handle client requests here (e.g., request product status)
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Sales client error: " + ex.Message);
            }
            finally
            {
                lock (_lock)
                {
                    _salesClients.Remove(webSocket);
                }
                await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
            }
        }

        public async Task BroadcastToSalesClientsAsync(string message)
        {
            byte[] messageBytes = Encoding.UTF8.GetBytes(message);
            var segment = new ArraySegment<byte>(messageBytes);

            List<WebSocket> clientsCopy;
            lock (_lock)
            {
                clientsCopy = new List<WebSocket>(_salesClients);
            }

            foreach (var client in clientsCopy)
            {
                if (client.State == WebSocketState.Open)
                {
                    try
                    {
                        await client.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error broadcasting to sales client: " + ex.Message);
                    }
                }
            }
        }
    }
}