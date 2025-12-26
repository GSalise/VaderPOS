package com.vaderpos.inventory.exception;

public class CategoryNotFoundException extends RuntimeException {
    public CategoryNotFoundException(Integer categoryId) {
        super("Invalid Category ID: " + categoryId);
    }

    public CategoryNotFoundException(int categoryId) {
        super("Invalid Category ID: " + categoryId);
    }
}
