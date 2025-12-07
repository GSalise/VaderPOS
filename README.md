# VaderPOS
IT3206N Final Project

### Inventory System Socket
- Subscription/Live Updates
  - Unlike actions, these are broadcasted to all connected clients
  - Can be classified as global or single:
    - global - is triggered when a product is deleted or during first connection
    - single - is triggered when a product is updated
- Has three parameters:
  - **action**
    - defines the action you want to make
    - there are currently 2 actions available:
      - **"getProduct"**
        - retrieves a singular item from the inventory with all its details included
      - **"takeProduct"**
        - takes a stock away from the requested item in accordance to the quantity
      - **"returnProduct"**
        - returns a stock to the requested item in accordance to the quantity
  - **productId**
    - defines the product you want to modify
  - **quantity**
    - defines the amount of product you want to modify
    - this parameter is optional

#### Subscription/Live Updates
```
{
    "type": "productUpdate",
    "timestamp": 1764382723706,
    "products": [
        {
            "quantity": 6,
            "productId": 2,
            "price": 1000,
            "productName": "Surf",
            "categoryId": 1
        },
        {
            "quantity": 199,
            "productId": 4,
            "price": 100,
            "productName": "Safeguard",
            "categoryId": 0
        }
    ]
}
```

#### getProduct sample
```
{
    "action": "getProduct",
    "productId": 4,
}
```
```
{
    "quantity":6,
    "productId":4,
    "price":1000,
    "productName":"Safeguard",
    "categoryId":1,
    "status":"success"
}
```
#### takeProduct sample
```
{
    "action": "takeProduct",
    "productId": 4,
    "quantity": 1
}
```
```
{
    "productId":4,
    "remainingStock":5,
    "message":"Stock has been successfully reduced",
    "status":"success"
}
```

#### returnProduct sample
```
{
    "action": "returnProduct",
    "productId": 4,
    "quantity": 1
}
```
```
{
    "productId": 4,
    "remainingStock": 200,
    "message": "Stock has been successfully added",
    "status": "success"
}
```

#### global sample
```
{
    "type": "productUpdate",
    "timestamp": 1764947662042,
    "updateType": "global",
    "products": [
        {
            "quantity": 6,
            "productId": 2,
            "price": 1000,
            "productName": "Surf",
            "categoryId": 1
        },
        {
            "quantity": 199,
            "productId": 4,
            "price": 100,
            "productName": "Safeguard",
            "categoryId": 0
        }
    ]
}
```

#### single sample
```
{
    "updatedProduct": {
        "quantity": 198,
        "productId": 4,
        "price": 100,
        "productName": "Safeguard",
        "categoryId": 0
    },
    "type": "productUpdate",
    "timestamp": 1764947859898,
    "updateType": "single"
}
```
