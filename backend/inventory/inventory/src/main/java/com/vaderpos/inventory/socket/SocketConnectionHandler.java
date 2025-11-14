package com.vaderpos.inventory.socket;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.vaderpos.inventory.api.dto.ProductDTO;
import com.vaderpos.inventory.api.model.Product;
import com.vaderpos.inventory.api.service.IProductService;
import java.util.Optional;

import org.json.JSONObject;
import org.springframework.lang.NonNull;


public class SocketConnectionHandler extends TextWebSocketHandler {

    private final IProductService productService;

    public SocketConnectionHandler(IProductService productService) {
        this.productService = productService;
    }

    // Store all active connections
    private List<WebSocketSession> activeConnections = Collections.synchronizedList(new ArrayList<>());


    // Executes when a client tries to connect
    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        super.afterConnectionEstablished(session);

        // Print out the session ID and store in the active connections list
        System.out.println(session.getId() + " connected.");
        activeConnections.add(session);
    }


    // Executes when a client disconnects
    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) throws Exception {
        super.afterConnectionClosed(session, status);

        // Print out the session ID and remove from the active connections list
        System.out.println(session.getId() + " disconnected.");
        activeConnections.remove(session);
    }

    @Override
    public void handleMessage(@NonNull WebSocketSession session, @NonNull WebSocketMessage<?> message) throws Exception {
        // Parse the incoming message
        String payload = message.getPayload().toString();
        System.out.println("Received message from " +  session.getId() + ": " + payload);
        JSONObject jsonObject = new JSONObject(payload);
        long productId = jsonObject.getInt("productId");
        String action = jsonObject.getString("action");

        Integer quantity = null;
        if (jsonObject.has("quantity")) {
            quantity = jsonObject.getInt("quantity");
        }


           // Logic: getProduct
        JSONObject response = new JSONObject();
        if ("getProduct".equals(action)) {
            Optional<ProductDTO> productOpt = productService.getProduct(productId);
            if (productOpt.isPresent()) {
                ProductDTO product = productOpt.get();
                response.put("status", "success");
                response.put("productId", product.productId());
                response.put("productName", product.productName());
                response.put("quantity", product.quantity());
                response.put("price", product.price());
                response.put("categoryId", product.categoryId());
            } else {
                response.put("status", "error");
                response.put("message", "Product not found");
            }
        } else if ("takeProductFromStock".equals(action)) {
            try {
                if(quantity != null) {
                    productService.reduceProductStock(productId, quantity);
                    Optional<ProductDTO> productOpt = productService.getProduct(productId);
                    ProductDTO product = productOpt.get();
                    response.put("status", "success");
                    response.put("message", "Stock has been successfully reduced");
                    response.put("productId", product.productId());
                    response.put("remainingStock", product.quantity());
                } else {
                    response.put("status", "error");
                    response.put("message", "Quantity is required for this action");
                }
            } catch (RuntimeException e) {
                response.put("status", "error");
                response.put("message", e.getMessage());
            }



            // if (productOpt.isPresent()) {
            //     if(quantity != null) {
            //         productService.reduceProductStock(productId, quantity);
            //         ProductDTO product = productOpt.get();
            //         response.put("status", "success");
            //         response.put("message", "Stock has been successfully reduced");
            //         response.put("productId", product.productId());
            //         response.put("remainingStock", product.quantity());
            //     } else {
            //         response.put("status", "error");
            //         response.put("message", "Quantity is required for this action");
            //     }
            // }
        } else {
            response.put("status", "error");
            response.put("message", "Unknown action");
        }
        // Send the response back to the client
        session.sendMessage(new org.springframework.web.socket.TextMessage(response.toString()));
    }

}
