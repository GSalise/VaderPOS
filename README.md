# VaderPOS
IT3206N Final Project

### Inventory System Socket
- has three parameters:
  - **action**
    - defines the action you want to make
    - there are currently 2 actions available:
      - **"getProduct"**
        - retrieves a singular item from the inventory with all its details included
      - **"takeProductFromStock"**
        - takes a stock away from the requested item in accordance to the number of stock you want to take away
  - **productId**
    - defines the product you want to modify
  - **quantity**
    - defines the amount of product you want to modify
    - this parameter is optional

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
#### takeProductFromStock sample
```
{
    "action": "takeProductFromStock",
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

