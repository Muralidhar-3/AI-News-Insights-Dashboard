"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const categories = ["Finance", "Technology", "Crypto", "AI", "Sports", "Health"];

export default function Preferences() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);

        // Load saved preferences
        const docRef = doc(db, "users", u.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSelected(snap.data().preferences || []);
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const toggleCategory = (cat) => {
    if (selected.includes(cat)) {
      setSelected(selected.filter((c) => c !== cat));
    } else {
      setSelected([...selected, cat]);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    await setDoc(docRef, { preferences: selected }, { merge: true });
    router.push("/dashboard"); // Go back to dashboard
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Select Your News Preferences</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`px-4 py-2 rounded-lg border ${
              selected.includes(cat)
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-black"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <button
        onClick={savePreferences}
        className="bg-green-500 text-white px-6 py-2 rounded-lg"
      >
        Save Preferences
      </button>
    </div>
  );
}
