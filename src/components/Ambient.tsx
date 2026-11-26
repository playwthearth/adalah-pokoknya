const SPECKS = [
  { left: "12%", top: "18%", size: 2, delay: "0s", duration: "11s" },
  { left: "27%", top: "64%", size: 1, delay: "2.4s", duration: "14s" },
  { left: "41%", top: "32%", size: 1.5, delay: "1.2s", duration: "12s" },
  { left: "58%", top: "76%", size: 2, delay: "3.6s", duration: "16s" },
  { left: "69%", top: "22%", size: 1, delay: "0.8s", duration: "13s" },
  { left: "82%", top: "58%", size: 1.5, delay: "4.2s", duration: "15s" },
  { left: "91%", top: "38%", size: 1, delay: "2s", duration: "12s" },
];

/**
 * Fixed decoration behind everything: slow washes of light (her hair blue and
 * the one warm note), a low horizon of cold light, a faint instrument grid,
 * drifting specks, a single pass of light down the screen, a vignette and a
 * whisper of grain. Purely visual.
 *
 * Phones get a lighter version — fewer blurred layers and a much smaller blur
 * radius, because a 110px blur on a viewport-sized element is the most
 * expensive thing here on a mobile GPU. Under 640px the washes also stop
 * drifting and the two grain layers are dropped (see the mobile block in
 * globals.css): a still wash looks the same and costs a fraction of the paint.
 */
export function Ambient() {
  return (
    <div
      aria-hidden="true"
      className="ambient pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* The two washes that carry the palette, optimized with hardware compositing. */}
      <div className="transform-gpu will-change-transform absolute -left-[18%] top-[6%] h-[52vw] w-[52vw] rounded-full bg-cyan/30 blur-[30px] [animation:drift-a_34s_ease-in-out_infinite] sm:blur-[110px]" />
      <div className="transform-gpu will-change-transform absolute -right-[14%] bottom-[2%] h-[44vw] w-[44vw] rounded-full bg-glow-warm/55 blur-[32px] [animation:drift-b_42s_ease-in-out_infinite] sm:blur-[120px]" />
      <div className="transform-gpu will-change-transform absolute left-[38%] top-[42%] hidden h-[28vw] w-[28vw] rounded-full bg-glow-pale/45 blur-[90px] [animation:drift-a_52s_ease-in-out_infinite] sm:block" />
      {/* A fourth, colder bloom high in the frame keeps the top from going flat. */}
      <div className="transform-gpu will-change-transform absolute left-[24%] -top-[16%] hidden h-[38vw] w-[46vw] rounded-full bg-glow-cold/60 blur-[120px] [animation:drift-b_60s_ease-in-out_infinite] md:block" />

      {/* The horizon: light pooled low in the room. */}
      <div className="horizon absolute inset-x-[-10%] top-[68%] hidden h-px opacity-40 sm:block" />
      <div className="horizon absolute inset-x-[-10%] top-[68%] hidden h-[2px] opacity-20 blur-[26px] sm:block" />

      <div
        className="hud-grid absolute inset-0 opacity-50"
        style={{
          maskImage:
            "radial-gradient(ellipse 82% 62% at 50% 34%, #000 10%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 82% 62% at 50% 34%, #000 10%, transparent 78%)",
        }}
      />

      {SPECKS.map((speck, index) => (
        <span
          key={index}
          className={`transform-gpu absolute rounded-full bg-ember/40 ${index > 2 ? "hidden sm:block" : ""}`}
          style={{
            left: speck.left,
            top: speck.top,
            width: speck.size,
            height: speck.size,
            animation: `drift ${speck.duration} ease-in-out ${speck.delay} infinite`,
          }}
        />
      ))}

      <div className="ambient-sweep transform-gpu will-change-transform absolute inset-x-0 h-[22vh] bg-gradient-to-b from-transparent via-cyan/25 to-transparent [animation:sweep_18s_linear_infinite]" />

      {/* Depth and texture, laid over the light rather than under it. */}
      <div className="vignette absolute inset-0" />
      <div className="grain absolute -inset-6 transform-gpu" />
    </div>
  );
}
