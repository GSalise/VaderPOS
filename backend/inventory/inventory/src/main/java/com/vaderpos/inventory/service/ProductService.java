package com.vaderpos.inventory.service;

import java.util.List;
import java.util.Optional;

import com.vaderpos.inventory.api.dto.ProductDTO;

public interface ProductService {
    List<ProductDTO> getAllProducts();
    Optional<ProductDTO> getProduct(Long id);
    ProductDTO createProduct(ProductDTO productDTO);
    ProductDTO updateProduct(Long id, ProductDTO productDTO);
    void deleteProduct(Long id);
}
