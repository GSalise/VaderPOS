package com.vaderpos.inventory.api.service;

import java.util.List;
import java.util.Optional;
import com.vaderpos.inventory.api.dto.ProductDTO;

public interface IProductService {
    List<ProductDTO> getAllProducts();
    Optional<ProductDTO> getProduct(Long id);
    ProductDTO createProduct(ProductDTO productDTO);
    ProductDTO updateProduct(Long id, ProductDTO productDTO);
    void deleteProduct(Long id);

    int checkProductStock(Long id);
    void reduceProductStock(Long id, int quantity);
    void returnProductStock(Long id, int quantity);
}
