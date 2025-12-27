package com.vaderpos.inventory.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.vaderpos.inventory.api.model.Product;

public interface IProductRepository extends JpaRepository<Product, Long> {
    long countByCategoryId(Integer categoryId);
}
