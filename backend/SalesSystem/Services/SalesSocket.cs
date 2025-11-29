using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Net.WebSockets;
using System.Threading;
namespace SalesSystem.Services
{
    public class SalesSocket { 
    
        private readonly string _address;
        private readonly int _port;
        public SalesSocket( string serverIp = "127.0.0.1", int serverPort = 8080) { 
            _address = serverIp;
            _port = serverPort;
        }

        public async Task SendMessageAsync(int Productid, int Quantity)
        {
            try
            {
                //IPEndPoint remoteEP = new IPEndPoint(IPAddress.Parse(_address), _port);
                //using Socket sender = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
                //await sender.ConnectAsync(remoteEP);

                using var cliWebSocket = new ClientWebSocket();
                var uri = new Uri($"ws://{_address}:{_port}/inventory-socket");
                await cliWebSocket.ConnectAsync(uri, CancellationToken.None);


                string jsonMessage = JsonSerializer.Serialize(new { productId = Productid, quantity = Quantity , action = "takeProductFromStock" });
                byte[] msg = Encoding.ASCII.GetBytes(jsonMessage);
                await cliWebSocket.SendAsync(msg, WebSocketMessageType.Text, true,CancellationToken.None);

                byte[] buffer = new byte[1024];
                var result = await cliWebSocket.ReceiveAsync(buffer, CancellationToken.None);
                Console.WriteLine("Response from Inventory:" + Encoding.ASCII.GetString(buffer, 0, result.Count));

                await cliWebSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Done", CancellationToken.None);
            }
            catch (Exception e)
            {
                Console.WriteLine("Socket exception: " + e.ToString());
            }
        }

    }
}