CREATE TABLE product_category (
    category_id INTEGER PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL
);

CREATE TABLE product (
    product_id BIGSERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(19, 2) NOT NULL,
    category_id INTEGER,
    CONSTRAINT fk_category FOREIGN KEY (category_id)
        REFERENCES product_category(category_id)
);