package com.vaderpos.inventory.socket;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.vaderpos.inventory.api.dto.ProductDTO;
import com.vaderpos.inventory.api.dto.CategoryDTO;
import com.vaderpos.inventory.api.service.ICategoryService;
import com.vaderpos.inventory.api.service.IProductService;


public class SocketConnectionHandler extends TextWebSocketHandler implements ChangeListener{

    private final IProductService productService;
    private final ICategoryService categoryService;
    // Track the last changed product and category ID for targeted updates
    private Long lastChangedProductId = null;
    private Integer lastChangedCategoryId = null;

    public SocketConnectionHandler(IProductService productService, ICategoryService categoryService) {
        this.productService = productService;
        this.categoryService = categoryService;
    }

    // Store all active connections
    private final List<WebSocketSession> activeConnections = Collections.synchronizedList(new ArrayList<>());


    @Override
    public void onProductChanged(Long productId){
        System.out.println("Product change detected - broadcasting to all clients");
        lastChangedProductId = productId;
        broadcastChanges();
    }

    @Override
    public void onCategoryChanged(Integer categoryId){
        System.out.println("Category change detected - broadcasting to all clients");
        lastChangedCategoryId = categoryId;
        broadcastChanges();
    }

    // Executes when a client tries to connect
    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        super.afterConnectionEstablished(session);
        // Print out the session ID and store in the active connections list
        System.out.println(session.getId() + " connected.");
        activeConnections.add(session);

        // Send all product list for initial syncing
        broadcastAllProducts(session);
        broadcastAllCategories(session);
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
        
        if (!(message instanceof TextMessage)) {
            return;
        }

        // Ignore empty or non-JSON payload
        if (message.getPayload() == null || message.getPayload().toString().trim().isEmpty() || !message.getPayload().toString().trim().startsWith("{")) {  
            return;
      }

        JSONObject response = new JSONObject();
        try{
            String payload = message.getPayload().toString();
            System.out.println("Received message from " +  session.getId() + ": " + payload);
            JSONObject jsonObject = new JSONObject(payload);
            long productId = jsonObject.getInt("productId");
            String action = jsonObject.getString("action");

            Integer quantity = null;
            if (jsonObject.has("quantity")) {
                quantity = jsonObject.getInt("quantity");
            }

            switch(action){
                case "getProduct" -> {
                    Optional<ProductDTO> productOpt = productService.getProduct(productId);
                    if (productOpt.isEmpty()) {
                        response.put("status", "error");
                        response.put("message", "Product not found");
                    } else {
                        ProductDTO product = productOpt.get();
                        response.put("status", "success");
                        response.put("productId", product.productId());
                        response.put("productName", product.productName());
                        response.put("quantity", product.quantity());
                        response.put("price", product.price());
                        response.put("categoryId", product.categoryId());
                    }
                }
                case "takeProduct" -> {
                    if(quantity == null) {
                        response.put("status", "error");
                        response.put("message", "Quantity is required for this action");
                        break;
                    }
                    try {
                        lastChangedProductId = productId;
                        productService.reduceProductStock(productId, quantity);
                        Optional<ProductDTO> updatedProduct = productService.getProduct(productId);
                        if(updatedProduct.isPresent()) {
                            ProductDTO product = updatedProduct.get();
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
                }
                case "returnProduct" -> {
                    if(quantity == null) {
                        response.put("status", "error");
                        response.put("message", "Quantity is required for this action");
                        break;
                    }
                    try {
                        lastChangedProductId = productId;
                        productService.returnProductStock(productId, quantity);
                        Optional<ProductDTO> updatedProduct = productService.getProduct(productId);
                        if(updatedProduct.isPresent()) {
                            ProductDTO product = updatedProduct.get();
                            response.put("status", "success");
                            response.put("message", "Stock has been successfully added");
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
                }
                case "ping" -> {
                    response.put("status", "success");
                    response.put("message", "pong");
                }
                default -> {
                    response.put("status", "error");
                    response.put("message", "Unknown action: " + action);
                }
            }
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Invalid request: " + e.getMessage());
        }

        sendJson(session, response);
    }

    private void broadcastChanges() {
        // Handle category changes
        if (lastChangedCategoryId != null) {
            Optional<CategoryDTO> changedCategory = categoryService.getCategory(lastChangedCategoryId);
            if (changedCategory.isEmpty()) {
                // Category was deleted, broadcast all categories
                broadcastAllCategories();
            } else {
                // Broadcast single category update
                for (WebSocketSession session : activeConnections) {
                    broadcastSingleCategory(session, changedCategory.get());
                }
            }
            lastChangedCategoryId = null; // Reset
        }

            // Handle product changes
        if (lastChangedProductId != null) {
            Optional<ProductDTO> changedProduct = productService.getProduct(lastChangedProductId);
            if (changedProduct.isEmpty()) {
                // Product was deleted, broadcast all products
                broadcastAllProducts();
            } else {
                // Broadcast single product update
                for (WebSocketSession session : activeConnections) {
                    broadcastSingleProduct(session, changedProduct.get());
                }
            }
            lastChangedProductId = null; // Reset
        }

        // If no specific changes tracked, broadcast everything
        if (lastChangedProductId == null && lastChangedCategoryId == null) {
            broadcastAllProducts();
            broadcastAllCategories();
        }
    }

    private void broadcastAllProducts() {
        for (WebSocketSession session : activeConnections) {
            broadcastAllProducts(session);
        }
    }

    private void broadcastAllCategories() {
        for (WebSocketSession session : activeConnections) {
            broadcastAllCategories(session);
        }
    }

    private void broadcastSingleProduct(WebSocketSession session, ProductDTO product) {
        try {
            if (session.isOpen()) {

                JSONObject broadcast = new JSONObject();
                broadcast.put("type", "productUpdate");
                broadcast.put("timestamp", System.currentTimeMillis());
                broadcast.put("updateType", "single");
                JSONObject singleProductUpdate = getProductObject(product);
                broadcast.put("updatedProduct", singleProductUpdate);

                session.sendMessage(new TextMessage(broadcast.toString()));
            }
        } catch (Exception e) {
            System.err.println("Error broadcasting to session " + session.getId() + ": " + e.getMessage());
        }
    }

    private void broadcastSingleCategory(WebSocketSession session, CategoryDTO category) {
        try {
            if (session.isOpen()) {

                JSONObject broadcast = new JSONObject();
                broadcast.put("type", "categoryUpdate");
                broadcast.put("timestamp", System.currentTimeMillis());
                broadcast.put("updateType", "single");
                JSONObject singleCategoryUpdate = getCategoryObject(category);
                broadcast.put("updatedCategory", singleCategoryUpdate);

                session.sendMessage(new TextMessage(broadcast.toString()));
            }
        } catch (Exception e) {
            System.err.println("Error broadcasting to session " + session.getId() + ": " + e.getMessage());
        }
    }

    private void broadcastAllProducts(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                List<ProductDTO> products = productService.getAllProducts();

                JSONObject broadcast = new JSONObject();
                broadcast.put("type", "productUpdate");
                broadcast.put("timestamp", System.currentTimeMillis());
                broadcast.put("updateType", "global");
                JSONArray productsArray = getProductObjects(products);

                broadcast.put("products", productsArray);

                session.sendMessage(new TextMessage(broadcast.toString()));
            }
        } catch (Exception e) {
            System.err.println("Error broadcasting to session " + session.getId() + ": " + e.getMessage());
        }
    }

    private void broadcastAllCategories(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                List<CategoryDTO> categories = categoryService.getAllCategories();

                JSONObject broadcast = new JSONObject();
                broadcast.put("type", "categoryUpdate");
                broadcast.put("timestamp", System.currentTimeMillis());
                broadcast.put("updateType", "global");
                JSONArray categoriesArray = getCategoryObjects(categories);

                broadcast.put("categories", categoriesArray);

                session.sendMessage(new TextMessage(broadcast.toString()));
            }
        } catch (Exception e) {
            System.err.println("Error broadcasting to session " + session.getId() + ": " + e.getMessage());
        }
    }

    private static JSONArray getProductObjects(List<ProductDTO> products) {
        JSONArray productsArray = new JSONArray();
        for (ProductDTO product : products) {
            JSONObject productJson = new JSONObject();
            productJson.put("productId", product.productId());
            productJson.put("productName", product.productName());
            productJson.put("quantity", product.quantity());
            productJson.put("price", product.price());
            productJson.put("categoryId", product.categoryId());
            productsArray.put(productJson);
        }
        return productsArray;
    }

    private static JSONArray getCategoryObjects(List<CategoryDTO> categories) {
        JSONArray categoriesArray = new JSONArray();
        for (CategoryDTO category : categories) {
            JSONObject categoryJson = new JSONObject();
            categoryJson.put("categoryId", category.categoryId());
            categoryJson.put("categoryName", category.categoryName());
            categoriesArray.put(categoryJson);
        }
        return categoriesArray;
    }

    private static JSONObject getProductObject(ProductDTO product) {
        JSONObject productJson = new JSONObject();
        productJson.put("productId", product.productId());
        productJson.put("productName", product.productName());
        productJson.put("quantity", product.quantity());
        productJson.put("price", product.price());
        productJson.put("categoryId", product.categoryId());

        return productJson;
    }

    private static JSONObject getCategoryObject(CategoryDTO category) {
        JSONObject categoryJson = new JSONObject();
        categoryJson.put("categoryId", category.categoryId());
        categoryJson.put("categoryName", category.categoryName());

        return categoryJson;
    }

    private void sendJson(WebSocketSession session, JSONObject json) throws IOException {
        session.sendMessage(new TextMessage(json.toString()));
    }

}
