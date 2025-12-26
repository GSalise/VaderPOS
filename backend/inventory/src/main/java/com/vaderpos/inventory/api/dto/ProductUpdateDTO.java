package com.vaderpos.inventory.api.dto;

public record ProductUpdateDTO(Long productID, String productName, Integer quantity, Double price, Integer categoryId) {
}
