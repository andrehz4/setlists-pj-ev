import React, { useEffect, useState } from "react";
import { fetchFeed, fetchStories, fetchReels, fetchUsage, resetStore, poll } from "./api.js";
import UsageMeter from "./components/UsageMeter.jsx";
import Sidebar from "./components/Sidebar.jsx";
import StoriesBar from "./components/StoriesBar.jsx";
import StoryViewer from "./components/StoryViewer.jsx";
import FeedGrid from "./components/FeedGrid.jsx";
import PostModal from "./components/PostModal.jsx";
import Reels from "./components/Reels.jsx";
import FailPanel from "./components/FailPanel.jsx";
import PreviewLab from "./components/PreviewLab.jsx";

export default function App() {
  const [feed, setFeed] = useState([]);
  const [stories, setStories] = useState([]);
  const [reels, setReels] = useState([]);
  const [tab, setTab] = useState("feed");
  const [openPost, setOpenPost] = useState(null);
  const [openStory, setOpenStory] = useState(null);
  const [showFail, setShowFail] = useState(false);
  const [previewPost, setPreviewPost] = useState(null);
  const [previewStory, setPreviewStory] = useState(null);
  const [usage, setUsage] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const stop = poll(async () => {
      try {
        const [f, s, r, u] = await Promise.all([fetchFeed(), fetchStories(), fetchReels(), fetchUsage()]);
        setFeed(f); setStories(s); setReels(r); setUsage(u); setErr(null);
      } catch (e) { setErr(e.message); }
    }, 3000);
    return stop;
  }, []);

  async function reset() {
    await resetStore();
    setFeed([]); setStories([]); setReels([]);
  }

  return (
    <div className="ig">
      <Sidebar
        tab={tab}
        onTab={setTab}
        reels={reels.length}
        onFail={() => setShowFail(true)}
        onReset={reset}
      />

      <main className="ig-main">
        <div className="mock-ribbon">● control room · ambiente mock · nao toca o instagram real</div>

        {err && <div className="ig-err">sem conexao com o mock server. Rode <code>npm run mock:server</code> ({err})</div>}

        {tab === "feed" && (
          <div className="ig-col">
            {usage && <UsageMeter usage={usage} />}
            <StoriesBar stories={stories} onOpen={(i) => setOpenStory(i)} />
            <FeedGrid feed={feed} onOpen={(p) => setOpenPost(p)} />
          </div>
        )}
        {tab === "reels" && <Reels reels={reels} />}
        {tab === "lab" && (
          <PreviewLab
            onPreview={(p) => setPreviewPost(p)}
            onStory={(s) => setPreviewStory(s)}
          />
        )}
      </main>

      {openPost && <PostModal post={openPost} onClose={() => setOpenPost(null)} />}
      {openStory != null && (
        <StoryViewer stories={stories} startIndex={openStory} onClose={() => setOpenStory(null)} />
      )}
      {showFail && <FailPanel onClose={() => setShowFail(false)} />}

      {previewPost && (
        <PostModal
          post={{ type: "PREVIEW", caption: previewPost.caption, slides: [previewPost.slideUrl] }}
          onClose={() => setPreviewPost(null)}
        />
      )}
      {previewStory && (
        <StoryViewer
          stories={[{ postId: previewStory.name, videoUrl: previewStory.videoUrl }]}
          startIndex={0}
          onClose={() => setPreviewStory(null)}
        />
      )}
    </div>
  );
}
