# Brag Plan: Production Readiness Checklist

## What is this app?
A free single-file checklist of 115 production concerns for architects, with a browse mode and a read-only agent review mode for Claude Code.

## The angle
Quiet, confident product film for LinkedIn architects. The page's own neo-brutalist look (thick outlines, hard shadows) is the visual hook. The claim is the page's own: "Know what your architecture is missing before go-live".

## Hook (0-3.6s)
The H1 lands whole on a hard-shadowed card: "Know what your architecture is missing before go-live".

## Key moments
- Counter ticks to 115 while the 10 category tiles pop in one by one (real category names, real hues).
- A real concern (Retries) opens: review question and trade-off, then a status is chosen (decided / deferred / missing).
- Agent review: rules ("read-only", "cannot_determine instead of guessing") and findings that cite file and line.

## Outro / punchline
"Free. One HTML file. No external requests." Then the name and URL.

## User flow worth showing
Browse (pick a category) -> open a concern and mark it -> run the agent review and read findings with evidence.

## Tone
- Preset: polished
- Creative direction: quiet premium product film, with the page's neo-brutalist cards
- Interpretation: few scenes, long readable holds, soft crossfades/slides, restrained SFX.

## Format: square - 1080x1080 (best in the LinkedIn feed)
## Duration: 21s

## Visual identity (from the project)
- Background: #F6F8FA (surface #FFFFFF)
- Accent: #0B6E78 (accent bg #DDF1F2)
- Text: #16212B (secondary #52606D), outline #1B2733
- Display font: system-ui stack (Segoe UI on this machine)
- Body font: system-ui; mono: ui-monospace/Consolas
- Strongest visual element: thick 2px outline cards with hard offset shadow, hue-tinted category pills

## Share copy (draft)
I built a free checklist of 115 production concerns for architects, plus a read-only Claude Code review mode that cites file and line.

## Audio direction
- Role: sparse professional accents
- Music: happy-beats-business-moves-vol-12 (steady and clean)
- Music treatment: starts 0s, volume 0.30, fade out last 1.5s
- Music cue guidance: preset read, ~110 BPM. Strong cues 8.74s, 13.11s, 17.47s. Beat grid 0.56, 1.09, 1.64 ... (every ~0.55s).
- Audio-reactive treatment: subtle; bass/RMS breathes the card shadow glow. No visualizer.
- SFX posture: sparse, motion-matched
- Audio-coupled moments: category tiles (drop sounds, every other beat), status click, final reveal
- Restraint rule: nothing loud, no sound on every text line

## Storyboard

### Scene 1 - Hook - 3.6s
Card with H1 verbatim, held ~2.5s settled (9 words).
Sequential/interaction: none
Audio intent: calm start
Transition mood: soft crossfade -> Scene 2

### Scene 2 - 115 concerns - 4.8s
Counter 0->115 "production concerns". 10 category tiles arrive one by one (name only, hue colored); tiles on every other beat, full set held 1.5s.
Sequential/interaction: yes - tiles one by one
Audio intent: light rhythmic drops
Transition mood: slide -> Scene 3

### Scene 3 - Open a concern - 5s
Retries concern card: review question and trade-off verbatim. Cursor clicks "Decided"/"Deferred"/"Missing" chip row, selects "Deferred".
Sequential/interaction: yes - simulated click
Audio intent: click
Transition mood: soft wipe -> Scene 4

### Scene 4 - Agent review - 4.6s
Terminal-like panel: "Read-only. Never runs anything. cannot_determine instead of guessing." Three findings rows with status chips (sample, fictional file paths).
Sequential/interaction: yes - rows land one by one, each held
Audio intent: confident
Transition mood: crossfade -> Scene 5

### Scene 5 - Outro - 3s
"Free. One HTML file. No external requests." + "Production Readiness Checklist" + URL.
Audio intent: soft bell, fade out
Music mood: clean, steady
**Audio summary:** steady bed, a few drops, one click, one soft bell on the outro.
