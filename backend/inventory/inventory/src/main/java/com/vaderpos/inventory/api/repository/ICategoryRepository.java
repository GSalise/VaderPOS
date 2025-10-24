package com.vaderpos.inventory.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.vaderpos.inventory.api.model.ProductCategory;

public interface ICategoryRepository extends JpaRepository<ProductCategory, Integer> {
}
