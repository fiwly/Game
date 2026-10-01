# NEON QUEST 3D

A procedural 3D action RPG that runs directly in a modern browser.

## What is included

- Real-time 3D world rendered with Three.js
- Third-person-style exploration camera
- Melee combat, area skill and dodge/invulnerability
- Three enemy archetypes: Slime, Brute and Archer
- Ruin Guardian boss with an enraged phase
- XP, levels, coins and permanent upgrades
- Loot drops and a shop
- Quest progression and a chapter-complete state
- Auto-save with browser localStorage
- iPad/iPhone touch joystick and large combat buttons
- Keyboard controls for desktop
- Fullscreen button
- Procedural geometry and Web Audio effects, so the game does not depend on copyrighted game assets

## Controls

**Desktop**
- WASD / Arrow Keys — move
- J / Enter / left click — attack
- K — Arc Nova skill
- Space — dodge
- Esc — pause

**Touch**
- Left virtual joystick — move
- ATTACK — melee attack
- SKILL — area attack
- DODGE — dodge roll

## Play

Open the GitHub Pages site after Pages is enabled for the main branch from the repository root.

The game is intentionally built as a static site, so it can run on GitHub Pages without a paid server.

## Technical note

The renderer uses Three.js WebGL and all game-world geometry is generated at runtime. Progress is stored locally in the current browser/device; it is not a cloud save.
