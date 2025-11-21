package com.vaderpos.inventory.api.service;

import com.vaderpos.inventory.api.dto.CategoryDTO;
import java.util.List;
import java.util.Optional;

public interface ICategoryService {
    List<CategoryDTO> getAllCategories();
    Optional<CategoryDTO> getCategory(Integer id);
    CategoryDTO createCategory(CategoryDTO categoryDTO);
    CategoryDTO updateCategory(Integer id, CategoryDTO categoryDTO);
    void deleteCategory(Integer id);
}
