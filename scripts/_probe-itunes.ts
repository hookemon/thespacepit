const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

async function probe(artist: string) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=musicArtist&limit=5`;
  const res = await fetch(url, { headers: { "user-agent": UA } });
  const text = await res.text();
  console.log(`\n=== ${artist} === status=${res.status} len=${text.length}`);
  console.log(text.slice(0, 600));
}

async function main() {
  await probe("Danny Brown");
  await probe("Azealia Banks");
  await probe("El-P");
  await probe("Action Bronson");
}
main().catch(console.error);
