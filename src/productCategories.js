export function getProductCategories(product){
  const values=product.categories?.length?product.categories:[product.category];
  return [...new Set(values.filter(value=>typeof value==='string').map(value=>value.trim()).filter(Boolean))];
}
