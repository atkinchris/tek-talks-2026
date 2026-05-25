# Notes for the plan

We are going to design a talk, with presentation slides, that I can give to an engineering community. There will be ~100 people in the audience, primarily engineers of all levels, but also some other technically interested people - like PMs, designers and managers.

The talk is an escalating introduction to hardware hacking, based on my own experience and career. It will run for about 30 minutes, with a Q&A afterwards.

Through the talk we're going to introduce how to hardware penetration test devices. I need to start with setting groundrules - this is only for devices you personally own, never on devices which could interfere with others or impact their experiences, and only for personal learning not piracy or profit.

I will then open with a personal introduction. This will be about how I took apart toys as a child to understand how they worked, and this curiosity extends into my career.

We'll move onto the first example device. A low cost, handheld games console, preloaded with some games. For this section, we'll explain why its interesting (Linux based) and how we approach recon and finding more about it. We briefly cover DFU mode, and then move on to disassembling it. We have an aside here to talk about UART - showing how to spot it on a PCB, what its for and at a high level how it works. We then ground this back into the device - using UART to get U-Boot shell on the device - confirming it is Linux, and dumping the firmware. This serves two purposes - to give us more surface to explore, and to rollback if we mess up. Explain that many of these devices have DFU or maskrom mode, which means if you have an MMC image, bricking them becomes very hard.

From here, we'll move into software side of things. Introduce reverse engineering, by talking about how code compiles to assembly in binaries, and how tools like Ghidra can help us disassemble binaries and understand the original code. We'll talk about binary analysis of the firmware, using Binwalk. We'll have an aside here to visually introduce the concept of entropy - and how it can indicate compressed or encrypted data. We'll then ground this back into the device - using Binwalk to prove the rootfs is encrypted, and to extract the kernel from the boot partition, and then Ghidra to compare it to a known Linux kernel and find find the differences. This will lead us to finding the custom SquashFS encryption implementation, and the key used to encrypt the rootfs.

This will be our first "win" - we have the key, and can now decrypt and repack the rootfs. We'll talk about how they could have done this better - by using a secure element to store the key, but that this is a trade off for cost.

We'll then move into a more expensive handheld games console, from the same manufacturer. This one uses the same encryption scheme - but it's chip supports hardware encryption. We'll talk about how the key is stored in the device, so we can't extract it from the firmware. We'll talk about how we need to run code on the device to get the key - and to do that, we need to find an exploit for code execution. We'll talk about how we can use recon into the firmware to find attack surfaces - old versions of libraries with known CVEs. An aside here would introduce ring levels in the kernel, and how we can't read from user-level processes to access secure registers.

We'll ultimately say that we found a CVE in the old version of the kernel used, and leveraged this to get code execution as root on the device. From here, we can write a kernel module to read the key from the secure registers, and then use that to decrypt the rootfs. This is our second "win" - we have the key, and can now decrypt and repack the rootfs. We'll talk about how they could have done this better - by keeping the kernel up to date, but that this is a trade off for cost and development time, and then by signing the firmware and code execution.

We'll then finally move on to talk about a third device, which is a different console from the same manufacturer. This one has the same hardware as the more expensive one, but has a proper signed bootloader chain. Here will take an aside to visually introduce a signed bootloader chain - and how through asymmetric public/private keys, we can verify the integrity of the full chain - from bootloader to kernel. We'll then talk about fuzzing - introducing the concept of fuzzing, and how it can be used to find vulnerabilities in code. We'll talk about how we can use AFL to fuzz the bootloader, and how we found a vulnerability that allows us to bypass signature verification. This is our third "win" - we can now run unsigned code on the device, and extract the key from the secure registers to decrypt the rootfs. We'll talk about how they could have done this better - but that ultimately security is a trade off, and they likely made the right decision for their threat model and resources, cat and mouse.

## Implementation

Slides should be HTML, using minimal text and visuals where possible. I will use the talk to verbally explain the concepts, and the slides to visually support this.

We need a workflow where we can screenshot/convert HTML to images, so the slides can be used in a presentation software like PowerPoint or Keynote.
