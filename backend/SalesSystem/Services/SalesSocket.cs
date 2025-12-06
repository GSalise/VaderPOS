using System;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.IO;

namespace SalesSystem.Services
{
    public class SalesSocket : IDisposable
    {
        private readonly string _address;
        private readonly int _port;
        private ClientWebSocket? _webSocket;
        private CancellationTokenSource? _cancellationTokenSource;
        private bool _isConnected;

        public SalesSocket(string serverIp = "127.0.0.1", int serverPort = 8080)
        {
            _address = serverIp;
            _port = serverPort;
        }

        public async Task ConnectAsync()
        {
            if (_isConnected) return;

            _webSocket = new ClientWebSocket();
            _cancellationTokenSource = new CancellationTokenSource();
            var uri = new Uri($"ws://{_address}:{_port}/inventory-socket");

            try
            {
                await _webSocket.ConnectAsync(uri, _cancellationTokenSource.Token);
                _isConnected = true;
                Console.WriteLine("WebSocket connected");

                // Start background listener
                _ = Task.Run(() => ReceiveMessagesAsync());
            }
            catch (Exception e)
            {
                Console.WriteLine("Connection failed: " + e.Message);
                _isConnected = false;
            }
        }

        public async Task<string?> SendMessageAsync(int productId, int quantity)
        {
            if (!_isConnected || _webSocket?.State != WebSocketState.Open)
            {
                await ConnectAsync();
            }

            try
            {
                var message = new 
                { 
                    productId = productId, 
                    quantity = quantity, 
                    action = "takeProduct" 
                };

                string jsonMessage = JsonSerializer.Serialize(message);
                Console.WriteLine("Sending: " + jsonMessage);

                byte[] msg = Encoding.UTF8.GetBytes(jsonMessage);

                await _webSocket!.SendAsync(
                    new ArraySegment<byte>(msg),
                    WebSocketMessageType.Text,
                    true,
                    _cancellationTokenSource!.Token
                );

                return await WaitForResponseAsync();
            }
            catch (Exception e)
            {
                Console.WriteLine("Send error: " + e.Message);
                throw;
            }
        }

        private TaskCompletionSource<string>? _responseWaiter;

        private async Task<string?> WaitForResponseAsync()
        {
            _responseWaiter = new TaskCompletionSource<string>();

            var timeoutTask = Task.Delay(10000);
            var completedTask = await Task.WhenAny(_responseWaiter.Task, timeoutTask);

            if (completedTask == timeoutTask)
            {
                Console.WriteLine("Response timeout");
                return null;
            }

            return await _responseWaiter.Task;
        }

        private async Task ReceiveMessagesAsync()
{
    var buffer = new byte[4096];

    while (_isConnected && _webSocket?.State == WebSocketState.Open)
    {
        try
        {
            WebSocketReceiveResult result;
            var messageBuffer = new ArraySegment<byte>(buffer);
            var stringBuilder = new StringBuilder();

            do
            {
                result = await _webSocket.ReceiveAsync(messageBuffer, _cancellationTokenSource.Token);

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await DisconnectAsync();
                    return;
                }

                stringBuilder.Append(Encoding.UTF8.GetString(buffer, 0, result.Count));

            } while (!result.EndOfMessage); // 🟢 Wait until complete frame

            string message = stringBuilder.ToString();
            Console.WriteLine("Received FULL message: " + message);

            _responseWaiter?.TrySetResult(message);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Receive error: " + ex.Message);
            await Task.Delay(1000);
        }
    }
}

        private async Task ReconnectAsync()
        {
            Console.WriteLine("Attempting to reconnect...");
            await DisconnectAsync();
            await Task.Delay(5000);
            await ConnectAsync();
        }

        private async Task DisconnectAsync()
        {
            _isConnected = false;

            if (_webSocket?.State == WebSocketState.Open)
            {
                try
                {
                    await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                }
                catch { }
            }

            _webSocket?.Dispose();
            _cancellationTokenSource?.Cancel();
            _cancellationTokenSource?.Dispose();
        }

        public void Dispose()
        {
            DisconnectAsync().GetAwaiter().GetResult();
        }
    }
}
