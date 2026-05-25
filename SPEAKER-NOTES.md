# Speaker Notes

Notes per slide. Not a script - prompts and key points to hit. Know the material; use these to stay on track.

---

## 00 - Title

- Let this sit for a moment. Don't rush into speaking.
- "Let's hack a games console."

## 01 - Opening (toy photo)

- Personal story. Keep it warm and brief.
- "When I was a kid, I used to take things apart to see how they worked. Radios, toys, anything with screws I could get at. I wanted to know what was inside."
- The photo should do the heavy lifting here.

## 02 - Bridge

- Transition from childhood to now.
- "That curiosity never stopped. It just found new targets."
- Set up the structure: three devices, each harder than the last. Same approach every time - be curious, be persistent.
- This is the arrow for the whole talk. Plant it here, reinforce it at the end.

## 03 - Ground rules

- Matter-of-fact, not preachy. Read the three rules, then move on quickly.
- "Before we start - three rules I follow. Only devices I own. Never interfere with anyone else's device or experience. And this is for learning - not piracy, not profit."
- Don't dwell. The audience gets it.

## 04 - Lock 1: The cheap console

- Section title. Brief pause.
- "Our first lock."

## 05 - Device 1

- Introduce the device. Cheap handheld, comes preloaded with games.
- The big reveal: "It runs Linux." Pause on this - it's the hook.
- DFU mode: "It even has a firmware recovery mode. So if we brick it, we can always recover. That makes it a great device to experiment with."

## 06 - PCB photo

- "I opened it up. And I spotted something interesting on the circuit board."
- Let the audience look at the photo for a moment before moving on.
- You're teasing the UART pads here - don't explain yet.

## 07 - UART: what is it?

- Concept aside starts here.
- "UART - Universal Asynchronous Receiver-Transmitter. It's a serial debug port, and the manufacturer left it on the production board."
- Two key points: it's a simple two-wire protocol, and manufacturers use it during development. They often don't bother removing the pads from production units.

## 08 - Spotting UART on a PCB

- Walk through the two variants: 3-pin and 4-pin.
- Point out the square pad: "One pad is usually square - that's ground. It helps you orient the pins."
- TX is data out from the device, RX is data in. GND is shared ground. VCC is power - usually not needed.
- The tip: "Not sure which pin is which? Use a logic analyser. If you haven't got one, a multimeter works - watch for voltage fluctuations on each pad."

## 09 - How UART works

- Keep this brief. Three boxes, three points.
- Baud rate: both sides agree on a speed. Common one is 115200.
- TX/RX: they cross over - TX on the device connects to RX on your adapter.
- Hardware: a cheap USB-to-serial adapter. Five quid on Amazon.

## 10 - Connected. Got a shell.

- This is the payoff from the UART aside. The concept we just learned has immediate practical application.
- Walk through the terminal output: "We're in U-Boot - that's the bootloader. We can see it's Linux. Let's dump the firmware."
- Mention the safety net: "DFU mode means we can always reflash. Bricking is nearly impossible."

## 11 - What's inside a firmware image?

- Pause before this slide - we're about to analyse the firmware, so the audience needs to know what they're looking at.
- Walk across the partition bar left to right: bootloader runs first, then kernel, then the root filesystem which has everything else - applications, config, games.
- "The firmware dump is all of these concatenated into one big binary blob. We need to pull them apart." - This sets up binwalk on the next slide.

## 12 - Code you can't read (reverse engineering)

- Set up the concept: source code gets compiled into a binary. We don't have the source, but tools like Ghidra can disassemble the binary back into something we can read.
- "We don't get the source back exactly - but we get enough to understand what the code is doing."
- This is a high-level framing slide. Ghidra comes back later with a concrete example.

## 13 - Binwalk

- "Binwalk is like a Swiss Army knife for firmware. Point it at a binary and it tells you what's inside."
- Walk through the output: we can see a Linux kernel at the start, and then high-entropy data further in.
- Key point: "The kernel is readable. The rootfs is not."
- This naturally leads to: what does "high entropy" actually mean?

## 14 - Entropy

- This is a concept worth spending a moment on. Entropy is a measure of randomness.
- Low entropy: structured, readable data. Text files, source code, an uncompressed kernel.
- High entropy: compressed or encrypted data. Looks like random noise.
- "The rootfs reads as near-random - it's encrypted. But the kernel is low entropy. We can analyse it."
- The audience should now understand why we're going to focus on the kernel.

## 15 - Ghidra comparison

- This is the detective work. We extracted the kernel and loaded it into Ghidra.
- "I compared our kernel against a known Linux kernel. Most of it is identical - but there are differences."
- Point to the key difference: the SquashFS decompression function has an extra parameter - a key.
- "There's a custom encryption implementation bolted onto SquashFS. And the key is right there in the code."
- Let that land. This is the "aha" moment for device 1.

## 16 - Lock 1 win

- Celebrate briefly. "We have the key. We can decrypt and repack the rootfs. First lock picked."
- Then the reflection: "How could they have done better? A secure element - dedicated hardware to protect secrets. But that adds cost to every unit. On a cheap console, that's a real trade-off."
- This sets up device 2: same manufacturer, but they've spent more money.

## 17 - Lock 2: The expensive console

- Section title. "Our second lock."
- Brief pause before moving on.

## 18 - Device 2

- Same manufacturer, more expensive device.
- "Same encryption scheme, but this time the chip has hardware encryption. The key isn't in the firmware - it lives in secure hardware registers, read at runtime."
- This is the escalation: the trick from device 1 won't work here.

## 19 - Exception levels

- Concept aside. This needs to be clear but not over-explained.
- Walk down the layers: "Your apps run at the top - user land. They can request things from the kernel, but they can't access hardware directly."
- "The kernel runs at a higher privilege level. It manages hardware, enforces access. The secure registers sit below that."
- Key point: "A normal program can't read the secure registers. We need to be the kernel. We need a kernel module - but the kernel won't load unsigned ones."

## 20 - The approach

- Two options presented. Walk through why one is hard and the other is easy.
- "Could we patch passwd and Linux's access controls? Too hard. That code is battle-tested and spread across the entire kernel."
- "But the manufacturer's code-signing check? That's custom code, hastily added. Much easier to find and patch out."
- "Now the kernel accepts unsigned modules. But we still need to escalate to kernel level at runtime - and that's where the CVE comes in."
- You might briefly explain what a CVE is if the audience needs it: a publicly disclosed vulnerability with a tracking number.

## 21 - Escalate, then load

- Two-step process. Keep it tight.
- "Step one: exploit the CVE to escalate from user level to kernel level."
- "Step two: load our custom kernel module. It reads the key from the secure registers."

## 22 - Lock 2 win

- "Second lock picked."
- Reflection: "How could they have done better? Keep the kernel up to date - a patched kernel has no known CVE. And verify the boot chain so we can't tamper with the kernel on disk."
- "Both cost development time and testing. Trade-off." - This directly sets up device 3.

## 23 - Lock 3: The signed console

- "Our third lock. This time, they've done what we said they should."
- Pause. The audience should feel the escalation.

## 24 - Signed boot chain

- This is an important concept aside. Take your time.
- Walk through the chain visually, left to right: "ROM verifies the bootloader. Bootloader verifies the kernel. Kernel verifies the rootfs."
- "If any link fails verification, the device refuses to boot. We can't tamper with the kernel on disk any more."

## 25 - Keys

- Explain why we can't just extract the signing key.
- "The private key stays in the manufacturer's build system. It never ships on the device - not even in hardware."
- "The public key is burned into an eFuse on the chip at the factory. Written once - physically impossible to overwrite. It can verify signatures, but it can't create them."
- "There's nothing to extract. The key that matters never exists on the device."

## 26 - The wall

- Acknowledge that our previous approach is completely blocked.
- "Tamper the kernel on disk? Boot chain catches it. Device won't boot."
- Then the question: "What isn't covered by signing?"
- "Splash logos - branding images loaded during boot. The bootloader processes them, but they're not part of the signed chain."
- This should feel like a small crack in the wall.

## 27 - Instructions in memory

- Before we can explain the buffer overflow, the audience needs to understand how code executes.
- "Instructions are just bytes sitting in memory. The processor has a program counter - the PC - that points to the current instruction."
- "It reads the instruction, executes it, moves to the next one. Your program is just the PC walking through memory."
- Key takeaway: "Control what the PC points to, and you control what the processor does."

## 28 - Buffer overflow

- Two-panel visual. Walk through both.
- Normal: "The software allocates a buffer for input. The input fits. Everything is fine."
- Overflow: "But if the input is larger than the buffer, and the software doesn't check the size, it spills over into adjacent memory. That adjacent memory might contain instructions the processor is about to execute."
- "By controlling the overflow, we control what the processor does next."
- This is a foundational security concept. Let it breathe.

## 29 - Fuzzing

- "How do we find a buffer overflow? We could read the code line by line. Or we could throw thousands of malformed inputs at it and see what crashes."
- "A crash means the software did something unexpected. And unexpected behaviour is exploitable."
- AFL: "American Fuzzy Lop. It mutates inputs intelligently - tracks which code paths they hit, steers towards unexplored territory."
- The punchline: "We pointed AFL at the bootloader's splash logo parser."

## 30 - TOCTOU

- This is the climax of the talk. Three steps, left to right.
- "Time of check: the boot chain verifies everything. All good."
- "Time of use: we overflow the logo buffer, overwriting the verified instructions before they execute."
- "The processor runs our code. The chain approved something else entirely."
- Let this land. It's a satisfying twist.

## 31 - Lock 3 win

- "Third lock picked. We're running unsigned code. We can extract the key from the secure registers."
- No reflection box on this slide - that comes on the next slide as a broader point.

## 32 - Security is a trade-off

- This is the "so what" of the entire talk. Slow down.
- "These manufacturers didn't get smarter. The risk changed."
- Device 1: "A secure element costs real money per unit, multiplied across hundreds of thousands of devices. Against a handful of hobbyists? Not a good trade."
- Device 2: "Kernel updates and boot chain verification cost development time. Against a few curious people? Not worth it."
- Device 3: "Some of those curious people turned to piracy. The risk became commercial. Then the investment was justified."

## 33 - Close

- Land the arrow. This is what you want them to remember.
- "Security is an arms race, driven by economics as much as technology."
- "Understanding how systems are built - and broken - makes you a better engineer. Whatever you're building."
- Pause. Don't rush to "any questions". Let the last line sit.
- Then: "I'll take questions."
