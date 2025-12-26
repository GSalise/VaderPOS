package com.vaderpos.inventory.socket;

public interface ChangeListener {
    void onProductChanged(Long productId);
    void onCategoryChanged(Integer categoryId);
}
