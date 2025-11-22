package com.vaderpos.inventory.socket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.lang.NonNull;

import com.vaderpos.inventory.api.service.IProductService;



@EnableWebSocket
@Configuration
public class WebSocketConfig implements WebSocketConfigurer {
    @Autowired
    private IProductService productService;

    @Override
    public void registerWebSocketHandlers(@NonNull WebSocketHandlerRegistry registry) {
        registry.addHandler(new SocketConnectionHandler(productService), "/inventory-socket")
                .setAllowedOrigins("*");
    }
}
