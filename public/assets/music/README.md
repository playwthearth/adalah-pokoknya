# Music

The three `placeholder-*.wav` files are generated ambient tones, not songs.
They exist so the player has something to play.

To use your own music:

1. Drop your audio file here (`.mp3`, `.m4a`, `.ogg` and `.wav` all work).
2. Register it in `src/data/playlist.ts`:

```ts
{
  id: "track-004",
  title: "Song title",
  artist: "Artist",
  src: "/assets/music/our-song.mp3",
}
```

3. Delete the placeholder entries and the placeholder files if you don't want them.

Only use music you have the right to use.
