import { useEffect, useState } from 'react';

const useRealtimeSync = () => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    // Function to trigger re-render when localStorage changes
    const handleStorageChange = (e) => {
      if (e.key === 'expenseTrackerData' || e.key === 'lastUpdate') {
        setLastUpdate(Date.now());
        // Force component re-render
        window.dispatchEvent(new Event('expenses-updated'));
      }
    };

    // Custom event handler for same-browser updates
    const handleExpensesUpdate = () => {
      setLastUpdate(Date.now());
    };

    // Listen for localStorage changes from other tabs/browsers
    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-browser updates
    window.addEventListener('expenses-updated', handleExpensesUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('expenses-updated', handleExpensesUpdate);
    };
  }, []);

  // Function to trigger update after localStorage modification
  const triggerUpdate = () => {
    localStorage.setItem('lastUpdate', Date.now().toString());
    window.dispatchEvent(new Event('expenses-updated'));
  };

  return { lastUpdate, triggerUpdate };
};

export default useRealtimeSync;