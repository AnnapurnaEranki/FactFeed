import { useEffect, useState } from "react";
import "./style.css";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xadaucpfyxhvhbkhhmpj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZGF1Y3BmeXhodmhia2hobXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MjA4ODAsImV4cCI6MjA2ODQ5Njg4MH0.TzMGC8hQjINlnLbIa53TnqaCs6_doUBGepSR4gG0V8A";
const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORIES = [
  { name: "technology", color: "#3b82f6" },
  { name: "science", color: "#16a34a" },
  { name: "finance", color: "#ef4444" },
  { name: "society", color: "#eab308" },
  { name: "entertainment", color: "#db2777" },
  { name: "health", color: "#14b8a6" },
  { name: "history", color: "#f97316" },
  { name: "news", color: "#8b5cf6" },
];

function App() {
  const [showForm, setShowForm] = useState(false);
  const [facts, setFacts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function getFacts() {
      let query = supabase.from("facts").select("*");

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      query = query.order("votesInteresting", { ascending: false });

      const { data: facts, error } = await query;

      if (!error) setFacts(facts);
    }

    getFacts();
  }, [selectedCategory]);

  return (
    <>
      <header className="header">
        <div className="logo">
          <img src="logo.png" height="40" width="60" alt="logo" />
          <h1>Fact Feed</h1>
        </div>
        <button
          className="btn btn-large btn-open"
          onClick={() => setShowForm((s) => !s)}
        >
          {showForm ? "Close" : "Share a fact..."}
        </button>
      </header>

      {showForm && <NewFactForm setFacts={setFacts} />}

      <main className="main">
        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        <FactList facts={facts} />
      </main>
    </>
  );
}

function NewFactForm({ setFacts }) {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("technology");
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (text && source && category) {
      setIsUploading(true);

      const { data: newFact, error } = await supabase
        .from("facts")
        .insert([{ text, source, category }])
        .select();

      setIsUploading(false);

      if (!error) {
        setFacts((facts) => [newFact[0], ...facts]);
        setText("");
        setSource("");
        setCategory("technology");
      }
    }
  }

  return (
    <form className="fact-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Share a fact..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <input
        type="text"
        placeholder="Trustworthy source..."
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {cat.name.toUpperCase()}
          </option>
        ))}
      </select>
      <button className="btn btn-post" disabled={isUploading}>
        Post
      </button>
    </form>
  );
}

function CategoryFilter({ selectedCategory, setSelectedCategory }) {
  return (
    <aside>
      <ul>
        <li>
          <button
            className="btn btn-category"
            style={{ backgroundColor: "#64748b" }}
            onClick={() => setSelectedCategory("all")}
          >
            All
          </button>
        </li>
        {CATEGORIES.map((cat) => (
          <li key={cat.name}>
            <button
              className="btn btn-category"
              style={{
                backgroundColor: cat.color,
                fontWeight: selectedCategory === cat.name ? "bold" : "normal",
              }}
              onClick={() => setSelectedCategory(cat.name)}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function FactList({ facts }) {
  return (
    <section>
      <ul className="facts-list">
        {facts.map((fact) => (
          <Fact fact={fact} key={fact.id} />
        ))}
      </ul>
    </section>
  );
}

function Fact({ fact }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentFact, setCurrentFact] = useState(fact);

  async function handleVote(columnName) {
    setIsUpdating(true);

    const { data: updatedFact, error } = await supabase
      .from("facts")
      .update({ [columnName]: currentFact[columnName] + 1 })
      .eq("id", currentFact.id)
      .select();

    setIsUpdating(false);

    if (!error) setCurrentFact(updatedFact[0]);
  }

  const isDisputed =
    currentFact.votesFalse >
    currentFact.votesInteresting + currentFact.votesMindblowing;

  return (
    <li className="fact">
      <p>
        {isDisputed && <strong style={{ color: "red" }}>[⛔ Disputed] </strong>}
        {currentFact.text}
        <a
          className="source"
          href={currentFact.source}
          target="_blank"
          rel="noopener noreferrer"
        >
          (Source)
        </a>
      </p>
      <span
        className="tag"
        style={{
          backgroundColor: CATEGORIES.find(
            (cat) => cat.name === currentFact.category
          )?.color,
        }}
      >
        {currentFact.category}
      </span>

      <div className="vote-buttons">
        <button
          onClick={() => handleVote("votesInteresting")}
          disabled={isUpdating}
        >
          👍 {currentFact.votesInteresting}
        </button>
        <button
          onClick={() => handleVote("votesMindblowing")}
          disabled={isUpdating}
        >
          🤯 {currentFact.votesMindblowing}
        </button>
        <button onClick={() => handleVote("votesFalse")} disabled={isUpdating}>
          ⛔ {currentFact.votesFalse}
        </button>
      </div>
    </li>
  );
}

export default App;
