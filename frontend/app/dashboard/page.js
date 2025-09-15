"use client"

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import NewsCard from "../../components/NewsCard";
import Sidebar from "../../components/Sidebar";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
          if (prefs.length > 0) {
            fetchNewsForPrefs(prefs);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchNewsForPrefs = async (prefs) => {
    setLoading(true);
    let allNews = [];
    for (let cat of prefs) {
      const res = await fetch(`/api/fetchNews?category=${cat.toLowerCase()}`);
      const data = await res.json();
      if (data.articles) {
        // Add sentiment for each article
        const enriched = await Promise.all(
          data.articles.slice(0, 5).map(async (article) => {
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
    setLoading(false);
  };

  const handlePreferencesUpdate = (newPreferences) => {
    setPreferences(newPreferences);
    if (newPreferences.length > 0) {
      fetchNewsForPrefs(newPreferences);
    } else {
      setNews([]);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        onPreferencesUpdate={handlePreferencesUpdate}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">AI News Dashboard</h1>
                  <p className="text-gray-600">Stay informed with personalized news</p>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Welcome back,</p>
                  <p className="text-sm text-gray-600">{user?.displayName}</p>
                </div>
                {user?.photoURL && (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                  />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {preferences.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No preferences selected</h3>
                <p className="text-gray-600 mb-6">
                  Choose your news categories from the sidebar to get started with personalized news.
                </p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Select Preferences
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your personalized news...</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Personalized News</h2>
                <p className="text-gray-600">
                  Showing articles from {preferences.length} selected {preferences.length === 1 ? 'category' : 'categories'}
                </p>
              </div>
              
              {news.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {news.map((article, idx) => (
                    <NewsCard key={idx} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                  <p className="text-gray-600">
                    We couldn't find any articles for your selected categories. Try selecting different preferences.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
