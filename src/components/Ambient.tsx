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
 * the one warm note), a faint instrument grid, drifting specks and a single
 * pass of light that travels down the screen. Purely visual.
 *
 * Phones get a lighter version — fewer blurred layers and a much smaller blur
 * radius, because a 110px blur on a viewport-sized element is the most
 * expensive thing here on a mobile GPU.
 */
export function Ambient() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -left-[18%] top-[6%] h-[52vw] w-[52vw] rounded-full bg-cyan/30 blur-[48px] [animation:drift-a_30s_ease-in-out_infinite] will-change-transform sm:blur-[110px]" />
      <div className="absolute -right-[14%] bottom-[2%] h-[44vw] w-[44vw] rounded-full bg-[#f9e6e5]/55 blur-[52px] [animation:drift-b_38s_ease-in-out_infinite] will-change-transform sm:blur-[120px]" />
      <div className="absolute left-[38%] top-[42%] hidden h-[28vw] w-[28vw] rounded-full bg-[#dbe8f1]/45 blur-[90px] [animation:drift-a_44s_ease-in-out_infinite] will-change-transform sm:block" />

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
          className={`absolute rounded-full bg-ember/40 ${index > 2 ? "hidden sm:block" : ""}`}
          style={{
            left: speck.left,
            top: speck.top,
            width: speck.size,
            height: speck.size,
            animation: `drift ${speck.duration} ease-in-out ${speck.delay} infinite`,
          }}
        />
      ))}

      <div className="absolute inset-x-0 h-[22vh] bg-gradient-to-b from-transparent via-cyan/25 to-transparent will-change-transform [animation:sweep_16s_linear_infinite]" />
    </div>
  );
}
