// Video covers (vision page): the poster with our play button and title until the first
// click, then the browser's own player, playing with sound. The markup ships with native
// controls and the cover hidden, so without this script the videos still play.
document.querySelectorAll("[data-video]").forEach((box) => {
  const video = box.querySelector("video");
  const cover = box.querySelector(".vision-video-cover");
  if (!video || !cover) return;

  video.controls = false;
  video.tabIndex = -1; // the cover button is the one control until playback starts
  cover.hidden = false;

  cover.addEventListener("click", () => {
    cover.hidden = true;
    video.controls = true;
    video.removeAttribute("tabindex");
    video.focus({ preventScroll: true });
    video.play().catch(() => {
      // Playback refused (e.g. data saver): leave the native controls to start it
    });
  });
});

// Only one video plays at a time
const videos = document.querySelectorAll("[data-video] video");
videos.forEach((video) =>
  video.addEventListener("play", () =>
    videos.forEach((other) => other !== video && other.pause()),
  ),
);
