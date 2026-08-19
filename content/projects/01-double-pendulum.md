---
name: Double Pendulum
blurb: "Chaos, simulated on the GPU with WebGPU compute shaders."
alt: "The double pendulum simulator: rod and bob controls on the left, a live pendulum trace, and a rainbow phase map of its chaotic sensitivity"
href: "https://www.pendulum.williamragnarsson.com"
linkLabel: Live demo
stack: [WebGPU, Compute shaders, TypeScript, Next.js]
focal: top
---

A double pendulum is the textbook example of chaos: change the starting angle by a hundredth of a degree and the arm ends up somewhere completely different. Simulating one is easy. Simulating enough of them to actually see that sensitivity is not.

This runs thousands at once as a WebGPU compute shader and paints the result as a phase map — every pixel is one starting condition, coloured by where that pendulum ended up. The rainbow structure is the chaos itself, drawn.
