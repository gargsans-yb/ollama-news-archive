import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.scss";

function App() {
  const CATEGORIES = [
    "IMPACT",
    "WORLDPOST",
    "MEDIA",
    "THE WORLDPOST",
    "STYLE & BEAUTY",
    "PARENTING",
    "BUSINESS",
    "FIFTY",
    "ARTS & CULTURE",
    "HEALTHY LIVING",
    "QUEER VOICES",
    "COMEDY",
    "WEDDINGS",
    "LATINO VOICES",
    "SCIENCE",
    "WORLD NEWS",
    "GREEN",
    "SPORTS",
    "PARENTS",
    "STYLE",
    "ENTERTAINMENT",
    "U.S. NEWS",
    "MONEY",
    "TRAVEL",
    "BLACK VOICES",
    "COLLEGE",
    "ARTS",
    "RELIGION",
    "CRIME",
    "WOMEN",
    "EDUCATION",
    "GOOD NEWS",
    "ENVIRONMENT",
    "WEIRD NEWS",
    "CULTURE & ARTS",
    "WELLNESS",
    "POLITICS",
    "HOME & LIVING",
    "TASTE",
    "FOOD & DRINK",
    "TECH",
  ];

  const [category, setCategory] = useState("SPORTS");
  const [prompt, setPrompt] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  async function handleSubmit(e) {
    e.preventDefault();
    const resp = await fetch(`/api/search?q=${prompt}&category=${category}`);
    const json = await resp.json();
    console.log(json);
    setSearchResults(json.data);
  }
  return (
    <div>
      <header className="header">
        <img src="/news-icon.png" alt="news icon" height={40} width={40} />
        <div className="header-text">YugaNews Archives</div>
      </header>
      <div>
        <form className="search-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <select
            className="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            name="category"
            id="category"
          >
            {CATEGORIES.sort((a, b) => {
              return a.localeCompare(b);
            }).map((cat) => {
              return <option value={cat}>{cat.toLowerCase()}</option>;
            })}
          </select>
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="news-stories-wrapper">
        {searchResults.map((story) => {
          return (
            <>
              <div className="news-story">
                <div className="headline">{story.headline}</div>
                <a className="link" href={story.link} target="_blank">
                  <img src="/news-icon.png" alt="" />
                </a>
              </div>
              <div className="description">{story.short_description}</div>
            </>
          );
        })}
      </div>
    </div>
  );
}

export default App;
