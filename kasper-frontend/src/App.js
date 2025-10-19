import { useEffect, useState } from "react";
import './App.css';

function App() {
  const [message, setMessage] = useState("hi");

  useEffect(() => {
    // Fetch data from backend
    fetch("http://localhost:5000/")
      .then((res) => res.text())
      .then((data) => setMessage(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>React Frontend</h1>
        <p>Backend says: {message}</p>
      </header>
    </div>
  );
}

export default App;
