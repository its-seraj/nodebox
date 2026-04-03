const BASE = () => window._env_?.CODE_SNIPPETS_BACKEND + "/nodebox" ?? "";

export async function saveScript(name, code) {
  const res = await fetch(`${BASE()}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, code }),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return res.json();
}

export async function getScripts() {
  const res = await fetch(`${BASE()}/get`);
  if (!res.ok) throw new Error(`Failed to load scripts: ${res.status}`);
  return res.json(); // expected: [{ name }] or [string]
}

export async function loadScript(name) {
  const res = await fetch(`${BASE()}/load`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Load failed: ${res.status}`);
  return res.json(); // expected: { name, code }
}
