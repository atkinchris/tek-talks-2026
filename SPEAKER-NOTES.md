# Speaker Notes

Notes per slide. Not a script - prompts and key points to hit. Know the material; use these to stay on track.

---

## 00 - Let's hack a games console.

- Let this sit for a moment. Don't rush into speaking.
- "Let's hack a games console."

## 01 - opening-toy

- Personal story. Keep it warm and brief.
- "When I was a kid, I used to take things apart to see how they worked. Action Man, Furby, HitClips - anything I could get my hands on."
- The three-panel photo does the heavy lifting. Let the audience look.

## 02 - Toys had screws.Consoles had encryption.

- Transition from childhood to now.
- "That curiosity grew up. Toys had screws. Consoles had encryption."
- "Each generation of protection made the next generation of hackers more inventive."
- This is the arrow for the whole talk. Plant it here, reinforce it at the end.

## 03 - Three rules.

- Matter-of-fact, not preachy. Read the three rules, then move on quickly.
- "Before we start - three rules. Only devices you personally own. Never interfere with others' devices or experiences. For learning - not piracy, not profit."
- Don't dwell. The audience gets it.

## 04 - The cheap console.

- This slide does double duty as both the section opener and the device intro. Let the "Lock 1" label land before you start talking.
- Introduce the device. Cheap handheld, preloaded with games.
- The big reveal: "It runs Linux." Pause on this - it's the hook.
- DFU mode: "It even has a firmware recovery mode. So if we brick it, we can recover. Great for exploration."

## 05 - I opened it up.

- "I opened it up. And I spotted something interesting..."
- Let the audience look at the photo for a moment before moving on.
- You're teasing the UART pads here - don't explain yet.

## 06 - A serial debug port,left behind by the manufacturer.

- This is the reveal. Show them what you spotted.
- Walk through the three pads: TX is data out, RX is data in, GND is shared ground.
- Point out the square pad: "The square pad is usually ground. It helps you orient the pins."
- The tip: "Not sure which is which? A multimeter will show voltage fluctuations on the active pads."

## 07 - How it works.

- Now explain the protocol behind the pads.
- "Two wires, TX and RX, cross-connected at an agreed baud rate. No clock wire - the timing is encoded in the signal itself."
- Walk through the waveform: idle high, start bit pulls low, 8 data bits LSB first, stop bit returns high.
- "8N1 - 8 data bits, no parity, 1 stop bit. The most common configuration."

## 08 - Connected. Got a shell.

- This is the payoff. The concept we just learned has immediate practical application.
- Walk through the terminal: "We're in U-Boot - that's the bootloader. We can see the boot arguments, we can see it's Linux."
- The `ums` command: "U-Boot can act as a USB mass storage gadget. The eMMC appears as an external drive on our host machine. We dump the whole thing with `dd`."
- This gives us the firmware to analyse.

## 09 - A firmware image is built from independent parts

- Pause here - we're about to analyse the firmware, so the audience needs to know what they're looking at.
- Walk across the three cards left to right: bootloader runs first, then kernel, then rootfs which has everything else.
- Emphasise the different origins: "Each part comes from a different source - and has a different attack surface. The bootloader and rootfs are vendor-written. The kernel is upstream Linux with vendor patches."
- The size bar reinforces how much bigger the rootfs is.

## 10 - Undoing the compiler.

- Set up the concept: source code gets compiled into a binary. We don't have the source. Tools like Ghidra can disassemble the binary back into something readable.
- Walk across the three columns: source, compiled binary (just hex bytes), disassembly.
- "We don't get the source back exactly - but we get enough to understand what the code is doing."
- This is a framing slide. Ghidra comes back later with a concrete example.

## 11 - binwalk shows us the likely contents of a binary image

- "Binwalk scans for known signatures - it tells us what it recognises, and what it can't explain."
- Two results side by side: the kernel image is readable (identifiable structures), the rootfs is opaque (high entropy).
- Key point: "The kernel is readable. The rootfs is not."
- This naturally leads to: what does "high entropy" actually mean?

## 12 - Randomness reveals structure.

- Worth spending a moment on. Entropy is a measure of randomness.
- Point to the two visualisations: "Low entropy on the left - you can see patterns, structure. That's the kernel. High entropy on the right - uniform noise. That's the encrypted rootfs."
- "The rootfs reads as near-random - it's encrypted. But the kernel? Low entropy. We can analyse it."
- The audience should now understand why we focus on the kernel.

## 13 - Strings + Ghidra leads straight to the key.

- This is the detective work. Three steps, walk through each.
- Step 1: "We run `strings` on the kernel binary. It pulls out anything that looks like text. One result jumps out - `squashfs_decrypt_bh_to_actor`. That function name doesn't exist in any upstream Linux source."
- Step 2: "We load the kernel into Ghidra and find that function. It decompiles into something readable - and it's calling AES decrypt with a fixed key."
- Step 3: "The key is a hardcoded constant baked into the binary. Anyone with the firmware has it."
- Let the discovery box land: the rootfs was never truly secret - just obscured.

## 14 - We have the key.

- Celebrate briefly. "We have the key. Decrypt and repack the rootfs. First lock picked."
- Then the reflection: "How could they have done better? Store the key in a secure element - hardware designed to protect secrets. But that adds cost to every unit. On a cheap console, that's a real trade-off."
- This sets up device 2: same manufacturer, but they've spent more money.

## 15 - The expensive console.

- Same manufacturer, more expensive. Let the "Lock 2" label do its work.
- "Same encryption scheme, but this time the chip has hardware encryption. The key isn't in the firmware - it lives in secure hardware registers, read at runtime."
- This is the escalation: the trick from device 1 won't work here.

## 16 - Not all code runs equal.

- Concept aside. Clear but not over-explained.
- Walk through the diagram: "Your apps run at the top - user land, EL0. They can't access hardware directly."
- "The kernel runs at EL1. It manages hardware, enforces access. A kernel module can reach the secure registers."
- Key point: "We need to be the kernel. We need a kernel module - but the kernel won't load unsigned ones."

## 17 - Pick your battle carefully.

- Two options. Walk through why one is hard and the other is easy.
- "Could we attack Linux's access controls? Battle-tested across decades. Spread across too many places to patch reliably."
- "But the manufacturer's signing check? Custom code, not in upstream Linux. Younger, less tested. One function to patch out."
- "And there's no boot-chain verification - so we can modify the kernel on disk before it ever boots."

## 18 - Escalate, then load.

- Two-step process. Keep it tight.
- "Step one: exploit a CVE to escalate from user level to kernel level at runtime."
- "Step two: load our kernel module. The signing check is patched out, so it loads. It reads the key from the secure registers."
- You might briefly explain what a CVE is if the audience needs it: a publicly disclosed vulnerability with a tracking number.

## 19 - Key extracted. Second lock picked.

- "Key extracted. Second lock picked."
- Reflection: "How could they have done better? Keep the kernel up to date - a patched kernel has no known CVE. And verify the boot chain so we can't tamper with the kernel on disk."
- "Both cost development time and testing. Trade-off." - This directly sets up device 3.

## 20 - The signed console.

- "Our third lock. This time, they've done what we said they should."
- Pause. The audience should feel the escalation.
- "Every byte of firmware is cryptographically verified before it runs. The public key is burned into hardware at the factory. The private key never leaves the build system."

## 21 - Every step checks the next.

- Important concept. Take your time.
- Walk through the chain left to right: "ROM is the root of trust. It verifies the bootloader. Bootloader verifies the kernel. Kernel verifies the rootfs."
- Point to the hash demonstration: "Change one byte and you get a completely different hash. The signature is invalid. The device halts."
- "We can't patch the kernel on disk, swap the rootfs, or inject code. The chain catches it."

## 22 - The private key is nowhere on the device.

- Explain why we can't just extract the signing key.
- "The private key stays in the manufacturer's build system. It never ships on the device - not even in hardware. It signs every firmware release."
- "The public key is burned into an eFuse on the chip. Written once - physically impossible to overwrite. It can verify signatures, but it can't create them."
- "There's nothing to extract. The key that matters never exists on the device."

## 23 - Our previous approach is blocked.

- Acknowledge that our previous approach is completely blocked.
- "Tamper the kernel on disk? Boot chain catches it. Device won't boot." - The strikethrough on the slide reinforces this visually.
- Then the question: "What isn't covered by signing?"
- "Splash logos - branding images loaded during boot. Processed by the bootloader, but not part of the signed chain."
- This should feel like a small crack in the wall.

## 24 - Instructions are just bytes in memory.

- Before we can explain the buffer overflow, the audience needs to understand how code executes.
- "Instructions are just bytes sitting in memory. The processor has a program counter - the PC - that points to the current instruction."
- Point to the memory rows: "It reads the instruction, executes it, moves to the next address. Your program is just the PC walking through memory."
- Key takeaway: "Control what the PC points to, and you control what the processor does."

## 25 - Spill into the instructions.

- Two-panel visual. Walk through both.
- Normal: "The software allocates a buffer for input. The input fits. Everything is fine."
- Overflow: "But if the input is larger than the buffer, and the software doesn't check the size, it spills past the buffer and overwrites the instructions the processor is about to execute."
- "By controlling the overflow, we control what the processor does next."
- Foundational security concept. Let it breathe.

## 26 - Throw enough at it. Something will break.

- "How do we find a buffer overflow? We could read the code line by line. Or we could throw thousands of malformed inputs at it and see what crashes."
- "A crash means the software did something unexpected. And unexpected behaviour is exploitable."
- AFL: "American Fuzzy Lop. It mutates inputs intelligently - tracks which code paths they hit, steers towards unexplored territory."
- The punchline: "We pointed AFL at the bootloader's splash logo parser."

## 27 - Found a buffer overflow in the logo parser.

- This is the climax of the talk. Three steps, left to right.
- "Time of check: the boot chain verifies everything. All good."
- "Time of use: we overflow the logo buffer, overwriting the verified instructions before they execute."
- "Our code runs. The processor executes our instructions. The chain approved something else entirely."
- Let this land. It's a satisfying twist.

## 28 - Unsigned code running. Key extracted.

- "Unsigned code running. Key extracted. Third lock picked."
- Keep it brief. No reflection box on this slide - that comes next as a broader point.

## 29 - They didn't get smarter.The risk changed.

- This is the "so what" of the entire talk. Slow down.
- "They didn't get smarter. The risk changed."
- Device 1: "A secure element costs money per unit, multiplied across hundreds of thousands. Against a handful of hobbyists? Not a good trade."
- Device 2: "Kernel updates and boot-chain verification cost development time. Against a few curious people? Not worth it."
- Device 3: "Some of those curious people turned to piracy. The risk became commercial. Then the investment was justified."

## 30 - Security is an arms race,driven by economicsas much as technology.

- Land the arrow. This is what you want them to remember.
- "Security is an arms race, driven by economics as much as technology."
- "Understanding how systems are built - and broken - makes you a better engineer. Whatever you're building."
- Pause. Don't rush to "any questions". Let the last line sit.
- Then: "I'll take questions."
