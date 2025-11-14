package com.vaderpos.inventory.api.service;

import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vaderpos.inventory.api.dto.ProductDTO;
import com.vaderpos.inventory.api.repository.IProductRepository;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import com.vaderpos.inventory.api.model.Product;

@Service
public class ProductServiceImpl implements IProductService {

    private final IProductRepository productRepository;

    public ProductServiceImpl(IProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public Optional<ProductDTO> getProduct(Long id) {
        return productRepository.findById(id)
            .map(this::convertToDTO);
    }

    // @Override
    // public ProductDTO createProduct(ProductDTO productDTO) {
    //     Product product = new Product();
    //     product.setProductName(productDTO.productName());
    //     product.setQuantity(productDTO.quantity());
    //     product.setPrice(BigDecimal.valueOf(productDTO.price()));
    //     product.setCategoryId(productDTO.categoryId());
    //     Product savedProduct = productRepository.save(product);
    //     return convertToDTO(savedProduct);
    // }

    @Override
    public ProductDTO createProduct(ProductDTO productDTO) {
        Product product = convertToEntity(productDTO);
        Product savedProduct = productRepository.save(product);
        return convertToDTO(savedProduct);
    }

    @Override
    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        Optional<Product> existingProductOpt = productRepository.findById(id);
        if (existingProductOpt.isPresent()) {
            Product existingProduct = existingProductOpt.get();
            existingProduct.setProductName(productDTO.productName());
            existingProduct.setQuantity(productDTO.quantity());
            existingProduct.setPrice(BigDecimal.valueOf(productDTO.price()));
            existingProduct.setCategoryId(productDTO.categoryId());
            Product updatedProduct = productRepository.save(existingProduct);
            return convertToDTO(updatedProduct);
        } else {
            throw new RuntimeException("Product not found");
        }
    }

    @Override
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    @Override
    public int checkProductStock(Long id) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            return productOpt.get().getQuantity();
        } else {
            throw new RuntimeException("Product not found");
        }
    }

    @Override
    public void reduceProductStock(Long id, int quantity) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            if (product.getQuantity() >= quantity){
                product.setQuantity(product.getQuantity() - quantity);
                productRepository.save(product);
            } else {
                throw new RuntimeException("Insufficient Stock");
            }
        }else{
            throw new RuntimeException("Product not found");
        }
    }

    private ProductDTO convertToDTO(Product product) {
        return new ProductDTO(
            product.getProductId(),
            product.getProductName(),
            product.getQuantity(),
            product.getPrice().doubleValue(),
            product.getCategoryId()
        );
    }

    private Product convertToEntity(ProductDTO productDTO) {
        Product product = new Product();
        product.setProductName(productDTO.productName());
        product.setQuantity(productDTO.quantity());
        product.setPrice(BigDecimal.valueOf(productDTO.price()));
        product.setCategoryId(productDTO.categoryId());
        return product;
    }

}

