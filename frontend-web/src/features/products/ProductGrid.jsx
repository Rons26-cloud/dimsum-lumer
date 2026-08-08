import ProductCard from '../../components/cards/ProductCard.jsx';

export function ProductGrid({ products, className = '' }) {
  return <div className={`grid grid-cols-3 items-stretch gap-1.5 xs:gap-2 sm:grid-cols-3 lg:grid-cols-4 ${className}`}>
    {products.map((product) => <ProductCard key={product.id} product={product}/>)}
  </div>;
}
