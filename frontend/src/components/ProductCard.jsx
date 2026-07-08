export default function ProductCard({ product, onAddToCart }) {
  return (
    <div className="product-card">
      <div className="product-image-placeholder">{product.name.charAt(0)}</div>
      <h3>{product.name}</h3>
      <p className="category">{product.category}</p>
      <p className="price">₹{product.price.toLocaleString('en-IN')}</p>
      <p className="stock">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
      <button disabled={product.stock === 0} onClick={() => onAddToCart(product)}>
        Add to Cart
      </button>
    </div>
  );
}
