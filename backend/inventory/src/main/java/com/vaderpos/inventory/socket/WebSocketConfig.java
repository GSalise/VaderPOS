package com.vaderpos.inventory.socket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.lang.NonNull;

import com.vaderpos.inventory.api.service.IProductService;
import com.vaderpos.inventory.api.service.ProductServiceImpl;

@EnableWebSocket
@Configuration
public class WebSocketConfig implements WebSocketConfigurer {

    private final IProductService productService;

    public WebSocketConfig(IProductService productService) {
        this.productService = productService;
    }

    @Override
    public void registerWebSocketHandlers(@NonNull WebSocketHandlerRegistry registry) {

        registry.addHandler(socketConnectionHandler(), "/inventory-socket")
                .setAllowedOrigins("*");
    }

    @Bean
    public SocketConnectionHandler socketConnectionHandler() {
        SocketConnectionHandler handler = new SocketConnectionHandler(productService);

        if (productService instanceof ProductServiceImpl) {
            ((ProductServiceImpl) productService).setChangeListener(handler);
        }

        return handler;
    }
}