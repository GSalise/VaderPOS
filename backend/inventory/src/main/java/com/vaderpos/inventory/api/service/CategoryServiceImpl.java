package com.vaderpos.inventory.api.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.vaderpos.inventory.api.model.ProductCategory;
import com.vaderpos.inventory.api.dto.CategoryDTO;
import com.vaderpos.inventory.api.repository.ICategoryRepository;

@Service
public class CategoryServiceImpl implements ICategoryService{
    
    private final ICategoryRepository categoryRepository;

    public CategoryServiceImpl(ICategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
        .map(this::convertToDTO)
        .collect(Collectors.toList());
    }

    @Override
    public Optional<CategoryDTO> getCategory(Integer id){
        if (id == null) {
            return Optional.empty();
        }
        return categoryRepository.findById(id)
                .map(this::convertToDTO);
    }

@Override
public CategoryDTO createCategory(CategoryDTO categoryDTO) {
    if (categoryDTO == null) {
        throw new IllegalArgumentException("CategoryDTO cannot be null");
    }
    ProductCategory category = convertToEntity(categoryDTO);
    if (category == null) {
        throw new RuntimeException("ProductCategory conversion returned null");
    }
    ProductCategory savedCategory = categoryRepository.save(category);
    return convertToDTO(savedCategory);
}

    @Override
    public CategoryDTO updateCategory(Integer id, CategoryDTO categoryDTO){
        if (id == null) {
            throw new IllegalArgumentException("Category id cannot be null");
        }
        if (categoryDTO == null) {
            throw new IllegalArgumentException("CategoryDTO cannot be null");
        }
        Optional<ProductCategory> existingCategoryOpt = categoryRepository.findById(id);
        if (existingCategoryOpt.isPresent()) {
            ProductCategory existingCategory = existingCategoryOpt.get();
            existingCategory.setCategoryName(categoryDTO.categoryName());
            ProductCategory updatedCategory = categoryRepository.save(existingCategory);
            return convertToDTO(updatedCategory);
        } else {
            throw new RuntimeException("Category not found with id: " + id);
        }
    }

    @Override
    public void deleteCategory(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("Category id cannot be null");
        }
        categoryRepository.deleteById(id);
    }

    private CategoryDTO convertToDTO(ProductCategory productCategory) {
        return new CategoryDTO(
            productCategory.getCategoryId(),
            productCategory.getCategoryName()
        );
    }

    private ProductCategory convertToEntity(CategoryDTO productCategoryDTO) {
        ProductCategory category = new ProductCategory();
        category.setCategoryId(productCategoryDTO.categoryId());
        category.setCategoryName(productCategoryDTO.categoryName());
        return category;
    }
}
