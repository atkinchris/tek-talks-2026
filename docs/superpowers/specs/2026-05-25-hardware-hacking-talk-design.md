# Hardware Hacking Talk - Presentation Design Spec

## Overview

A 30-minute talk introducing hardware hacking to an engineering community (~100 people: engineers of all levels, PMs, designers, managers). Based on the speaker's own experience across three escalating devices from the same manufacturer.

**Arrow (the one thing the audience remembers):** Curiosity and persistence are the keys to understanding any system.

**Tone:** Playful and accessible, with narrative authenticity. The audience should leave thinking "I could try this" or "so that's how that works" - not feeling they need to memorise technical detail.

## Narrative structure: "Three Locks"

Each device is a lock to pick, with escalating difficulty. Educational asides are framed as tools you pick up along the way - each concept has immediate payoff. The audience experiences the same loop three times: be curious, learn a concept, apply it, break through.

### Internal rhythm for each device

1. Meet the device (photo, why it's interesting)
2. Recon (what do we know, how do we learn more)
3. Aside (learn the concept we need)
4. Apply it (use the concept to make progress)
5. The win (we got the key / broke through)
6. How could they have done better? (brief, sets up next device)

## Talk structure and timing

| Section | Time | Approx slides |
|---|---|---|
| Opening - childhood curiosity | 2 min | 2-3 |
| Ground rules | 1 min | 1 |
| Device 1 - the cheap console | 10 min | 8-12 |
| Device 2 - the expensive console | 8 min | 6-8 |
| Device 3 - the signed console | 7 min | 6-8 |
| Close - security trade-offs | 2 min | 2-3 |
| **Total** | **30 min** | **25-35** |

## Section details

### Opening (2 min)

- Open with a visual of a taken-apart toy - something immediately relatable.
- "When I was a kid, I used to take things apart to see how they worked."
- Bridge to career: this curiosity never stopped, it just found new targets.
- Frame what's coming: "Three devices I took apart, each harder than the last. Same approach every time - be curious, be persistent."

### Ground rules (1 min)

- One slide, three rules:
  1. Only devices you personally own
  2. Never interfere with others' devices or experiences
  3. For learning, not piracy or profit
- Matter-of-fact tone, not preachy. Then move on.

### Device 1: The cheap console (10 min)

**Meet the device (1 min):**
- Photo of the device. Cheap handheld, preloaded with games, runs Linux.
- Brief mention of DFU mode - a recovery mode that already tells us something.

**Recon and disassembly (1 min):**
- How you approach a new device: what can we learn from the outside? Open it up.
- Photo of the PCB. "I spotted something interesting..."

**Aside - UART (2.5 min):**
- What is UART: a simple serial communication protocol, two wires for sending and receiving.
- How to spot it on a PCB: visual guide using the real photo, annotating the pins.
- Why it exists: manufacturers use it for debugging during development, often leave pads on production boards.
- High level how it works: baud rate, TX/RX, cheap USB adapter.

**Apply it (1.5 min):**
- Connect UART, get a U-Boot shell. Static terminal output on slide.
- Confirm it's Linux. Dump the firmware - surface to explore and safety net for rollback.
- DFU/maskrom mode means bricking is very hard if you have the MMC image.

**Aside - reverse engineering, Binwalk, and entropy (3 min):**
- Compiled code becomes assembly in binaries. Tools like Ghidra can disassemble binaries to understand original code.
- Binwalk: analyses binary files, identifies what's inside (filesystems, kernels, compressed data).
- Entropy: visual concept. Low entropy means readable/structured data, high entropy means compressed or encrypted. Clear visual diagram.
- Apply Binwalk to the firmware: rootfs is encrypted (high entropy). But we can extract the kernel from the boot partition.

**Apply it - Ghidra (1.5 min):**
- Compare extracted kernel against a known Linux kernel in Ghidra.
- Find the differences: custom SquashFS encryption implementation, and the key baked into the code.

**The win (0.5 min):**
- "We have the key." Decrypt and repack the rootfs. First lock picked.
- How could they have done better? A secure element to store the key - but that costs money per unit on a cheap device. Trade-off.

### Device 2: The expensive console (8 min)

**Meet the device (0.5 min):**
- Photo. Same manufacturer, more expensive. Hardware encryption - key in secure registers, not in the firmware.

**Recon (1 min):**
- Same approach: dump firmware, Binwalk. Encrypted rootfs, but no key in the kernel.
- Key is read from secure registers at runtime. We need to run code on the device to extract it.

**Aside - exception levels (2.5 min):**
- Visual explanation of processor privilege levels as layers. User-land processes run at a lower privilege level and cannot access secure hardware registers.
- The kernel runs at a higher privilege level and can access everything beneath it. Secure registers are only accessible from the kernel layer.
- This is why we cannot just write a normal program to read the key. We need kernel-level access.

**The approach (1.5 min):**
- No boot chain verification, so we can tamper with the kernel on disk. Patch out the kernel's code-signing checks so it will accept unsigned modules.
- But we still only have user-level access at runtime. Things like the passwd file are in the encrypted rootfs, so we cannot just log in as root.
- Recon the firmware for attack surface: find an old kernel version with a known CVE that allows privilege escalation.

**Apply it (1.5 min):**
- Exploit the CVE to escalate from user level to kernel level at runtime.
- Load a custom kernel module (now permitted, since we patched out signing) that reads the key from secure registers.

**The win (1 min):**
- Second lock picked.
- How could they have done better? Keep the kernel updated, and verify the boot chain so tampering with the kernel on disk is not possible. Trade-off: updates cost development time and testing.

### Device 3: The signed console (7 min)

**Meet the device (0.5 min):**
- Photo. Different console, same manufacturer, same hardware as device 2.
- "This time, they've done what we said they should - there's a proper signed bootloader chain."

**Aside - signed bootloader chains (2.5 min):**
- Visual chain of trust: ROM verifies bootloader, bootloader verifies kernel, kernel verifies rootfs.
- Asymmetric cryptography at a high level: manufacturer has a private key, device has the public key. Bootloader is signed with the private key, device checks the signature with the public key.
- Walk through the chain visually. If any link fails verification, the device refuses to boot.
- "We can't tamper with the kernel on disk any more. The boot chain catches it."

**The wall (0.5 min):**
- Previous approach is blocked. We need to find something that happens outside the signed chain.

**Recon (0.5 min):**
- Look at what is not covered by signing. Splash logos - branding images loaded during boot. Processed by the bootloader but not part of the signed chain.

**Aside - fuzzing (2 min):**
- What is fuzzing: throwing enormous amounts of random or semi-random input at software to find crashes.
- AFL (American Fuzzy Lop): does this intelligently - mutates inputs, tracks which code paths they exercise, steers towards unexplored territory.
- "We pointed AFL at the bootloader's splash logo parser."

**Apply it - TOCTOU (1 min):**
- Found a memory overflow in the logo parser.
- Overwrite instructions after the bootloader chain has been verified, but before the verified code executes. A time-of-check to time-of-use (TOCTOU) attack.
- Brief visual: the chain checks everything, says "all good", then we rewrite what it just approved before it runs.

**The win (0.5 min):**
- Third lock picked. Run unsigned code, extract key from secure registers.

### Close (2 min)

**Security is a trade-off against risk (1.5 min):**
- These manufacturers sell hundreds of thousands of units. Only a handful of people are doing what we just walked through.
- Device 1: a secure element costs real money per unit, multiplied across hundreds of thousands of devices, to protect against a few hobbyists. Not a good trade.
- Device 2: development cost of keeping the kernel patched and verifying the boot chain outweighs the risk from a few curious people.
- Device 3: some hackers turned their skills towards piracy. The risk equation shifted - a real commercial threat. That triggered the investment in a proper signed boot chain.
- "They didn't get more secure because they got smarter. They got more secure because the risk justified the cost."

**Cat and mouse (0.5 min):**
- The arms race continues, driven by economics as much as technology.
- End clean. No closing slide - take questions verbally.

## Visual design

### Style: clean and light

- Light background (white/light grey)
- Sans-serif typeface for all text
- Blue and red as primary accent colours
- Real photographs for devices and PCB
- Diagrams and illustrations for concepts (not screenshots)
- Dark terminal blocks inset on light slides for command output
- Monospace typeface only for actual code/commands

### Slide types

1. **Title slides** - section openers with device photo and short label (e.g. "Lock 1: The cheap console")
2. **Photo slides** - real photos (devices, PCB) with minimal annotation
3. **Concept diagrams** - aside visuals (UART pinout, entropy graph, exception levels, bootloader chain, fuzzing)
4. **Process/step slides** - what you did (Binwalk output structure, Ghidra comparison, "found the key")
5. **Terminal output slides** - static command output in dark terminal blocks inset on light background
6. **Text statement slides** - minimal text for key points (ground rules, "we have the key", closing points)

### Aspect ratio

16:9 widescreen, matching PowerPoint default.

## Available assets

- Photographs of all three devices
- Photograph of device 1 PCB showing UART port
- All other visuals (diagrams, terminal output, concept illustrations) to be created as part of the HTML slides

## Implementation approach

- Each slide is a standalone HTML file at 16:9 aspect ratio
- Screenshots of HTML slides are taken and manually assembled into a PowerPoint deck
- Need a workflow/tooling for consistent HTML-to-image conversion
