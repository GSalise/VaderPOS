using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Net.WebSockets;
using System.Threading;

namespace SalesSystem.Services
{
    public class SalesSocket
    {
        private readonly string _address = "127.0.0.1";
        private readonly int _Salesport = 5264;
        private readonly int _Inventoryport = 8080;
        private bool _isConnectedtoInventory = false;
        private ClientWebSocket _webSocket = new ClientWebSocket();
        private readonly List<WebSocket> _salesClients = new();
        private readonly object _lock = new();

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
                     // ...existing code...
                     // TODO: Accept and handle WebSocket requests
                    HttpListenerWebSocketContext wsContext =
                    await context.AcceptWebSocketAsync(null);

                    WebSocket clientSocket = wsContext.WebSocket;

                // ADD CLIENT TO LIST
                    lock (_lock)
                    {
                        _salesClients.Add(clientSocket);
                    }

                    Console.WriteLine("New Sales client connected.");

                    // HANDLE THIS CLIENT (READ MESSAGES)
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
                    var buffer = new byte[1024];

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
                            Console.WriteLine("Response from Inventory: " + message);
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
        public async Task SendMessageAsync(int Productid, int Quantity)
        {
            if (!_isConnectedtoInventory)
            {
                Console.WriteLine("Not connected to Inventory WebSocket server.");
                return;
            }

            try
            {
                string jsonMessage = JsonSerializer.Serialize(new { productId = Productid, quantity = Quantity , action = "takeProduct" });
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