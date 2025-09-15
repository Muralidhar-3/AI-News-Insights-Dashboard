"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const categories = [
  { id: "business", name: "Business", icon: "💼" },
  { id: "technology", name: "Technology", icon: "💻" },
  { id: "science", name: "Science", icon: "🔬" },
  { id: "health", name: "Health", icon: "🏥" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "entertainment", name: "Entertainment", icon: "🎬" },
];

export default function Preferences() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);
        await loadPreferences(u);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadPreferences = async (user) => {
    try {
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const prefs = snap.data().preferences || [];
        setSelected(prefs);
      } else {
        setSelected([]);
      }
      setPreferencesLoaded(true);
    } catch (error) {
      console.error("Error loading preferences:", error);
      setSelected([]);
      setPreferencesLoaded(true);
    }
  };

  const toggleCategory = (categoryId) => {
    if (selected.includes(categoryId)) {
      setSelected(selected.filter((c) => c !== categoryId));
    } else {
      setSelected([...selected, categoryId]);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, { preferences: selected }, { merge: true });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !preferencesLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Customize Your News Feed
            </h1>
            <p className="text-lg text-gray-600">
              Select the categories you're interested in to get personalized news
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                    selected.includes(category.id)
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex-1 text-left">
                    <span className="font-semibold">{category.name}</span>
                  </div>
                  {selected.includes(category.id) && (
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {selected.length > 0 && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ {selected.length} {selected.length === 1 ? 'category' : 'categories'} selected
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={savePreferences}
                disabled={loading || selected.length === 0}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  `Save ${selected.length > 0 ? `(${selected.length})` : ''} Preferences`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}