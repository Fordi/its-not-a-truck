import { allOf, anyOf, inSrgbGamut, lightnessRange, mitchellSample, nearThemeColors, notNearColors } from "./mitchellSample.mjs";

const monthly = [[
  "#d8e4ec", // white-sky
  "#8aaaba", // sleet
  "#3a5060", // steel
  "#c0b8b0", // bare
  "#f4f0ec", // snow
], [
  "#c87aaa", // plum-bloom
  "#7a5a8a", // dusk
  "#d4b8c8", // blush
  "#4a3858", // depth
  "#f0e4ec", // tender
], [
  "#7a6050", // mud
  "#5a7a8a", // rain
  "#c8a870", // thaw
  "#3a5a3a", // shoot
  "#8a9a70", // lichen
], [
  "#e8c8d8", // blossom
  "#b0c8a0", // new-leaf
  "#d8e8f0", // sky-rain
  "#c0a8c8", // wisteria
  "#f4f0e8", // petal
], [
  "#3a8a3a", // canopy
  "#78c050", // new-growth
  "#f0d840", // sun
  "#60a8c8", // sky
  "#f8a8b0", // hawthorn
], [
  "#e85878", // rose
  "#f0b840", // solstice
  "#2a6888", // deep-sea
  "#c83858", // poppy
  "#f8e8c0", // honeyed
], [
  "#e84c1e", // blaze
  "#f0a030", // haze
  "#4a90c8", // sky
  "#b85a1a", // clay
  "#1a3a5c", // dusk
], [
  "#6b8c3a", // harvest
  "#3d6b4a", // meadow
  "#c4a060", // grain
  "#7a4a2a", // bark
  "#2a4a1e", // shade
], [
  "#c43a1a", // maple
  "#e87a2a", // ember
  "#a85a10", // acorn
  "#4a7c3a", // still-green
  "#8c6a3a", // loam
], [
  "#1a1a1a", // night
  "#c45a10", // pumpkin
  "#5a2a0a", // rot
  "#8c3a1a", // rust
  "#3a5a2a", // moss
], [
  "#c8c0b0", // bone
  "#6a7060", // bark
  "#3a3830", // earth
  "#9aaca0", // frost
  "#e8e0d4", // sky
], [
  "#0d0d1e", // solstice
  "#9a7a3a", // candle
  "#c8d8e8", // ice
  "#7a6aaa", // velvet
  "#e8d890", // star
]];

const daily = [[
  "#f8f0e0", // slow-morning
  "#e8c870", // late-breakfast
  "#7aaac8", // afternoon
  "#3a6888", // the-feeling
  "#c8a050", // nostalgia
  "#2a3040", // monday-eve
], [
  "#2a2e38", // 4am-dark
  "#5a4a38", // bad-coffee
  "#d4d8e0", // fluorescent
  "#7a8090", // resignation
  "#c8a870", // sunday-ghost
  "#e8e0d0", // pale-hope
], [
  "#8a8880", // manila
  "#b0aca4", // desk
  "#6a7060", // pavement
  "#c8c4bc", // nothing
], [
  "#2a4a3a", // fulcrum
  "#4a7a58", // midpoint
  "#8aaa80", // noon-green
  "#c8d8c0", // almost
  "#3a3a50", // not-yet
], [
  "#1e2a48", // almost
  "#c87a28", // urgency
  "#e8a840", // horizon
  "#8a6030", // effort
  "#f0c870", // nearly
], [
  "#1a2030", // 8am
  "#385080", // 10am
  "#c87830", // noon
  "#e8a040", // 2pm
  "#d8587a", // 4pm
  "#f0b8a0", // 6pm
  "#f8e0b0", // drinks
  "#fdf4e0", // yes
], [
  "#f8e8c8", // morning
  "#e8a840", // coffee
  "#4a9060", // outside
  "#60a8d8", // afternoon
  "#e05030", // spontaneous
  "#d89050", // earned
  "#1a2840", // night-out
]];

const hourly = [
  "#090914", // deep night
  "#0a0a18", // still dark
  "#0c0c20", // dead hour
  "#0f0e28", // 3am blue
  "#1a1030", // pre-dawn stir
  "#2a1840", // first blush
  "#3d2050", // civil twilight
  "#6a2a38", // sunrise red
  "#a04030", // low sun
  "#d06828", // climbing
  "#e89840", // warming
  "#f0c860", // near noon
  "#f8e870", // zenith
  "#f0d858", // past peak
  "#e8c040", // long afternoon
  "#d89838", // heavy light
  "#c07030", // descending
  "#a84828", // golden hour
  "#883858", // sunset
  "#603070", // dusk
  "#402858", // blue hour
  "#281838", // evening closes
  "#140e28", // late
  "#090914", // night again
];

const levels =
  [[
    "#d6d3c4", // linen
    "#a8a89a", // stone
    "#7a8c7e", // sage
    "#c4b99a", // wheat
    "#e8e4d9", // cream
  ], [

    "#d6d3c4", // familiar
    "#c4b99a", // home
    "#e8a23a", // spark
    "#d45f1e", // signal
    "#8c3a0e", // urgency
  ], ["#e8e4d9", // safety
    "#b4b2a9", // fog
    "#7d7c76", // doubt
    "#4a4a47", // dread
    "#c4b99a", // longing
  ], ["#7b6fa0", // wisdom
    "#c4a882", // warmth
    "#4a3f6b", // depth
    "#e8c87a", // light
    "#2e2648", // mystery
  ], ["#a8a89a", // behind
    "#5c8fa8", // passage
    "#1a5c78", // beyond
    "#0d2e3d", // unknown
    "#e8a23a", // courage
  ], ["#b84c3c", // enemy
    "#4a7c59", // ally
    "#c4822a", // test
    "#2e4a6b", // trial
    "#7a5c3a", // grit
  ], ["#1e1c2a", // void
    "#3d2a4a", // shadow
    "#6b3d5a", // fear
    "#8c5a3a", // resolve
    "#c4822a", // ember
  ], ["#0a0a0f", // abyss
    "#8c0e0e", // blood
    "#c41e1e", // crisis
    "#e85a1e", // fire
    "#f0c040", // dawn
  ], ["#e8c43a", // gold
    "#c4a020", // wealth
    "#7a9e3a", // life
    "#d4e8a0", // relief
    "#f5f0d8", // peace
  ], ["#4a7c59", // hope
    "#3d5e7a", // journey
    "#7a5c3a", // dust
    "#c43a2a", // chase
    "#e8c87a", // home
  ], ["#1a1a2e", // dark
    "#5a3a7a", // pyre
    "#c43a7a", // wound
    "#e8d0f0", // becoming
    "#f8f4ff", // reborn
  ], ["#d6d3c4", // home
    "#7a9e3a", // growth
    "#4a7c59", // healing
    "#e8c43a", // gift
    "#7b6fa0", // wisdom
  ]];


export const generateLevelColors = (level, count) => {
  const now = new Date();
  const month = monthly[now.getMonth()];
  const dayOfWeek = daily[now.getDay()];
  const timeBias = hourly[now.getHours()];
  const journey = levels[level % 12];
  const tubes = mitchellSample(count, 300, {
    valid: allOf(
      inSrgbGamut,
      lightnessRange(20, 100),
      anyOf(
        nearThemeColors([timeBias, ...month, ...dayOfWeek], 40),
        nearThemeColors([...journey], 40),
      ),
    )
  }).map(c => c.hex);
  const background = mitchellSample(4, 300, {
    valid: allOf(
      inSrgbGamut,
      lightnessRange(0, 10),
      notNearColors(tubes, 20),
      anyOf(
        nearThemeColors([timeBias, ...month, ...dayOfWeek], 40),
      ),
    )
  }).sort((a, b) => {
    return a.lab[0] - b.lab[0];
  });
  console.log(background);
  return { tubes, background: background.map(c => c.hex) };
}
