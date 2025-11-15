import { BrowserRouter, Routes, Route } from "react-router-dom";
import Studio from "./pages/Studio";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/studio" element={<Studio />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
