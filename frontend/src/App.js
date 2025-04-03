import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/")
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error("Erro ao conectar à API", error));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Sistema de Reservas</h1>
      <p>{message || "Carregando..."}</p>
    </div>
  );
}

export default App;
