import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AnalyticsCharts = ({ analytics }) => {
  if (!analytics) return null;

  // Prepare data for charts
  const salesData = analytics.sales_by_month || [
    { month: 'Jan', sales: 12000, orders: 45 },
    { month: 'Feb', sales: 15000, orders: 52 },
    { month: 'Mar', sales: 18000, orders: 61 },
    { month: 'Apr', sales: 14000, orders: 48 },
    { month: 'May', sales: 22000, orders: 73 },
    { month: 'Jun', sales: 25000, orders: 82 },
  ];

  const categoryData = analytics.sales_by_category || [
    { name: 'Electronics', value: 35 },
    { name: 'Food', value: 25 },
    { name: 'Clothing', value: 20 },
    { name: 'Household', value: 12 },
    { name: 'Other', value: 8 },
  ];

  const topProducts = analytics.top_products || [
    { name: 'Product A', sales: 4500, orders: 150 },
    { name: 'Product B', sales: 3800, orders: 120 },
    { name: 'Product C', sales: 3200, orders: 95 },
    { name: 'Product D', sales: 2800, orders: 85 },
    { name: 'Product E', sales: 2100, orders: 70 },
  ];

  const customerData = analytics.customers_over_time || [
    { date: 'Jan', new: 45, returning: 120 },
    { date: 'Feb', new: 52, returning: 135 },
    { date: 'Mar', new: 61, returning: 148 },
    { date: 'Apr', new: 48, returning: 142 },
    { date: 'May', new: 73, returning: 165 },
    { date: 'Jun', new: 82, returning: 180 },
  ];

  return (
    <div className="space-y-6">
      {/* Sales Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            ETB {(analytics.total_revenue || 106000).toLocaleString()}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">+12.5% from last month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {analytics.total_orders || 361}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">+8.2% from last month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Products Sold</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {analytics.products_sold || 1245}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">+15.3% from last month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Average Order Value</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            ETB {analytics.avg_order_value ? analytics.avg_order_value.toLocaleString() : '294'}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">-2.1% from last month</p>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Sales Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Revenue (ETB)"
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Orders"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Top Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" width={80} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="sales" fill="#3b82f6" name="Revenue (ETB)" />
              <Bar dataKey="orders" fill="#10b981" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Growth */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Customer Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={customerData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="new" fill="#3b82f6" name="New Customers" />
            <Bar dataKey="returning" fill="#10b981" name="Returning Customers" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
