const fs = require('fs');

const targetHTML = `
                <div class="hero-visual" id="hero-visual" data-reveal="left" data-parallax="0.08">
                    <!-- The new massive SVG circuit hand wrapper -->
                    <div class="hero-stack" style="position: absolute; inset: 0; width: 100%; height: 100%; min-width: 100%; min-height: 100%;">
                        <div class="hero-hand layer" id="hero-hand" data-depth="32" style="position: absolute; width: 150%; height: 150%; left: -25%; top: -25%; transform: rotate(-5deg);">
                            <div class="hand-core" aria-hidden="true" style="width: 100%; height: 100%; transform: none; position: relative;">
                                <svg class="circuit-hand-svg" viewBox="0 0 1000 1200" role="img" preserveAspectRatio="xMidYMid meet">
                                    <defs>
                                        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="8" result="blur"></feGaussianBlur>
                                            <feMerge>
                                                <feMergeNode in="blur"></feMergeNode>
                                                <feMergeNode in="SourceGraphic"></feMergeNode>
                                            </feMerge>
                                        </filter>
                                        <filter id="intenseGlow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur>
                                            <feMerge>
                                                <feMergeNode in="blur"></feMergeNode>
                                                <feMergeNode in="blur"></feMergeNode>
                                                <feMergeNode in="SourceGraphic"></feMergeNode>
                                            </feMerge>
                                        </filter>
                                        <linearGradient id="traceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stop-color="#8ef3ea"></stop>
                                            <stop offset="60%" stop-color="#54ddd7"></stop>
                                            <stop offset="100%" stop-color="#2c8bff"></stop>
                                        </linearGradient>
                                        <linearGradient id="faintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stop-color="#47b8ff" stop-opacity="0.12"></stop>
                                            <stop offset="100%" stop-color="#8ef3ea" stop-opacity="0.04"></stop>
                                        </linearGradient>
                                    </defs>

                                    <!-- Faint ambient glow shapes mapping the hand structure -->
                                    <path d="M 400 950 L 320 700 L 250 500 L 400 450 L 480 300 L 520 450 L 650 480 L 680 750 Z" fill="url(#faintGrad)" filter="url(#neonGlow)"/>

                                    <!-- Circuit lines extending out to chips -->
                                    <g stroke="url(#traceGrad)" stroke-width="2.5" fill="none" opacity="0.45" filter="url(#neonGlow)">
                                        <!-- Top Left to Python -->
                                        <path d="M 400 450 L 300 350 L 100 350" />
                                        <!-- Right to JS -->
                                        <path d="M 650 480 L 750 580 L 950 580" />
                                        <!-- Bottom Right to AI Systems -->
                                        <path d="M 680 750 L 780 850 L 950 850" />
                                    </g>

                                    <!-- Outer Wireframe Robot Hand structure -->
                                    <g stroke="#3a8bbd" stroke-width="2.5" fill="none" opacity="0.45">
                                        <!-- Thumb outer -->
                                        <path d="M 280 880 L 220 700 L 150 500 L 120 480 L 180 430 L 250 580 L 380 700" />
                                        <path d="M 120 480 L 150 460 L 220 620 L 360 800" />
                                        <!-- Index outer -->
                                        <path d="M 380 700 L 320 500 L 280 300 L 240 100 L 290 80 L 350 350 L 410 500 L 420 700" />
                                        <!-- Middle outer -->
                                        <path d="M 420 700 L 410 500 L 430 250 L 450 50 L 500 40 L 490 280 L 470 500 L 480 700" />
                                        <!-- Ring outer -->
                                        <path d="M 480 700 L 470 500 L 520 280 L 580 80 L 630 100 L 580 350 L 520 530 L 540 700" />
                                        <!-- Pinky outer -->
                                        <path d="M 540 700 L 520 530 L 610 380 L 680 200 L 730 250 L 660 480 L 580 620 L 600 750" />
                                        <!-- Palm main borders -->
                                        <path d="M 280 880 L 450 950 L 650 880 L 700 700 Z" />
                                        <!-- Wrist base-->
                                        <path d="M 280 880 L 220 1150 M 650 880 L 680 1150 M 450 950 L 450 1150" />
                                    </g>

                                    <!-- Inner PCB traces -->
                                    <g stroke="url(#traceGrad)" stroke-width="4.5" stroke-linecap="square" fill="none" class="trace-pulse" filter="url(#intenseGlow)">
                                        <!-- Thumb Trace -->
                                        <path d="M 150 500 L 220 680 L 310 750 L 310 900" />
                                        <path d="M 180 430 L 260 550 L 350 680 L 350 850" />
                                        
                                        <!-- Index Trace -->
                                        <path d="M 260 150 L 300 350 L 320 480 L 380 680 L 400 850" />
                                        <path d="M 280 300 L 310 400 L 400 500 L 400 650" />
                                        
                                        <!-- Middle Trace -->
                                        <path d="M 460 100 L 450 300 L 430 480 L 440 680 L 460 900 L 460 1100" />
                                        <path d="M 480 350 L 460 450 L 465 650 L 490 850" />

                                        <!-- Ring Trace -->
                                        <path d="M 600 150 L 550 350 L 500 500 L 490 680 L 520 850 L 500 1100" />
                                        <path d="M 520 280 L 485 450 L 480 580" />

                                        <!-- Pinky Trace -->
                                        <path d="M 700 250 L 630 450 L 560 600 L 550 780 L 580 900" />
                                        <path d="M 610 380 L 540 500 L 530 650" />

                                        <!-- Deep Palm Cross-Traces (45-degree angle PCB routing styling) -->
                                        <path d="M 310 750 L 400 750 L 440 800 L 490 800 L 550 750" />
                                        <path d="M 350 850 L 400 850 L 460 900 L 520 850 L 580 900" />
                                    </g>

                                    <!-- Bright Active Nodes -->
                                    <g fill="#ffffff" filter="url(#intenseGlow)" class="node-blink-group">
                                        <!-- Thumb -->
                                        <circle cx="150" cy="500" r="7" class="node-pulse"></circle>
                                        <circle cx="180" cy="430" r="6"></circle>
                                        <circle cx="220" cy="680" r="5" class="node-pulse-fast"></circle>
                                        <circle cx="310" cy="750" r="8"></circle>

                                        <!-- Index -->
                                        <circle cx="260" cy="150" r="6" class="node-pulse"></circle>
                                        <circle cx="300" cy="350" r="8"></circle>
                                        <circle cx="320" cy="480" r="7" class="node-pulse-fast"></circle>
                                        <circle cx="380" cy="680" r="9"></circle>

                                        <!-- Middle -->
                                        <circle cx="460" cy="100" r="8" class="node-pulse-fast"></circle>
                                        <circle cx="450" cy="300" r="9"></circle>
                                        <circle cx="430" cy="480" r="7"></circle>
                                        <circle cx="440" cy="680" r="10" class="node-pulse"></circle>

                                        <!-- Ring -->
                                        <circle cx="600" cy="150" r="6"></circle>
                                        <circle cx="550" cy="350" r="8" class="node-pulse-fast"></circle>
                                        <circle cx="500" cy="500" r="7"></circle>
                                        <circle cx="490" cy="680" r="9"></circle>

                                        <!-- Pinky -->
                                        <circle cx="700" cy="250" r="7" class="node-pulse"></circle>
                                        <circle cx="630" cy="450" r="8"></circle>
                                        <circle cx="560" cy="600" r="6"></circle>
                                        <circle cx="550" cy="780" r="9" class="node-pulse-fast"></circle>

                                        <!-- Central Palm -->
                                        <circle cx="440" cy="800" r="12" class="node-pulse" fill="#efffff"></circle>
                                        <circle cx="490" cy="800" r="8"></circle>
                                        <circle cx="400" cy="850" r="10" class="node-pulse-fast"></circle>
                                        <circle cx="460" cy="900" r="10"></circle>
                                        <circle cx="520" cy="850" r="8"></circle>
                                        <circle cx="580" cy="900" r="9" class="node-pulse"></circle>

                                        <!-- Anchor nodes connected to chips -->
                                        <circle cx="100" cy="350" r="9" class="node-pulse-fast"></circle>
                                        <circle cx="950" cy="580" r="9" class="node-pulse-fast"></circle>
                                        <circle cx="950" cy="850" r="9" class="node-pulse"></circle>
                                    </g>
                                </svg>
                            </div>
                        </div>

                        <!-- Absolute positioned Chips mapped to the new layout -->
                        <div class="orbital-chip chip-fixed" style="top: -2%; left: -5%;">
                            <i class="fab fa-python"></i>
                            <span>Python</span>
                        </div>
                        <div class="orbital-chip chip-fixed" style="top: 38%; right: -25%;">
                            <i class="fab fa-js"></i>
                            <span>JavaScript</span>
                        </div>
                        <div class="orbital-chip chip-fixed" style="bottom: 12%; right: -25%;">
                            <i class="fas fa-brain"></i>
                            <span>AI Systems</span>
                        </div>
                    </div>
                </div>
`;

let html = fs.readFileSync('/home/aman/Downloads/portfolio/index.html', 'utf8');

// The replacement logic. We strip everything out of <div class="hero-visual"...> down to its closing tag safely.
const startIndex = html.indexOf('<div class="hero-visual"');
// Find the exact matching closing div for hero-visual.
let remaining = html.slice(startIndex);
let depth = 0;
let endIndex = -1;
let tagRegex = /"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'|<!--([\s\S]*?)-->|<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi;
let match;
while ((match = tagRegex.exec(remaining)) !== null) {
    if(match[6] === undefined && match[7] && match[7].toLowerCase() === 'div') { // opening div
        depth++;
    } else if(match[6] === '/' && match[7] && match[7].toLowerCase() === 'div') { // closing div
        depth--;
        if (depth === 0) {
            endIndex = startIndex + match.index + match[0].length;
            break;
        }
    }
}

if(endIndex > -1){
    const cleanOutput = html.slice(0, startIndex) + targetHTML + html.slice(endIndex);
    fs.writeFileSync('/home/aman/Downloads/portfolio/index.html', cleanOutput, 'utf8');
}


