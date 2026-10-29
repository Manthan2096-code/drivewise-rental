export default function FilterBar({ query, category, inStockOnly, categories, onQueryChange, onCategoryChange, onStockChange }) {
  return (
    <section className="filter-panel" aria-label="Filter vehicles">
      <label className="search-field">
        <span className="sr-only">Search vehicles</span>
        <span aria-hidden="true">⌕</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search vehicles..." />
      </label>
      <label className="select-field">
        <span className="sr-only">Vehicle category</span>
        <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          {categories.map((item) => <option key={item} value={item}>{item === 'All' ? 'All categories' : item}</option>)}
        </select>
      </label>
      <label className="stock-filter"><input type="checkbox" checked={inStockOnly} onChange={(event) => onStockChange(event.target.checked)} /> In stock only</label>
    </section>
  );
}
