const express = require('express');
const router = express.Router();

let products = [
    { id: 1, name: 'Product 1', price: 10.99 },
    { id: 2, name: 'Product 2', price: 19.99 },
    { id: 3, name: 'Product 3', price: 5.99 }
];

router.get('/', (req, res) => {
    res.json(products);
});

router.get('/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).send('Product not found');
    res.json(product);
});

router.post('/', (req, res) => {
    const {name, price ,category} = req.body;
    if (!name || !price ) {
        return res.status(400).send('Name and price are required');
    }
    const newProduct = {
        id: products.length + 1,
        name,
        price,
        category: category || 'Uncategorized'
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

router.put('/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).send('Product not found');
    }

    const { name, price, category } = req.body;

    if (!name || price === undefined || !category) {
        return res.status(400).json({message: 'Name, price, and category are required'});
    }

    if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({message: 'Price must be a non-negative number'});
    }

    product.name = name;
    product.price = price;
    product.category = category;
    
    res.json(product);
});

router.delete('/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) return res.status(404).json({ message: 'Product not found' });

    products.splice(productIndex, 1);
    res.status(204).send();
});

module.exports = router;