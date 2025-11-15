// const baseURL = "http://localhost:4000";

// export async function fetchHistory(token: string) {
//   const res = await fetch(`${baseURL}/generations?limit=5`, {
//     headers: {
//       Authorization: `Bearer ${token}`
//     }
//   });

//   if (!res.ok) {
//     throw new Error("Failed to fetch generations");
//   }

//   return res.json();
// }

export async function fetchHistory(token: string) {
    // TEMP MOCK — will be replaced when backend is ready
    return Promise.resolve([
      {
        id: "1",
        imageUrl: "https://via.placeholder.com/150",
        prompt: "Red dress photoshoot",
        style: "studio",
        createdAt: new Date().toISOString()
      }
    ]);
  }
  