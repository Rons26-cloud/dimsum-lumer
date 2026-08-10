import ProductCard from '../../components/cards/ProductCard.jsx';

export function ProductGrid({ products, className = '' }) {
  return <div className={`grid grid-cols-2 items-stretch gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 ${className}`}>
    {products.map((product) => <ProductCard key={product.id} product={product}/>)}
  </div>;
}
