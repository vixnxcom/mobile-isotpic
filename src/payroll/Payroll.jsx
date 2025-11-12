
import React, { useState } from 'react';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw9Cc12S9Dhg_LJucjt-yI6cDV0UVKeajQkRM3wmPJinQHPLECNNIUEWZX9mdskQtev/exec';

export default function TopUp() {
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');

  async function handleTopUp(e) {
    e.preventDefault();
    if (!amount || !email) return alert('enter email and amount');
    const payload = { action: 'initTopUp', email, amount };
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.status && json.data && json.data.authorization_url) {
      // open paystack payment link
      window.open(json.data.authorization_url, '_blank');
    } else {
      alert('Failed to initialize top up: ' + JSON.stringify(json));
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Top up Wallet</h2>
      <form onSubmit={handleTopUp} className="space-y-3">
        <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)}
          className="w-full p-2 border rounded" />
        <input type="number" placeholder="Amount (NGN)" value={amount} onChange={e=>setAmount(e.target.value)}
          className="w-full p-2 border rounded" />
        <button className="w-full p-2 bg-blue-600 text-white rounded">Top up</button>
      </form>
    </div>
  );
}
