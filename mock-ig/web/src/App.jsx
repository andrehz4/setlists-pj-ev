import React, { useEffect, useState } from "react";
import { fetchFeed, fetchStories, fetchReels, resetStore, poll } from "./api.js";
import StoriesBar from "./components/StoriesBar.jsx";
import StoryViewer from "./components/StoryViewer.jsx";
import FeedGrid from "./components/FeedGrid.jsx";
import PostModal from "./components/PostModal.jsx";
import Reels from "./components/Reels.jsx";
import FailPanel from "./components/FailPanel.jsx";

export default function App() {
  const [feed, setFeed] = useState([]);
  const [stories, setStories] = useState([]);
  const [reels, setReels] = useState([]);
  const [tab, setTab] = useState("feed");
  const [openPost, setOpenPost] = useState(null);
  const [openStory, setOpenStory] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const stop = poll(async () => {
      try {
        const [f, s, r] = await Promise.all([fetchFeed(), fetchStories(), fetchReels()]);
        setFeed(f);
        setStories(s);
        setReels(r);
        setErr(null);
      } catch (e) {
        setErr(e.message);
      }
    }, 3000);
    return stop;
  }, []);

  return (
    <div className="phone">
      <div className="badge">MOCK · nao e o Instagram real</div>

      <header className="topbar">
        <span className="brand">mock-ig</span>
        <button className="reset" onClick={async () => { await resetStore(); setFeed([]); setStories([]); }}>
          limpar
        </button>
      </header>

      {err && <div className="err">sem conexao com o mock server ({err}). Rode: npm run mock:server</div>}

      {tab === "feed" && (
        <>
          <StoriesBar stories={stories} onOpen={(i) => setOpenStory(i)} />
          <FeedGrid feed={feed} onOpen={(p) => setOpenPost(p)} />
        </>
      )}
      {tab === "reels" && <Reels reels={reels} />}

      <FailPanel />

      <nav className="tabbar">
        <button className={tab === "feed" ? "on" : ""} onClick={() => setTab("feed")}>Feed</button>
        <button className={tab === "reels" ? "on" : ""} onClick={() => setTab("reels")}>Reels{reels.length ? ` (${reels.length})` : ""}</button>
      </nav>

      {openPost && <PostModal post={openPost} onClose={() => setOpenPost(null)} />}
      {openStory != null && (
        <StoryViewer
          stories={stories}
          startIndex={openStory}
          onClose={() => setOpenStory(null)}
        />
      )}
    </div>
  );
}
