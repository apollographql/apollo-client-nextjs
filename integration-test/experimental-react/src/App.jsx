import { useState, use, Suspense } from "react";
import "./App.css";

function App() {
  const [promise] = useState(() =>
    typeof window === "undefined"
      ? new Promise((resolve) => setTimeout(resolve, 5000))
      : Promise.resolve()
  );
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>

        <Suspense fallback={<div>Loading...</div>}>
          <Child promise={promise} />
        </Suspense>
      </div>
    </>
  );
}

function Child({ promise }) {
  use(promise);
  return <div>Delayed Child component.</div>;
}

export default App;
