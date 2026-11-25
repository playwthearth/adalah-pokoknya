# Music

This folder holds the ten songs listed in `src/data/playlist.ts`. The first one,
`Am I Bothering You - Reality Club.m4a`, is what a signed-in visitor hears on
arrival. Other files can sit here too, but only the ones registered in the
playlist are listed.

To add a song:

1. Drop your audio file here (`.mp3`, `.m4a`, `.ogg` and `.wav` all work).
2. Register it in `src/data/playlist.ts`:

```ts
{
  id: "our-song",
  title: "Song title",
  artist: "Artist",
  src: song("our-song.mp3"),
}
```

`song()` escapes spaces and Japanese characters so browsers can request the
file. Only use music you have the right to use.
