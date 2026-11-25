# Music

`Am I Bothering You - Reality Club.m4a` is the song the player opens with.
Other audio files can sit in this folder too, but only the ones registered in
`src/data/playlist.ts` are listed.

To add a song:

1. Drop your audio file here (`.mp3`, `.m4a`, `.ogg` and `.wav` all work).
2. Register it in `src/data/playlist.ts`:

```ts
{
  id: "our-song",
  title: "Song title",
  artist: "Artist",
  src: "/assets/music/our-song.mp3",
}
```

Only use music you have the right to use.
