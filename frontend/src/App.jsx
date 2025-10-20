// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Listings from './pages/listings';
import ListingDetailsPage from './pages/ListingDetailsPage';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isLoggedIn, logout } = useAuth();

  return (
    <Router>
      <div className="bg-gray-100 min-h-screen relative">
        <Routes>
          <Route path="/" element={<Listings />} />
          <Route path="/listings/:id" element={<ListingDetailsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
