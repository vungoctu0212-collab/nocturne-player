(() => {
  const $ = id => document.getElementById(id);
  const audio = $("audio"), video = $("video");
  const dbName = "NocturneLibrary", storeName = "tracks";
  let db, tracks = [], currentIndex = -1, currentURL = null, shuffle = false, repeat = false, toastTimer;

  function notify(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(storeName, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
  }
  function transaction(mode="readonly") { return db.transaction(storeName, mode).objectStore(storeName); }
  function getAll() {
    return new Promise((resolve, reject) => {
      const req = transaction().getAll(); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
  }
  function put(track) {
    return new Promise((resolve, reject) => {
      const req = transaction("readwrite").put(track); req.onsuccess = resolve; req.onerror = () => reject(req.error);
    });
  }
  function remove(id) {
    return new Promise((resolve, reject) => {
      const req = transaction("readwrite").delete(id); req.onsuccess = resolve; req.onerror = () => reject(req.error);
    });
  }
  const videoExtensions = /\.(mp4|m4v|mov|webm|3gp|3g2|avi|mkv)$/i;
  const audioExtensions = /\.(mp3|m4a|aac|wav|aiff?|caf|flac|ogg|opus|alac)$/i;
  const isVideo = t => (t.type || "").startsWith("video/") || videoExtensions.test(t.name || "");
  const isSupportedFile = f => (f.type || "").startsWith("audio/") || (f.type || "").startsWith("video/") || audioExtensions.test(f.name || "") || videoExtensions.test(f.name || "");
  const fmt = seconds => {
    if (!Number.isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60), s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2,"0")}`;
  };
  function safeTitle(name) { return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "); }

  async function refresh() {
    tracks = await getAll();
    tracks.sort((a,b) => a.added - b.added);
    $("trackCount").textContent = `${tracks.length} TỆP`;
    $("emptyState").style.display = tracks.length ? "none" : "flex";
    $("trackList").innerHTML = "";
    tracks.forEach((track, index) => {
      const row = document.createElement("div");
      row.className = "track-row" + (index === currentIndex ? " current" : "");
      const thumb = document.createElement("div"); thumb.className = "track-thumb"; thumb.textContent = isVideo(track) ? "▣" : "♫";
      const text = document.createElement("div"); text.className = "track-text";
      const name = document.createElement("div"); name.className = "track-name"; name.textContent = safeTitle(track.name);
      const sub = document.createElement("div"); sub.className = "track-sub"; sub.textContent = `${isVideo(track) ? "VIDEO · ÂM THANH" : "AUDIO"} · ${fmt(track.duration || 0)}`;
      text.append(name, sub);
      const play = document.createElement("button"); play.className = "track-play"; play.textContent = index === currentIndex && !activeMedia().paused ? "Ⅱ" : "▶"; play.setAttribute("aria-label","Phát tệp"); play.onclick = () => playIndex(index);
      const del = document.createElement("button"); del.className = "remove-track"; del.textContent = "×"; del.setAttribute("aria-label","Xóa tệp"); del.onclick = async () => {
        if (index === currentIndex) stopCurrent();
        else if (index < currentIndex) currentIndex--;
        await remove(track.id); await refresh(); notify("Đã xóa khỏi thư viện");
      };
      row.append(thumb,text,play,del); $("trackList").append(row);
    });
  }
  function activeMedia() { return currentIndex >= 0 && isVideo(tracks[currentIndex]) ? video : audio; }
  function stopCurrent() {
    audio.pause(); video.pause(); audio.removeAttribute("src"); video.removeAttribute("src"); audio.load(); video.load();
    if (currentURL) URL.revokeObjectURL(currentURL); currentURL = null; currentIndex = -1;
    $("nowTitle").textContent = "Chưa có bài hát"; $("nowMeta").textContent = "Chọn tệp để bắt đầu";
    $("playState").textContent = "SẴN SÀNG"; $("playBtn").textContent = "▶";
    $("seek").value = 0; $("currentTime").textContent = "0:00"; $("duration").textContent = "0:00";
  }
  async function playIndex(index) {
    if (!tracks.length) return notify("Hãy thêm nhạc hoặc video trước");
    index = (index + tracks.length) % tracks.length;
    if (currentURL) URL.revokeObjectURL(currentURL);
    audio.pause(); video.pause();
    currentIndex = index;
    const track = tracks[index], media = isVideo(track) ? video : audio;
    currentURL = URL.createObjectURL(track.blob);
    media.src = currentURL; media.volume = Number($("volume").value);
    $("nowTitle").textContent = safeTitle(track.name);
    $("nowMeta").textContent = isVideo(track) ? "Video · chỉ phát âm thanh" : "Tệp âm thanh";
    $("playState").textContent = "ĐANG TẢI"; $("playBtn").textContent = "Ⅱ";
    updateMediaSession(track);
    await refresh();
    try { await media.play(); $("playState").textContent = "ĐANG PHÁT"; }
    catch (e) { $("playState").textContent = "CHƯA PHÁT"; $("playBtn").textContent = "▶"; notify("Chạm nút phát để bắt đầu âm thanh"); }
  }
  function updateMediaSession(track) {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: safeTitle(track.name), artist: "Nocturne Library", album: "Nocturne Player" });
      navigator.mediaSession.setActionHandler("play", () => activeMedia().play());
      navigator.mediaSession.setActionHandler("pause", () => activeMedia().pause());
      navigator.mediaSession.setActionHandler("previoustrack", previous);
      navigator.mediaSession.setActionHandler("nexttrack", next);
      navigator.mediaSession.setActionHandler("seekto", d => { if (d.seekTime != null && Number.isFinite(activeMedia().duration)) activeMedia().currentTime = d.seekTime; });
    } catch (_) {}
  }
  function next() {
    if (currentIndex < 0) return;
    let i = currentIndex + 1;
    if (shuffle && tracks.length > 1) { do { i = Math.floor(Math.random()*tracks.length); } while (i === currentIndex); }
    if (i >= tracks.length) { if (repeat) i = 0; else { stopCurrent(); refresh(); return; } }
    playIndex(i);
  }
  function previous() {
    if (currentIndex < 0) return;
    const media = activeMedia();
    if (media.currentTime > 3) { media.currentTime = 0; return; }
    let i = currentIndex - 1;
    if (i < 0) i = repeat ? tracks.length - 1 : 0;
    playIndex(i);
  }
  async function importFiles(fileList) {
    const selected = Array.from(fileList || []).filter(isSupportedFile);
    if (!selected.length) return notify("Không tìm thấy tệp âm thanh hoặc video phù hợp");
    let added = 0, failed = 0;
    for (const file of selected) {
      try {
        const id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
        const guessedVideo = videoExtensions.test(file.name || "");
        const guessedAudio = audioExtensions.test(file.name || "");
        const type = file.type || (guessedVideo ? "video/mp4" : guessedAudio ? "audio/mpeg" : "application/octet-stream");
        const item = { id, name:file.name || `Tệp ${added+1}`, type, size:file.size, blob:file, added:Date.now()+added, duration:0 };
        await put(item); added++;
      } catch (err) { failed++; }
    }
    await refresh();
    notify(failed ? `Đã thêm ${added} tệp; ${failed} tệp không lưu được (có thể thiếu dung lượng)` : `Đã thêm ${added} tệp vào thư viện`);
    $("fileInput").value = "";
    if (currentIndex < 0 && tracks.length) {
      $("nowTitle").textContent = safeTitle(tracks[0].name);
      $("nowMeta").textContent = isVideo(tracks[0]) ? "Video · chỉ phát âm thanh" : "Tệp âm thanh";
      await refresh();
      notify("Đã sẵn sàng — chạm nút phát để nghe");
    }
  }
  $("addBtn").onclick = $("importBtn").onclick = () => $("fileInput").click();
  $("fileInput").onchange = e => importFiles(e.target.files);
  $("playBtn").onclick = async () => {
    if (currentIndex < 0) return tracks.length ? playIndex(0) : notify("Hãy thêm nhạc trước");
    const m = activeMedia(); if (m.paused) { try { await m.play(); } catch (_) { notify("Chạm phát lại để tiếp tục"); } } else m.pause();
  };
  $("nextBtn").onclick = next; $("prevBtn").onclick = previous;
  $("shuffleBtn").onclick = () => { shuffle = !shuffle; $("shuffleBtn").classList.toggle("active",shuffle); notify(shuffle ? "Đã bật phát ngẫu nhiên" : "Đã tắt phát ngẫu nhiên"); };
  $("repeatBtn").onclick = () => { repeat = !repeat; $("repeatBtn").classList.toggle("active",repeat); notify(repeat ? "Đã bật lặp danh sách" : "Đã tắt lặp danh sách"); };
  $("volume").oninput = e => { audio.volume = video.volume = Number(e.target.value); $("volumeLabel").textContent = `${Math.round(e.target.value*100)}%`; };
  $("seek").oninput = e => { const m = activeMedia(); if (Number.isFinite(m.duration)) m.currentTime = Number(e.target.value)/1000*m.duration; };
  [audio,video].forEach(m => {
    m.addEventListener("ended", next);
    m.addEventListener("play", () => { $("playBtn").textContent = "Ⅱ"; $("playState").textContent = "ĐANG PHÁT"; refresh(); });
    m.addEventListener("pause", () => { if (currentIndex >= 0) { $("playBtn").textContent = "▶"; $("playState").textContent = "TẠM DỪNG"; refresh(); } });
    m.addEventListener("timeupdate", () => {
      if (m !== activeMedia()) return;
      if (Number.isFinite(m.duration) && m.duration > 0) $("seek").value = Math.round(m.currentTime/m.duration*1000);
      $("currentTime").textContent = fmt(m.currentTime); $("duration").textContent = fmt(m.duration);
      if ("mediaSession" in navigator && Number.isFinite(m.duration)) {
        try { navigator.mediaSession.setPositionState({ duration:m.duration, playbackRate:m.playbackRate, position:m.currentTime }); } catch (_) {}
      }
    });
    m.addEventListener("loadedmetadata", async () => {
      if (m !== activeMedia() || currentIndex < 0) return;
      tracks[currentIndex].duration = m.duration || 0; await put(tracks[currentIndex]); await refresh();
      $("duration").textContent = fmt(m.duration);
    });
  });
  document.addEventListener("visibilitychange", () => {
    // Do not pause playback when the app is backgrounded or the screen is locked.
  });
  (async () => {
    try {
      db = await openDB(); await refresh();
      if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
    } catch (e) { notify("Không mở được thư viện lưu trữ trên trình duyệt"); }
  })();
})();