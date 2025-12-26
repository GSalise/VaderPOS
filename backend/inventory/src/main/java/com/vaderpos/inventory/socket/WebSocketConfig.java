package com.vaderpos.inventory.socket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.lang.NonNull;

import com.vaderpos.inventory.api.service.IProductService;
import com.vaderpos.inventory.api.service.ICategoryService;
import com.vaderpos.inventory.api.service.ProductServiceImpl;
import com.vaderpos.inventory.api.service.CategoryServiceImpl;

@EnableWebSocket
@Configuration 
public class WebSocketConfig implements WebSocketConfigurer {

    private final IProductService productService;
    private final ICategoryService categoryService;

    public WebSocketConfig(IProductService productService, ICategoryService categoryService) {
        this.productService = productService;
        this.categoryService = categoryService;
    }

    @Override
    public void registerWebSocketHandlers(@NonNull WebSocketHandlerRegistry registry) {

        registry.addHandler(socketConnectionHandler(), "/inventory-socket")
                .setAllowedOrigins("*");
    }

    @Bean
    public SocketConnectionHandler socketConnectionHandler() {
        SocketConnectionHandler handler = new SocketConnectionHandler(productService, categoryService);

        if (productService instanceof ProductServiceImpl) {
            ((ProductServiceImpl) productService).setChangeListener(handler);
        }

        if (categoryService instanceof CategoryServiceImpl) {
            ((CategoryServiceImpl) categoryService).setChangeListener(handler);
        }

        return handler;
    }
}