package com.vaderpos.inventory.api.service;

import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vaderpos.inventory.api.dto.ProductDTO;
import com.vaderpos.inventory.api.dto.ProductUpdateDTO;
import com.vaderpos.inventory.api.repository.IProductRepository;
import com.vaderpos.inventory.exception.InsufficientStockException;
import com.vaderpos.inventory.exception.CategoryNotFoundException;
import com.vaderpos.inventory.exception.ProductNotFoundException;
import com.vaderpos.inventory.api.repository.ICategoryRepository;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import com.vaderpos.inventory.api.model.Product;
import com.vaderpos.inventory.socket.ChangeListener;


@Service
public class ProductServiceImpl implements IProductService {

    private final IProductRepository productRepository;
    private final ICategoryRepository categoryRepository;

    public ProductServiceImpl(IProductRepository productRepository, ICategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    private ChangeListener changeListener;

    public void setChangeListener(ChangeListener listener){
        this.changeListener = listener;
    }


    private void notifyChange(Long productId) {
        if (changeListener != null) {
            changeListener.onProductChanged(productId);
        }
    }


    @Override
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public Optional<ProductDTO> getProduct(Long id) {
        if (id == null) {
            return Optional.empty();
        }
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
        if (productDTO == null) {
            throw new IllegalArgumentException("ProductDTO cannot be null");
        }
        Product product = convertToEntity(productDTO);
        Product savedProduct = productRepository.save(product);
        notifyChange(savedProduct.getProductId());
        return convertToDTO(savedProduct);
    }

    @Override
    public ProductDTO updateProduct(Long id, ProductUpdateDTO productUpdateDTO) {
        if (id == null) {
            throw new IllegalArgumentException("Product id cannot be null");
        }
        // add category check later
        Optional<Product> existingProductOpt = productRepository.findById(id);
        if (existingProductOpt.isPresent()) {
            Product existingProduct = existingProductOpt.get();

            if (productUpdateDTO.productName() != null){
                existingProduct.setProductName(productUpdateDTO.productName());
            }

            if (productUpdateDTO.quantity() != null){
                existingProduct.setQuantity(productUpdateDTO.quantity());
            }

            if (productUpdateDTO.categoryId() != null){
                if(categoryRepository.findById(productUpdateDTO.categoryId()).isEmpty()){
                    throw new CategoryNotFoundException(productUpdateDTO.categoryId());
                }
                existingProduct.setCategoryId(productUpdateDTO.categoryId());
            }

            if (productUpdateDTO.price() != null){
                existingProduct.setPrice(BigDecimal.valueOf(productUpdateDTO.price()));
            }

            Product updatedProduct = productRepository.save(existingProduct);
            notifyChange(updatedProduct.getProductId());
            return convertToDTO(updatedProduct);
        } else {
            throw new ProductNotFoundException(id);
        }
    }

    @Override
    public void deleteProduct(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Product id cannot be null");
        }
        productRepository.deleteById(id);
        notifyChange(null);
    }

    @Override
    public int checkProductStock(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Product id cannot be null");
        }
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            return productOpt.get().getQuantity();
        } else {
            throw new ProductNotFoundException(id);
        }
    }

    @Override
    public void reduceProductStock(Long id, int quantity) {
        if (id == null) {
            throw new IllegalArgumentException("Product id cannot be null");
        }
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            if (product.getQuantity() >= quantity){
                product.setQuantity(product.getQuantity() - quantity);
                productRepository.save(product);
                notifyChange(product.getProductId());
            } else {
                throw new InsufficientStockException(id, quantity, product.getQuantity());
            }
        }else{
            throw new ProductNotFoundException(id);
        }
    }

    public void returnProductStock(Long id, int quantity) {
        if (id == null) {
            throw new IllegalArgumentException("Product id cannot be null");
        }
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()){
            Product product = productOpt.get();
            product.setQuantity(product.getQuantity() + quantity);
            productRepository.save(product);
            notifyChange(product.getProductId());
        } else {
            throw new ProductNotFoundException(id);
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

