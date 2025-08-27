import React from 'react';

export function TestDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Dashboard</h1>
      <p>If you can see this, the routing is working correctly.</p>
      <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded">
        <p className="font-semibold">Debug Information:</p>
        <p>URL: {window.location.href}</p>
        <p>Path: {window.location.pathname}</p>
      </div>
    </div>
  );
}

export default TestDashboard;
