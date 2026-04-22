import { Route, Routes } from "react-router-dom";
import { InputPage } from "./pages/InputPage";
import { RecordsPage } from "./pages/RecordsPage";
import { ResultPage } from "./pages/ResultPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InputPage />} />
      <Route path="/records" element={<RecordsPage />} />
      <Route path="/result" element={<ResultPage />} />
    </Routes>
  );
}
