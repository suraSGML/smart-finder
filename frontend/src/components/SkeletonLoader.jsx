import React from 'react';

// Base pulse block — all skeletons are built from this
const Pulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-3">
    <Pulse className="h-40 w-full rounded-lg" />
    <Pulse className="h-4 w-3/4" />
    <Pulse className="h-4 w-1/2" />
    <div className="flex justify-between items-center pt-1">
      <Pulse className="h-5 w-1/3" />
      <Pulse className="h-8 w-20 rounded-lg" />
    </div>
  </div>
);

const ProductSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
    <Pulse className="h-44 w-full rounded-none" />
    <div className="p-4 space-y-2">
      <Pulse className="h-3 w-1/3" />
      <Pulse className="h-4 w-4/5" />
      <Pulse className="h-4 w-3/5" />
      <div className="flex items-center gap-1 pt-1">
        {[...Array(5)].map((_, i) => (
          <Pulse key={i} className="h-3 w-3 rounded-full" />
        ))}
        <Pulse className="h-3 w-8 ml-1" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Pulse className="h-5 w-1/4" />
        <Pulse className="h-8 w-8 rounded-full" />
      </div>
    </div>
  </div>
);

const ShopSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
    <Pulse className="h-36 w-full rounded-none" />
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Pulse className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Pulse className="h-4 w-3/4" />
          <Pulse className="h-3 w-1/2" />
        </div>
      </div>
      <Pulse className="h-3 w-full" />
      <Pulse className="h-3 w-4/5" />
      <div className="flex gap-2 pt-2">
        <Pulse className="h-8 flex-1 rounded-lg" />
        <Pulse className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  </div>
);

const ListSkeleton = () => (
  <div className="flex items-center gap-3 py-3 px-4 bg-white dark:bg-gray-800 rounded-lg">
    <Pulse className="h-10 w-10 rounded-lg flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Pulse className="h-4 w-3/4" />
      <Pulse className="h-3 w-1/2" />
    </div>
    <Pulse className="h-5 w-16 flex-shrink-0" />
  </div>
);

const DetailSkeleton = () => (
  <div className="space-y-6">
    <Pulse className="h-64 w-full rounded-xl" />
    <div className="space-y-2">
      <Pulse className="h-3 w-1/4" />
      <Pulse className="h-7 w-3/4" />
      <Pulse className="h-5 w-1/3" />
    </div>
    <div className="flex items-center gap-2">
      {[...Array(5)].map((_, i) => (
        <Pulse key={i} className="h-4 w-4 rounded-full" />
      ))}
      <Pulse className="h-4 w-16" />
    </div>
    <div className="space-y-2">
      <Pulse className="h-4 w-full" />
      <Pulse className="h-4 w-full" />
      <Pulse className="h-4 w-5/6" />
      <Pulse className="h-4 w-4/6" />
    </div>
    <div className="flex gap-3">
      <Pulse className="h-11 flex-1 rounded-xl" />
      <Pulse className="h-11 w-11 rounded-xl flex-shrink-0" />
      <Pulse className="h-11 w-11 rounded-xl flex-shrink-0" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Pulse className="h-3 w-1/2" />
          <Pulse className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  </div>
);

const TextSkeleton = ({ lines = 3 }) => (
  <div className="space-y-2">
    {[...Array(lines)].map((_, i) => (
      <Pulse
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-3/5' : i % 3 === 1 ? 'w-5/6' : 'w-full'}`}
      />
    ))}
  </div>
);

const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
    <div className="flex gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
      {[...Array(cols)].map((_, i) => (
        <Pulse key={i} className="h-4 flex-1" />
      ))}
    </div>
    {[...Array(rows)].map((_, r) => (
      <div
        key={r}
        className="flex gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
      >
        {[...Array(cols)].map((_, c) => (
          <Pulse key={c} className={`h-4 flex-1 ${c === cols - 1 ? 'w-16' : ''}`} />
        ))}
      </div>
    ))}
  </div>
);

const SkeletonLoader = ({ type = 'card', count = 1, className = '' }) => {
  const renderSingle = (key) => {
    switch (type) {
      case 'product': return <ProductSkeleton key={key} />;
      case 'shop':    return <ShopSkeleton key={key} />;
      case 'list':    return <ListSkeleton key={key} />;
      case 'detail':  return <DetailSkeleton key={key} />;
      case 'text':    return <TextSkeleton key={key} lines={count} />;
      case 'table':   return <TableSkeleton key={key} rows={count} />;
      case 'card':
      default:        return <CardSkeleton key={key} />;
    }
  };

  if (type === 'text' || type === 'table') {
    return <div className={className}>{renderSingle('single')}</div>;
  }

  if (type === 'product') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
        {[...Array(count)].map((_, i) => renderSingle(i))}
      </div>
    );
  }

  if (type === 'shop') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {[...Array(count)].map((_, i) => renderSingle(i))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(count)].map((_, i) => renderSingle(i))}
    </div>
  );
};

export default SkeletonLoader;
