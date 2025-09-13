package com.vaderpos.inventory.api.dto;

public record ProductDTO(Long productId, String productName, int quantity, double price, int categoryId) {
}
