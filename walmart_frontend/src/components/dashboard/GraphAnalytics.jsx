// src/components/dashboard/GraphAnalytics.jsx
import React, { useState, useEffect } from 'react';
import Graph from 'react-graph-vis';
import styles from './GraphAnalytics.module.css'; // Buat file CSS ini

// Daftar endpoint dan judulnya
const GRAPH_ENDPOINTS = {
  'market-basket': { 
    title: 'Market Basket Analysis', 
    url: '/graph/market-basket',
    description: "This graph shows which products are most frequently purchased together in a single transaction.",
    objective: "To discover opportunities for product bundling, cross-selling strategies, and in-store product placement."
  },
  'loyal-customers': { 
    title: 'Top Products for Loyal Customers', 
    url: '/graph/loyal-customers',
    description: "Displays the most popular products among customers who have not churned (loyal customers).",
    objective: "To understand loyal customer preferences to enhance retention strategies and personalize offers."
  },
  'vip-customers': { 
    title: 'Top 5 VIP Customers & Their Products', 
    url: '/graph/vip-customers',
    description: "Identifies the top 5 customers by total spending and the favorite products they purchase.",
    objective: "To recognize the most valuable (VIP) customers for exclusive loyalty programs and special treatment."
  },
  'churn-products': { 
    title: 'Top Products for Churned Customers', 
    url: '/graph/churn-products',
    description: "Shows the products most frequently purchased by customers who eventually churned.",
    objective: "To identify products that may be causing dissatisfaction or could have quality issues."
  },
  'location-category': { 
    title: 'Top 3 Categories per Location', 
    url: '/graph/location-category',
    description: "Shows the best-selling product categories in each location or city.",
    objective: "To optimize regional stock management and target local marketing campaigns more effectively."
  },
  'product-connections': { 
    title: 'Raw Product Connections (Sample)', 
    url: '/graph/product-connections',
    description: "Shows a sample of direct relationships between specific transaction details and the products they contain.",
    objective: "To visualize the raw connectivity in the data graph and understand the transaction-product links."
  },
};

const GraphAnalytics = () => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGraph, setSelectedGraph] = useState('market-basket'); // Default graph
  const [viewMode, setViewMode] = useState('graph');
  
  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(true);
      setError('');
      setGraphData({ nodes: [], edges: [] }); // Clear previous graph
      try {
        const endpoint = GRAPH_ENDPOINTS[selectedGraph]?.url;
        if (!endpoint) throw new Error('Invalid graph selection');

        // Ganti BASE_URL dengan alamat server Express Anda jika perlu
        const BASE_URL = 'http://10.35.148.59:5001'; // Ganti port Anda
        const response = await fetch(`${BASE_URL}${endpoint}`);

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        setGraphData(data);
      } catch (err) {
        setError(`Failed to load graph data: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [selectedGraph]); // Fetch ulang saat selectedGraph berubah

  // Opsi konfigurasi untuk react-graph-vis
const options = {
    layout: { hierarchical: false },
    edges: {
      color: "#a0a0c0",
      arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      font: { color: '#ffffff', size: 9, align: 'middle', strokeWidth: 0 }, // Font lebih kecil, di tengah
      smooth: { type: 'continuous' } // Tipe smooth berbeda
    },
    nodes: {
      shape: 'ellipse', // Bentuk default
      font: { color: '#ffffff', size: 12 },
      borderWidth: 2,
    },
    // ✅ Tambahkan styling berdasarkan grup
    groups: {
        Product: {
            color: { background:'#00C49F', border: '#00C49F' }, // Hijau
            shape: 'dot',
            size: 18,
        },
        TransactionDetail: {
            color: { background:'#FFBB28', border: '#FFBB28' }, // Kuning
            shape: 'square',
            size: 12,
        },
        // Tambahkan grup lain jika ada (Customer, Location, Category, etc.)
        'VIP Customer': { color: { background:'#FF6384', border:'#FF6384' }, shape: 'star', size: 25 },
        Location: { color: { background:'#36A2EB', border:'#36A2EB' }, shape: 'triangle' },
        Category: { color: { background:'#9966FF', border:'#9966FF' }, shape: 'hexagon' },
        Segment: { color: { background: '#FF9F40', border:'#FF9F40' }, shape: 'diamond', size: 20 },
    },
    physics: {
      enabled: true,
      barnesHut: {
        gravitationalConstant: -8000, // Kurangi sedikit gaya tolak
        centralGravity: 0.4,
        springLength: 120, // Kurangi panjang spring
        springConstant: 0.05,
        damping: 0.1
      },
      solver: 'barnesHut',
      stabilization: { iterations: 150 } // Iterasi stabilisasi
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      navigationButtons: true, // Tambahkan tombol zoom/navigasi
      keyboard: true, // Aktifkan navigasi keyboard
    },
    height: '600px',
  };

  const renderTableView = () => {
    // Fungsi helper untuk parsing label
    const parseCount = (label) => parseInt(label.match(/\d+/)[0], 10);

    let headers = [];
    let rows = [];

    switch (selectedGraph) {
      case 'market-basket':
        headers = ['Product 1', 'Product 2', 'Frequency'];
        rows = graphData.edges.map(edge => [edge.from, edge.to, parseCount(edge.label)]);
        break;
      case 'loyal-customers':
      case 'churn-products':
        headers = ['Product Name', 'Purchase Count'];
        rows = graphData.edges.map(edge => [edge.to, parseCount(edge.label)]);
        break;
      case 'vip-customers':
        headers = ['Customer ID', 'Total Spend ($)', 'Favorite Products'];
        // Rekonstruksi data dari nodes dan edges
        const vipNodes = graphData.nodes.filter(n => n.group === 'VIP Customer');
        rows = vipNodes.map(node => {
            const spend = node.label.split('\n($')[1]?.replace(')', '') || 'N/A';
            const products = graphData.edges.filter(e => e.from === node.id).map(e => e.to).join(', ');
            return [node.id, spend, products];
        });
        break;
      case 'location-category':
        headers = ['Location', 'Top Category', 'Purchase Count'];
        rows = graphData.edges.map(edge => [edge.from, edge.to, parseCount(edge.label)]);
        break;
      default:
        return <p>No table view available for this selection.</p>;
    }

    return (
      <div className={styles.tableContainer}>
        <table className={styles.resultsTable}>
          <thead>
            <tr>
              {headers.map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

return (
    <div className={styles.graphContainer}>
      <div className={styles.controls}>
        <label htmlFor="graphSelect">Select Insight:</label>
        <select
          id="graphSelect"
          value={selectedGraph}
          onChange={(e) => setSelectedGraph(e.target.value)}
          className={styles.graphSelect}
        >
          {Object.entries(GRAPH_ENDPOINTS).map(([key, value]) => (
            <option key={key} value={key}>{value.title}</option>
          ))}
        </select>
      </div>
      {/* ✅ UI BARU: Toggle untuk beralih tampilan */}
        <div className={styles.viewToggle}>
            <button onClick={() => setViewMode('graph')} className={viewMode === 'graph' ? styles.active : ''}>Graph View</button>
            <button onClick={() => setViewMode('table')} className={viewMode === 'table' ? styles.active : ''}>Table View</button>
        </div>

      {/* ✅ LANGKAH 2: Tambahkan container untuk menampilkan penjelasan */}
      <div className={styles.infoBox}>
          <h3>{GRAPH_ENDPOINTS[selectedGraph].title}</h3>
          <p><strong>What it shows:</strong> {GRAPH_ENDPOINTS[selectedGraph].description}</p>
          <p><strong>Main Objective:</strong> {GRAPH_ENDPOINTS[selectedGraph].objective}</p>
      </div>

      {loading && <div className={styles.statusMessage}>Loading Graph...</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}
      {!loading && !error && (
        <div className={styles.contentWrapper}>
{/* ✅ RENDER KONDISIONAL: Tampilkan Graph atau Tabel */}
          {viewMode === 'graph' ? (
<div className={styles.graphWrapper}>
          <Graph
            key={selectedGraph + JSON.stringify(graphData)} // Key lebih kompleks untuk force re-render
            graph={graphData}
            options={options}
            getNetwork={network => {
              // Optional: bisa digunakan untuk interaksi lebih lanjut
              // network.on("click", params => console.log("Network click:", params));
            }}
          />
        </div>
          ) : (
            renderTableView()
          )}
        </div>
      )}
    </div>
  );
};

export default GraphAnalytics;