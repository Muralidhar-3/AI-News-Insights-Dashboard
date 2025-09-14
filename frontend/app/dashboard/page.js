"use client"

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import NewsCard from "../../components/NewsCard";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState([]);
  const [news, setNews] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);

        // Load preferences
        const docRef = doc(db, "users", u.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const prefs = snap.data().preferences || [];
          setPreferences(prefs);

          // Fetch news for each preference
          fetchNewsForPrefs(prefs);
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchNewsForPrefs = async (prefs) => {
    let allNews = [];
    for (let cat of prefs) {
      const res = await fetch(`/api/fetchNews?category=${cat.toLowerCase()}`);
      const data = await res.json();
      if (data.articles) {
        // Add sentiment for each article
        const enriched = await Promise.all(
          data.articles.map(async (article) => {
            try {
              const sentimentRes = await fetch("/api/sentiment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: article.title || article.description }),
              });
              const sentimentData = await sentimentRes.json();

              let sentiment = "Neutral";
              if (Array.isArray(sentimentData) && sentimentData[0]) {
                sentiment = sentimentData[0][0].label;
              }

              return { ...article, sentiment };
            } catch {
              return { ...article, sentiment: "Unknown" };
            }
          })
        );
        allNews = [...allNews, ...enriched];
      }
    }
    setNews(allNews);
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.displayName}</h1>
        <h1 className="text-2xl font-bold mb-4">Your Personalized News</h1>
        <button
          onClick={() => router.push("/preferences")}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Edit Preferences
        </button>

        <button
          onClick={() => signOut(auth)}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow-lg rounded-xl p-4">News Feed Placeholder</div>
        <div className="bg-white shadow-lg rounded-xl p-4">Trends Placeholder</div>
      </div> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.length > 0 ? (
          news.map((article, idx) => (
            <NewsCard key={idx} article={article} />
          ))
        ) : (
          <p>No news found for your preferences.</p>
        )}
      </div>
    </div>
  );
}
