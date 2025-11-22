package com.vaderpos.inventory.api.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class ProductCategory {
    
    @Id
    private Integer categoryId;
    private String categoryName;

    // Getters and Setters
    public Integer getCategoryId() { return this.categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId =  categoryId; }

    public String getCategoryName() { return this.categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
}
