"use client";

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
      allNews = [...allNews, ...data.articles];
    }
  }
  setNews(allNews);
};


  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Personalized News</h1>
      <button
        onClick={() => router.push("/preferences")}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg mb-4"
      >
        Edit Preferences
      </button>

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
